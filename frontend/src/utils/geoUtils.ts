/**
 * Geographic utilities for spatial validation and geodetic measurements
 */

/**
 * Calculates surface area of a polygon in hectares using spherical earth formula
 * @param coordinates Array of [longitude, latitude] pairs forming the exterior ring
 * @returns Area in hectares rounded to 2 decimal places
 */
export function calculatePolygonAreaHectares(coordinates: [number, number][]): number {
  if (!coordinates || coordinates.length < 3) return 0.0;
  
  const R = 6378137.0; // WGS84 major radius in meters
  let area = 0.0;
  const len = coordinates.length;

  for (let i = 0; i < len; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % len];
    const lon1 = (p1[0] * Math.PI) / 180.0;
    const lat1 = (p1[1] * Math.PI) / 180.0;
    const lon2 = (p2[0] * Math.PI) / 180.0;
    const lat2 = (p2[1] * Math.PI) / 180.0;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * R * R) / 2.0);
  return Number((area / 10000.0).toFixed(2));
}

/**
 * Parses GeoJSON geometry object and returns coordinate ring for Leaflet [lat, lng] array
 */
export function parseGeoJsonToLeaflet(boundaryGeoJson: any): [number, number][] | null {
  if (!boundaryGeoJson || typeof boundaryGeoJson !== 'object') return null;

  try {
    let coords: any = boundaryGeoJson.coordinates;
    if (boundaryGeoJson.type === 'Polygon' && Array.isArray(coords) && coords.length > 0) {
      const ring = coords[0];
      if (Array.isArray(ring) && ring.length >= 3) {
        // GeoJSON is [lon, lat], Leaflet needs [lat, lon]
        return ring.map((pt: any) => [Number(pt[1]), Number(pt[0])]);
      }
    } else if (boundaryGeoJson.type === 'MultiPolygon' && Array.isArray(coords) && coords.length > 0) {
      const ring = coords[0][0];
      if (Array.isArray(ring) && ring.length >= 3) {
        return ring.map((pt: any) => [Number(pt[1]), Number(pt[0])]);
      }
    }
  } catch (e) {
    console.warn('Failed to parse GeoJSON boundary:', e);
  }

  return null;
}

