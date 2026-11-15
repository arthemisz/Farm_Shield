"""
OpenET Data Provider Service for FarmShield
==========================================
Integration with the official OpenET API (https://openet-api.org).

Scientific Grounding & Geographic Coverage Rules:
------------------------------------------------
1. Provider: OpenET Consortium (Desert Research Institute, NASA Ames, USGS, EDF, Google).
2. Product: Satellite-based evapotranspiration (ET) ensemble and individual models (SSEBop, SIMS, DisALEXI, eeMETRIC, geeSEBAL, PT-JPL).
3. Primary Coverage Extent: Conterminous United States (CONUS) ~24.74°N to ~49.35°N, ~-124.78°W to ~-66.95°W.
4. Africa / International Status:
   - OpenET operational API does NOT currently cover Africa or Ethiopia.
   - Any query outside the supported geographic bounds is immediately classified as
     `UNAVAILABLE` with clear scientific disclosure.
   - FarmShield NEVER fabricates, simulates, or replaces missing ET observations.
5. Authentication & Security:
   - API key is loaded strictly from environment variable `OPENET_API_KEY`.
   - The key is NEVER logged, exposed to the browser, or included in client payloads.
"""

import logging
import os
import requests
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

# Bounding box for CONUS operational extent
CONUS_BOUNDS = {
    "min_lat": 24.5,
    "max_lat": 49.5,
    "min_lon": -125.0,
    "max_lon": -66.5,
}

# OpenET officially supported variables
SUPPORTED_VARIABLES = ["ET", "ET_MAD_MIN", "ET_MAD_MAX", "ETo", "ETof", "NDVI", "PR"]
SUPPORTED_MODELS = ["Ensemble", "SSEBop", "SIMS", "DisALEXI", "eeMETRIC", "geeSEBAL", "PTJPL"]


class OpenETService:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = (api_key or os.environ.get("OPENET_API_KEY", "")).strip()
        self.base_url = (base_url or os.environ.get("OPENET_API_URL", "https://openet-api.org")).rstrip("/")
        self.timeout = int(os.environ.get("REQUEST_TIMEOUT", 12))

    def is_configured(self) -> bool:
        """Returns True if a non-empty API key is present."""
        return bool(self.api_key)

    @staticmethod
    def is_within_conus(lat: float, lon: float) -> bool:
        """
        Validates if coordinate pair is within the operational Conterminous United States bounds.
        """
        return (
            CONUS_BOUNDS["min_lat"] <= lat <= CONUS_BOUNDS["max_lat"]
            and CONUS_BOUNDS["min_lon"] <= lon <= CONUS_BOUNDS["max_lon"]
        )

    @staticmethod
    def validate_coordinates(lat: float, lon: float) -> Tuple[bool, Optional[str]]:
        """Validate geographic coordinate ranges."""
        try:
            lat_f = float(lat)
            lon_f = float(lon)
        except (ValueError, TypeError):
            return False, "Coordinates must be valid floating point numbers."

        if not (-90.0 <= lat_f <= 90.0):
            return False, f"Latitude {lat_f} is out of bounds [-90, 90]."
        if not (-180.0 <= lon_f <= 180.0):
            return False, f"Longitude {lon_f} is out of bounds [-180, 180]."
        return True, None

    def check_geographic_coverage(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Evaluate location coverage against official OpenET operational capabilities.
        """
        is_valid, err = self.validate_coordinates(lat, lon)
        if not is_valid:
            return {
                "supported": False,
                "coverage": "INVALID_COORDINATES",
                "reason": err,
                "status": "UNAVAILABLE"
            }

        if self.is_within_conus(lat, lon):
            return {
                "supported": True,
                "coverage": "CONUS",
                "region": "Conterminous United States",
                "status": "SUPPORTED"
            }
        else:
            return {
                "supported": False,
                "coverage": "OUT_OF_BOUNDS",
                "region": "Global / Africa / Non-CONUS",
                "status": "UNAVAILABLE",
                "reason": (
                    "OpenET operational API currently supports only the Conterminous United States (CONUS). "
                    "Africa and Ethiopian coordinates are outside the operational grid domain."
                )
            }

    def get_point_evapotranspiration(
        self,
        lat: float,
        lon: float,
        start_date: str = "2023-01-01",
        end_date: str = "2023-12-31",
        variable: str = "ET",
        model: str = "Ensemble",
        interval: str = "monthly",
        units: str = "mm"
    ) -> Dict[str, Any]:
        """
        Retrieve monthly/daily evapotranspiration from OpenET /raster/timeseries/point.

        Strictly enforces:
        - Input validation.
        - Geographic coverage check BEFORE issuing network requests.
        - Provenance status tagging (LIVE, UNAVAILABLE, CONFIGURATION_REQUIRED).
        - Error handling (never fabricates data).
        """
        # 1. Coordinate Validation
        is_valid, err = self.validate_coordinates(lat, lon)
        if not is_valid:
            return {
                "success": False,
                "status": "INVALID_COORDINATES",
                "provenanceStatus": "UNAVAILABLE",
                "error": err,
                "coordinates": {"latitude": lat, "longitude": lon},
                "data": None
            }

        # 2. Check Geographic Coverage (Africa vs CONUS)
        coverage_info = self.check_geographic_coverage(lat, lon)
        if not coverage_info["supported"]:
            return {
                "success": False,
                "status": "OUT_OF_COVERAGE",
                "provenanceStatus": "UNAVAILABLE",
                "error": coverage_info["reason"],
                "coordinates": {"latitude": lat, "longitude": lon},
                "provider": "OpenET Consortium (DRI / NASA Ames / USGS / EDF)",
                "dataset": f"OpenET {model} {variable}",
                "operationalDomain": "Conterminous United States (CONUS 30m gridMET/Landsat)",
                "data": None,
                "scientificNotice": (
                    "OpenET API does not provide satellite-derived ET observations for African locations. "
                    "FarmShield maintains strict data integrity and does not synthesize substitute ET values."
                )
            }

        # 3. Check API Key Configuration
        if not self.is_configured():
            return {
                "success": False,
                "status": "CONFIGURATION_REQUIRED",
                "provenanceStatus": "UNAVAILABLE",
                "error": "OpenET API key is not configured in backend environment (OPENET_API_KEY).",
                "coordinates": {"latitude": lat, "longitude": lon},
                "provider": "OpenET Consortium",
                "data": None
            }

        # 4. Validate Requested Variable & Model
        if variable not in SUPPORTED_VARIABLES:
            return {
                "success": False,
                "status": "UNSUPPORTED_VARIABLE",
                "provenanceStatus": "UNAVAILABLE",
                "error": f"Variable '{variable}' not supported. Supported: {SUPPORTED_VARIABLES}",
                "data": None
            }

        # 5. Build Request Payload
        endpoint = f"{self.base_url}/raster/timeseries/point"
        headers = {
            "Accept": "application/json",
            "Authorization": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": "FarmShield-AgriIntelligence/1.0"
        }
        payload = {
            "date_range": [start_date, end_date],
            "interval": interval,
            "geometry": [round(float(lon), 5), round(float(lat), 5)],  # OpenET expects [lon, lat]
            "model": model,
            "variable": variable,
            "reference_et": "gridMET",
            "units": units,
            "file_format": "JSON"
        }

        # 6. Execute Remote Call
        try:
            response = requests.post(endpoint, headers=headers, json=payload, timeout=self.timeout)
            
            if response.status_code == 401 or response.status_code == 403:
                return {
                    "success": False,
                    "status": "AUTHENTICATION_FAILED",
                    "provenanceStatus": "UNAVAILABLE",
                    "error": "Authentication failed. The configured OPENET_API_KEY was rejected by OpenET.",
                    "httpStatus": response.status_code,
                    "data": None
                }

            if response.status_code == 404:
                return {
                    "success": False,
                    "status": "NOT_FOUND",
                    "provenanceStatus": "UNAVAILABLE",
                    "error": "Requested point data or date range not found in OpenET raster catalogue.",
                    "httpStatus": 404,
                    "data": None
                }

            if response.status_code == 429:
                return {
                    "success": False,
                    "status": "RATE_LIMITED",
                    "provenanceStatus": "UNAVAILABLE",
                    "error": "OpenET API quota or rate limit exceeded.",
                    "httpStatus": 429,
                    "data": None
                }

            response.raise_for_status()
            res_json = response.json()

            # Parse and validate returned observations
            if not res_json or (isinstance(res_json, list) and len(res_json) == 0):
                return {
                    "success": True,
                    "status": "EMPTY_RESPONSE",
                    "provenanceStatus": "PARTIAL",
                    "coordinates": {"latitude": lat, "longitude": lon},
                    "message": "Valid request returned no observation records for requested date range.",
                    "data": []
                }

            return {
                "success": True,
                "status": "SUCCESS",
                "provenanceStatus": "LIVE",
                "provider": "OpenET Consortium (DRI / NASA Ames / USGS / EDF)",
                "product": f"OpenET {model} Model Ensemble",
                "variable": variable,
                "units": units,
                "interval": interval,
                "spatialResolution": "30m Landsat thermal infrared + gridMET reference ET",
                "dateRange": [start_date, end_date],
                "coordinates": {"latitude": lat, "longitude": lon},
                "data": res_json
            }

        except requests.exceptions.Timeout:
            logger.warning("OpenET request timed out.")
            return {
                "success": False,
                "status": "TIMEOUT",
                "provenanceStatus": "UNAVAILABLE",
                "error": f"OpenET API did not respond within {self.timeout} seconds.",
                "data": None
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"OpenET API request error: {str(e)}")
            return {
                "success": False,
                "status": "API_ERROR",
                "provenanceStatus": "UNAVAILABLE",
                "error": f"Network error contacting OpenET API: {str(e)}",
                "data": None
            }

