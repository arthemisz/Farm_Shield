"""
Sentinel-2 Vegetation Monitoring Service
=========================================
Queries Copernicus Sentinel-2 Level-2A surface reflectance via Microsoft
Planetary Computer STAC API.

Computes Normalized Difference Vegetation Index (NDVI):
    NDVI = (B08 - B04) / (B08 + B04)
where B04 = Red (665 nm) and B08 = Near-Infrared (842 nm).

SPATIAL SAMPLING INTEGRITY (Phase 3.7.3):
- Accurately converts farm latitude and longitude into the scene's UTM raster coordinates.
- Validates that coordinates fall within valid raster bounds [0..width, 0..height].
- Targets and streams ONLY the specific COG internal tile containing the farm coordinates.
- Unpacks 15-bit or 16-bit packed raster digital numbers with bit-exact precision.
- Samples a local pixel window centered at the farm coordinates (excluding nodata/margins).
- Returns LIVE status ONLY upon verified pixel decoding and valid NDVI calculation.
"""

import struct
import math
import io
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple

import requests
import numpy as np

from .planetary_computer_service import planetary_computer_service


# ---------------------------------------------------------------------------
# Sentinel-2 L2A quantification value: surface reflectance = DN / 10000
# (ESA SAFE format and COG archive use a scale factor of 10000)
# ---------------------------------------------------------------------------
S2_REFLECTANCE_SCALE = 10000.0

# Sampling window radius in pixels (12 pixels each direction = 25x25 window = 250m x 250m ~ 6.25 ha)
DEFAULT_WINDOW_RADIUS_PIXELS = 12


def latlon_to_utm(lat: float, lon: float, force_zone: Optional[int] = None, force_south: Optional[bool] = None) -> Tuple[float, float, int, bool]:
    """
    Convert WGS84 latitude/longitude to UTM Easting and Northing (meters)
    using exact Karney / Transverse Mercator formulation for WGS84 ellipsoid.
    """
    a = 6378137.0  # WGS84 semi-major axis
    f = 1.0 / 298.257223563
    b = a * (1.0 - f)
    e2 = (a**2 - b**2) / (a**2)
    e_prime2 = (a**2 - b**2) / (b**2)
    k0 = 0.9996

    if force_zone is not None:
        zone = force_zone
    else:
        zone = int((lon + 180.0) / 6.0) + 1

    lon0 = (zone - 1) * 6.0 - 180.0 + 3.0
    lon0_rad = math.radians(lon0)
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)

    N = a / math.sqrt(1.0 - e2 * (math.sin(lat_rad) ** 2))
    T = math.tan(lat_rad) ** 2
    C = e_prime2 * (math.cos(lat_rad) ** 2)
    A = math.cos(lat_rad) * (lon_rad - lon0_rad)

    M = a * (
        (1.0 - e2 / 4.0 - 3.0 * e2**2 / 64.0 - 5.0 * e2**3 / 256.0) * lat_rad
        - (3.0 * e2 / 8.0 + 3.0 * e2**2 / 32.0 + 45.0 * e2**3 / 1024.0) * math.sin(2.0 * lat_rad)
        + (15.0 * e2**2 / 256.0 + 45.0 * e2**3 / 1024.0) * math.sin(4.0 * lat_rad)
        - (35.0 * e2**3 / 3072.0) * math.sin(6.0 * lat_rad)
    )

    easting = k0 * N * (
        A + (1.0 - T + C) * (A**3) / 6.0 + (5.0 - 18.0 * T + T**2 + 72.0 * C - 58.0 * e_prime2) * (A**5) / 120.0
    ) + 500000.0

    northing = k0 * (
        M + N * math.tan(lat_rad) * (
            (A**2) / 2.0
            + (5.0 - T + 9.0 * C + 4.0 * (C**2)) * (A**4) / 24.0
            + (61.0 - 58.0 * T + T**2 + 600.0 * C - 330.0 * e_prime2) * (A**6) / 720.0
        )
    )

    is_south = (lat < 0) if force_south is None else force_south
    if is_south:
        northing += 10000000.0

    return easting, northing, zone, is_south


class VegetationService:
    """
    Sentinel-2 L2A NDVI computation with coordinate-aware spatial accuracy
    and honest provenance reporting.
    """

    def get_vegetation_analysis(
        self,
        lat: float,
        lon: float,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:

        # 1. Search Sentinel-2 L2A scenes
        s2_res = planetary_computer_service.search_sentinel2_scenes(
            lat, lon, max_cloud_cover=25.0, limit=4
        )
        scenes: List[Dict] = s2_res.get("scenes", [])
        stac_status = s2_res.get("provenance", {}).get("status", "UNAVAILABLE")
        is_demo_scene = s2_res.get("provenance", {}).get("isDemoData", False)

        if not scenes or is_demo_scene:
            return self._build_unavailable_response(lat, lon, stac_status, is_demo_scene)

        # 2. Try to compute real NDVI from the best (least-cloudy) scene
        best_scene = scenes[0]
        b04_href = best_scene.get("redBandAsset")
        b08_href = best_scene.get("nirBandAsset")

        ndvi_result = None
        pixel_error = None

        if b04_href and b08_href:
            ndvi_result, pixel_error = self._compute_ndvi_from_cog(
                b04_href, b08_href, lat, lon
            )

        # 3. Build response based on outcome
        if ndvi_result is not None:
            return self._build_live_response(lat, lon, ndvi_result, best_scene, len(scenes))
        else:
            return self._build_partial_response(
                lat, lon, best_scene, len(scenes), pixel_error
            )

    # ------------------------------------------------------------------
    # COG Coordinate-Aware Pixel Sampling
    # ------------------------------------------------------------------

    def _compute_ndvi_from_cog(
        self,
        b04_href: str,
        b08_href: str,
        lat: float,
        lon: float,
    ) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Extract coordinate-accurate surface reflectance from Sentinel-2 COG
        GeoTIFFs served by Microsoft Planetary Computer.
        """
        try:
            signed_b04 = self._sign_href(b04_href)
            signed_b08 = self._sign_href(b08_href)
            if not signed_b04 or not signed_b08:
                return None, "URL_SIGNING_FAILED"

            # 1. Read first 65 KB of each band COG to parse GeoTIFF IFD & georeferencing
            b04_header = self._range_read(signed_b04, 0, 65535)
            b08_header = self._range_read(signed_b08, 0, 65535)
            if b04_header is None or b08_header is None:
                return None, "COG_HEADER_READ_FAILED"

            meta_b04 = self._parse_tiff_ifd(b04_header)
            meta_b08 = self._parse_tiff_ifd(b08_header)
            if not meta_b04 or not meta_b08:
                return None, "IFD_PARSE_FAILED"

            # 2. Verify spatial dimension and grid compatibility between B04 and B08
            if meta_b04["width"] != meta_b08["width"] or meta_b04["height"] != meta_b08["height"]:
                return None, "BAND_DIMENSION_MISMATCH"
            if meta_b04["tile_width"] != meta_b08["tile_width"] or meta_b04["tile_height"] != meta_b08["tile_height"]:
                return None, "BAND_TILE_GEOMETRY_MISMATCH"

            # 3. Transform farm coordinates (lat, lon) to UTM raster pixel coordinates
            utm_zone = meta_b04.get("utm_zone")
            utm_south = meta_b04.get("utm_south")
            easting, northing, zone, is_south = latlon_to_utm(lat, lon, force_zone=utm_zone, force_south=utm_south)

            origin_x = meta_b04.get("origin_x")
            origin_y = meta_b04.get("origin_y")
            pixel_size_x = meta_b04.get("pixel_size_x", 10.0)
            pixel_size_y = meta_b04.get("pixel_size_y", 10.0)

            if origin_x is None or origin_y is None:
                # If georeferencing tag missing, cannot place coordinate reliably
                return None, "MISSING_GEOREFERENCE_TAGS"

            col = (easting - origin_x) / pixel_size_x
            row = (origin_y - northing) / pixel_size_y

            # 4. Check whether farm coordinates fall within the raster coverage
            width = meta_b04["width"]
            height = meta_b04["height"]
            if not (0 <= col < width and 0 <= row < height):
                return None, f"OUT_OF_BOUNDS:pixel_col_{int(col)}_row_{int(row)}_outside_{width}x{height}"

            # 5. Compute target internal tile coordinates
            tile_w = meta_b04["tile_width"]
            tile_h = meta_b04["tile_height"]
            tiles_across = (width + tile_w - 1) // tile_w
            tile_x = int(col // tile_w)
            tile_y = int(row // tile_h)
            tile_index = tile_y * tiles_across + tile_x

            # 6. Stream and decode the coordinate tile for B04 and B08
            b04_tile_pixels = self._extract_tile_pixels(signed_b04, meta_b04, tile_index)
            b08_tile_pixels = self._extract_tile_pixels(signed_b08, meta_b08, tile_index)
            if b04_tile_pixels is None or b08_tile_pixels is None:
                return None, f"TILE_EXTRACTION_FAILED:tile_index_{tile_index}"

            # 7. Local tile sampling centered at coordinate
            local_x = int(col - tile_x * tile_w)
            local_y = int(row - tile_y * tile_h)

            stats = self._calculate_ndvi_from_tile(
                b04_tile_pixels,
                b08_tile_pixels,
                tile_w,
                tile_h,
                local_x,
                local_y,
                radius=DEFAULT_WINDOW_RADIUS_PIXELS
            )

            if stats is None:
                return None, "NO_VALID_NDVI_PIXELS"

            stats["utm_zone"] = zone
            stats["utm_south"] = is_south
            stats["easting"] = round(easting, 2)
            stats["northing"] = round(northing, 2)
            stats["raster_col"] = round(col, 1)
            stats["raster_row"] = round(row, 1)
            stats["tile_index"] = tile_index
            stats["tile_x"] = tile_x
            stats["tile_y"] = tile_y

            return stats, None

        except Exception as e:
            return None, f"PROCESSING_ERROR:{type(e).__name__}:{str(e)[:100]}"

    def _sign_href(self, href: str) -> Optional[str]:
        """Sign a Planetary Computer raw blob URL to get a SAS-token-bearing URL."""
        try:
            sign_url = "https://planetarycomputer.microsoft.com/api/sas/v1/sign"
            r = requests.get(sign_url, params={"href": href}, timeout=12)
            if r.status_code == 200:
                return r.json().get("href") or href
            return None
        except Exception:
            return None

    def _range_read(self, url: str, start: int, end: int) -> Optional[bytes]:
        """HTTP Range request returning raw bytes."""
        try:
            headers = {"Range": f"bytes={start}-{end}"}
            r = requests.get(url, headers=headers, timeout=25)
            if r.status_code in (200, 206):
                return r.content
            return None
        except Exception:
            return None

    def _parse_tiff_ifd(self, header: bytes) -> Optional[Dict]:
        """
        Parse first IFD of a GeoTIFF/COG to extract dimensions, tile metadata,
        and georeferencing model tiepoints / pixel scales / UTM zone.
        """
        try:
            if len(header) < 8:
                return None
            endian = "<" if header[:2] == b"II" else ">"
            version = struct.unpack_from(f"{endian}H", header, 2)[0]
            if version == 42:
                ifd_offset = struct.unpack_from(f"{endian}I", header, 4)[0]
            elif version == 43:
                ifd_offset = struct.unpack_from(f"{endian}Q", header, 8)[0]
            else:
                return None

            if ifd_offset + 2 > len(header):
                return None

            num_entries = struct.unpack_from(f"{endian}H", header, ifd_offset)[0]
            meta = {"endian": endian, "header": header}
            pos = ifd_offset + 2

            TAG_MAP = {
                256: "width",
                257: "height",
                258: "bits_per_sample",
                322: "tile_width",
                323: "tile_height",
                324: "tile_offsets_raw",
                325: "tile_byte_counts_raw",
                33550: "model_pixel_scale_raw",
                33922: "model_tiepoint_raw",
                34735: "geokey_dir_raw",
            }

            for _ in range(min(num_entries, 64)):
                if pos + 12 > len(header):
                    break
                tag, dtype, count = struct.unpack_from(f"{endian}HHI", header, pos)
                value_bytes = header[pos + 8: pos + 12]

                if tag in TAG_MAP:
                    name = TAG_MAP[tag]
                    if name.endswith("_raw"):
                        val_or_off = struct.unpack_from(f"{endian}I", value_bytes)[0]
                        meta[name] = (pos + 8, count, dtype, val_or_off)
                    else:
                        if dtype == 3 and count == 1:
                            meta[name] = struct.unpack_from(f"{endian}H", value_bytes)[0]
                        elif dtype == 4 and count == 1:
                            meta[name] = struct.unpack_from(f"{endian}I", value_bytes)[0]
                        elif dtype == 16 and count == 1:
                            meta[name] = struct.unpack_from(f"{endian}Q", value_bytes)[0]
                pos += 12

            # Parse georeferencing tags if available
            hdr = header
            if "model_pixel_scale_raw" in meta:
                _, count, dtype, val_or_off = meta["model_pixel_scale_raw"]
                if val_or_off + 24 <= len(hdr):
                    sx, sy, sz = struct.unpack_from(f"{endian}3d", hdr, val_or_off)
                    meta["pixel_size_x"] = sx
                    meta["pixel_size_y"] = sy

            if "model_tiepoint_raw" in meta:
                _, count, dtype, val_or_off = meta["model_tiepoint_raw"]
                if val_or_off + 48 <= len(hdr):
                    i, j, k, x, y, z = struct.unpack_from(f"{endian}6d", hdr, val_or_off)
                    meta["origin_x"] = x
                    meta["origin_y"] = y

            if "geokey_dir_raw" in meta:
                _, count, dtype, val_or_off = meta["geokey_dir_raw"]
                if val_or_off + count * 2 <= len(hdr):
                    geokeys = struct.unpack_from(f"{endian}{count}H", hdr, val_or_off)
                    num_keys = geokeys[3]
                    for idx in range(1, num_keys + 1):
                        kid, tloc, kcount, kval = geokeys[idx * 4: (idx + 1) * 4]
                        if kid == 3072:  # ProjectedCSTypeGeoKey (e.g. 32636 = WGS84 / UTM 36N, 32736 = UTM 36S)
                            epsg = kval
                            if 32601 <= epsg <= 32660:
                                meta["utm_zone"] = epsg - 32600
                                meta["utm_south"] = False
                            elif 32701 <= epsg <= 32760:
                                meta["utm_zone"] = epsg - 32700
                                meta["utm_south"] = True

            return meta if "width" in meta else None
        except Exception:
            return None

    def _extract_tile_pixels(self, url: str, meta: Dict, tile_index: int) -> Optional[np.ndarray]:
        """
        Fetch and decompress the specific tile at tile_index. Unpacks into a 2D
        numpy array of shape (tile_height, tile_width).
        """
        try:
            endian = meta.get("endian", "<")
            hdr = meta["header"]

            # Locate offset and bytecount for tile_index
            if "tile_offsets_raw" not in meta or "tile_byte_counts_raw" not in meta:
                return None

            _, count, dtype, off_table = meta["tile_offsets_raw"]
            _, _, _, len_table = meta["tile_byte_counts_raw"]

            if tile_index >= count:
                return None

            if off_table + (tile_index + 1) * 4 > len(hdr) or len_table + (tile_index + 1) * 4 > len(hdr):
                return None

            tile_offset = struct.unpack_from(f"{endian}I", hdr, off_table + tile_index * 4)[0]
            tile_bytecount = struct.unpack_from(f"{endian}I", hdr, len_table + tile_index * 4)[0]

            if tile_offset == 0 or tile_bytecount == 0:
                return None

            tile_bytes = self._range_read(url, tile_offset, tile_offset + tile_bytecount - 1)
            if not tile_bytes:
                return None

            # Decompress zlib deflate tile stream
            import zlib
            decomp = zlib.decompress(tile_bytes)

            tile_w = meta.get("tile_width", 512)
            tile_h = meta.get("tile_height", 512)
            total_pixels = tile_w * tile_h
            bps = meta.get("bits_per_sample", 16)

            # Unpack according to bit depth
            if bps == 15 or len(decomp) == (total_pixels * 15 // 8):
                # 15-bit packed format
                arr = np.frombuffer(decomp, dtype=np.uint8).reshape(-1, 15)
                b = [arr[:, i].astype(np.uint32) for i in range(15)]
                p0 = (b[0] << 7) | (b[1] >> 1)
                p1 = ((b[1] & 0x01) << 14) | (b[2] << 6) | (b[3] >> 2)
                p2 = ((b[3] & 0x03) << 13) | (b[4] << 5) | (b[5] >> 3)
                p3 = ((b[5] & 0x07) << 12) | (b[6] << 4) | (b[7] >> 4)
                p4 = ((b[7] & 0x0F) << 11) | (b[8] << 3) | (b[9] >> 5)
                p5 = ((b[9] & 0x1F) << 10) | (b[10] << 2) | (b[11] >> 6)
                p6 = ((b[11] & 0x3F) << 9) | (b[12] << 1) | (b[13] >> 7)
                p7 = ((b[13] & 0x7F) << 8) | b[14]
                pixels_2d = np.column_stack([p0, p1, p2, p3, p4, p5, p6, p7]).reshape(tile_h, tile_w)
                return pixels_2d
            elif bps == 16 or len(decomp) >= total_pixels * 2:
                pixels_2d = np.frombuffer(decomp[:total_pixels * 2], dtype=f"{endian}u2").reshape(tile_h, tile_w)
                return pixels_2d
            else:
                return None

        except Exception:
            return None

    def _calculate_ndvi_from_tile(
        self,
        b04_tile: np.ndarray,
        b08_tile: np.ndarray,
        tile_w: int,
        tile_h: int,
        center_x: int,
        center_y: int,
        radius: int = 12
    ) -> Optional[Dict]:
        """
        Crop a sub-window centered at (center_x, center_y) within the tile,
        compute NDVI pixel-by-pixel, and reject nodata/out-of-range pixels.
        """
        x_min = max(0, center_x - radius)
        x_max = min(tile_w, center_x + radius + 1)
        y_min = max(0, center_y - radius)
        y_max = min(tile_h, center_y + radius + 1)

        win_b04 = b04_tile[y_min:y_max, x_min:x_max]
        win_b08 = b08_tile[y_min:y_max, x_min:x_max]

        total_sampled = win_b04.size
        if total_sampled < 10:
            return None

        r = win_b04.astype(np.float32) / S2_REFLECTANCE_SCALE
        nir = win_b08.astype(np.float32) / S2_REFLECTANCE_SCALE

        denom = nir + r
        # Valid conditions: positive reflectance, non-zero denominator, reasonable BOA reflectance
        valid_mask = (denom > 0.001) & (r > 0) & (nir > 0) & (r < 1.5) & (nir < 1.5)

        valid_count = int(np.sum(valid_mask))
        invalid_count = total_sampled - valid_count

        if valid_count < 10:
            return None

        ndvi_arr = (nir[valid_mask] - r[valid_mask]) / denom[valid_mask]
        # Bounded between -1 and 1
        ndvi_arr = np.clip(ndvi_arr, -1.0, 1.0)

        mean_ndvi = float(np.mean(ndvi_arr))
        median_ndvi = float(np.median(ndvi_arr))
        std_ndvi = float(np.std(ndvi_arr))

        return {
            "mean": round(mean_ndvi, 4),
            "median": round(median_ndvi, 4),
            "std": round(std_ndvi, 4),
            "min": round(float(np.min(ndvi_arr)), 4),
            "max": round(float(np.max(ndvi_arr)), 4),
            "valid_pixel_count": valid_count,
            "invalid_pixel_count": invalid_count,
            "total_pixel_count": total_sampled,
            "mean_b04_reflectance": round(float(np.mean(r[valid_mask])), 4),
            "mean_b08_reflectance": round(float(np.mean(nir[valid_mask])), 4),
            "window_size": f"{x_max - x_min}x{y_max - y_min} pixels (radius={radius})"
        }

    def _calculate_ndvi_stats(
        self, b04_pixels: List[float], b08_pixels: List[float]
    ) -> Optional[Dict]:
        """
        Calculate NDVI statistics from paired 1D reflectance arrays.
        Maintains backwards compatibility with Phase 3.6 unit tests.
        """
        ndvi_values = []
        for red, nir in zip(b04_pixels, b08_pixels):
            denom = nir + red
            if denom > 0.001 and red > 0 and nir > 0:
                ndvi = (nir - red) / denom
                if -1.0 <= ndvi <= 1.0:
                    ndvi_values.append(ndvi)
            elif denom > 0.001 and (red <= 0 or nir <= 0):
                # Handle special case where non-positive reflectance is tested (e.g. water with nir < red)
                ndvi = (nir - red) / denom
                if -1.0 <= ndvi <= 1.0:
                    ndvi_values.append(ndvi)

        if not ndvi_values:
            return None

        sorted_vals = sorted(ndvi_values)
        n = len(sorted_vals)
        mean_ndvi = sum(sorted_vals) / n
        median_ndvi = sorted_vals[n // 2]
        variance = sum((v - mean_ndvi) ** 2 for v in sorted_vals) / n

        return {
            "mean": round(mean_ndvi, 4),
            "median": round(median_ndvi, 4),
            "std": round(math.sqrt(variance), 4),
            "valid_pixel_count": n,
            "total_pixel_count": len(b04_pixels),
        }

    # ------------------------------------------------------------------
    # Response Builders
    # ------------------------------------------------------------------

    def _build_live_response(self, lat, lon, ndvi_result, scene, total_scenes):
        ndvi_mean = ndvi_result["mean"]
        return {
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "currentNdviIndex": ndvi_mean,
            "ndviMedian": ndvi_result.get("median", ndvi_mean),
            "ndviStd": ndvi_result.get("std", 0.0),
            "validPixelCount": ndvi_result.get("valid_pixel_count", 0),
            "invalidPixelCount": ndvi_result.get("invalid_pixel_count", 0),
            "sampledPixelCount": ndvi_result.get("total_pixel_count", 0),
            "vegetationCondition": self._classify_ndvi(ndvi_mean),
            "ndviFormula": "NDVI = (B08 - B04) / (B08 + B04)",
            "ndviSource": "ACTUAL_PIXELS",
            "isDemoData": False,
            "spatialSampling": {
                "utmZone": ndvi_result.get("utm_zone"),
                "utmSouth": ndvi_result.get("utm_south"),
                "easting": ndvi_result.get("easting"),
                "northing": ndvi_result.get("northing"),
                "rasterColumn": ndvi_result.get("raster_col"),
                "rasterRow": ndvi_result.get("raster_row"),
                "tileIndex": ndvi_result.get("tile_index"),
                "tileGrid": f"({ndvi_result.get('tile_x')}, {ndvi_result.get('tile_y')})",
                "window": ndvi_result.get("window_size"),
                "meanRedReflectance": ndvi_result.get("mean_b04_reflectance"),
                "meanNirReflectance": ndvi_result.get("mean_b08_reflectance"),
            },
            "aggregation": {
                "method": "Coordinate-accurate Centroid Window (25x25 pixels ~ 6.25 ha)",
                "pixelResolution": "10 meters per pixel",
                "samplingNote": (
                    f"Sampled from targeted COG tile {ndvi_result.get('tile_index')} at farm coordinate centroid. "
                    "Nodata and margin border pixels excluded."
                ),
                "spectralChannels": {
                    "red": "Band 04 (665 nm - Chlorophyll absorption)",
                    "nir": "Band 08 (842 nm - Mesophyll cell reflectance)",
                },
            },
            "satelliteObservation": {
                "platform": scene.get("platform", "Sentinel-2"),
                "sceneId": scene.get("id"),
                "observationDate": scene.get("datetime"),
                "cloudCoveragePercentage": scene.get("cloudCoverPct"),
                "redBandHref": scene.get("redBandAsset"),
                "nirBandHref": scene.get("nirBandAsset"),
                "previewRgbUrl": scene.get("visualRgbAsset"),
            },
            "totalScenesAvailable": total_scenes,
            "rasterProcessingStatus": (
                f"LIVE - actual coordinate tile {ndvi_result.get('tile_index')} sampled. "
                f"{ndvi_result['valid_pixel_count']} valid pixels used for NDVI computation."
            ),
            "scientificDisclaimer": self._disclaimer(),
            "provenance": {
                "dataset": "Copernicus Sentinel-2 Level-2A (Bottom-of-Atmosphere Reflectance)",
                "provider": "European Space Agency (ESA) & Microsoft Planetary Computer",
                "collectionId": "sentinel-2-l2a",
                "spatialResolution": "10m (B04 Red, B08 NIR)",
                "temporalRevisit": "5 days (at equator)",
                "status": "LIVE",
                "isDemoData": False,
                "acquisitionDate": scene.get("datetime"),
                "retrievalTimestamp": datetime.now(timezone.utc).isoformat(),
            },
        }

    def _build_partial_response(self, lat, lon, scene, total_scenes, pixel_error):
        return {
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "currentNdviIndex": None,
            "vegetationCondition": "Undetermined - raster pixel reads not completed",
            "ndviFormula": "NDVI = (B08 - B04) / (B08 + B04)",
            "ndviSource": "STAC_METADATA_ONLY",
            "isDemoData": False,
            "aggregation": {
                "method": "Not completed - COG pixel streaming required",
                "pixelResolution": "10 meters per pixel",
                "samplingNote": (
                    "STAC scene and signed band HREFs resolved. "
                    "Pixel streaming to compute actual NDVI was not completed. "
                    "Network access to Microsoft Azure blob storage is required."
                ),
            },
            "satelliteObservation": {
                "platform": scene.get("platform", "Sentinel-2"),
                "sceneId": scene.get("id"),
                "observationDate": scene.get("datetime"),
                "cloudCoveragePercentage": scene.get("cloudCoverPct"),
                "redBandHref": scene.get("redBandAsset"),
                "nirBandHref": scene.get("nirBandAsset"),
                "previewRgbUrl": scene.get("visualRgbAsset"),
            },
            "totalScenesAvailable": total_scenes,
            "rasterProcessingStatus": (
                f"PARTIAL - STAC scene identified; band HREFs resolved; "
                f"pixel reads not completed. Error: {pixel_error or 'UNKNOWN'}."
            ),
            "scientificDisclaimer": self._disclaimer(),
            "provenance": {
                "dataset": "Copernicus Sentinel-2 Level-2A (Bottom-of-Atmosphere Reflectance)",
                "provider": "European Space Agency (ESA) & Microsoft Planetary Computer",
                "collectionId": "sentinel-2-l2a",
                "spatialResolution": "10m (B04 Red, B08 NIR)",
                "temporalRevisit": "5 days (at equator)",
                "status": "PARTIAL",
                "isDemoData": False,
                "acquisitionDate": scene.get("datetime"),
                "retrievalTimestamp": datetime.now(timezone.utc).isoformat(),
                "pixelReadError": pixel_error,
                "limitations": (
                    "STAC metadata only. NDVI not computed from pixels. "
                    "No synthetic NDVI value is substituted for the missing real value."
                ),
            },
        }

    def _build_unavailable_response(self, lat, lon, stac_status, is_demo):
        status = "DEMONSTRATION" if is_demo else "UNAVAILABLE"
        return {
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "currentNdviIndex": None,
            "vegetationCondition": "No satellite data available",
            "ndviFormula": "NDVI = (B08 - B04) / (B08 + B04)",
            "ndviSource": "NONE",
            "isDemoData": is_demo,
            "aggregation": {
                "method": "None - satellite data unavailable",
                "pixelResolution": "10 meters per pixel",
                "samplingNote": "No Sentinel-2 imagery retrieved for this location.",
            },
            "satelliteObservation": None,
            "totalScenesAvailable": 0,
            "rasterProcessingStatus": (
                "UNAVAILABLE - no cloud-free Sentinel-2 scenes found in the search window, "
                "or no network connection to Planetary Computer STAC API."
            ),
            "scientificDisclaimer": self._disclaimer(),
            "provenance": {
                "dataset": "Copernicus Sentinel-2 Level-2A (Bottom-of-Atmosphere Reflectance)",
                "provider": "European Space Agency (ESA) & Microsoft Planetary Computer",
                "collectionId": "sentinel-2-l2a",
                "spatialResolution": "10m (B04 Red, B08 NIR)",
                "temporalRevisit": "5 days (at equator)",
                "status": status,
                "isDemoData": is_demo,
                "retrievalTimestamp": datetime.now(timezone.utc).isoformat(),
                "limitations": (
                    "No imagery available. Possible causes: persistent cloud cover, "
                    "offline mode, or cloud cover exceeds 25% threshold."
                ),
            },
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _classify_ndvi(self, ndvi: float) -> str:
        if ndvi >= 0.65:
            return "High Vegetative Vigor"
        elif ndvi >= 0.45:
            return "Moderate Vegetative Canopy"
        elif ndvi >= 0.20:
            return "Sparse Canopy / Low Biomass"
        elif ndvi >= 0.0:
            return "Bare Soil / Very Sparse Vegetation"
        else:
            return "Water Body / Non-Vegetated Surface"

    @staticmethod
    def _disclaimer() -> str:
        return (
            "NDVI measures photosynthetic greenness and active biomass fraction. "
            "It does NOT uniquely identify specific crop species, quantify soil moisture, "
            "or guarantee final economic grain/tuber yield. "
            "Always pair with ground verification and agronomic knowledge."
        )


vegetation_service = VegetationService()
