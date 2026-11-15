from typing import Dict, Any, Optional
from utils.geo import validate_coordinates, point_to_bbox, to_geojson_point
from .planetary_computer_service import planetary_computer_service

class GeospatialService:
    """
    Geospatial coordinate operations and ESA WorldCover land use inspection.
    """

    def inspect_land_cover(self, lat: float, lon: float) -> Dict[str, Any]:
        valid, err = validate_coordinates(lat, lon)
        if not valid:
            return {"error": err, "status": "INVALID_COORDINATES"}

        return planetary_computer_service.get_worldcover_classification(lat, lon)

    def process_boundary(self, boundary_geojson: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses GeoJSON geometry, computes centroid, bounding box, and estimated area.
        """
        try:
            from shapely.geometry import shape
            geom = shape(boundary_geojson)
            centroid = geom.centroid
            bounds = geom.bounds  # (minx, miny, maxx, maxy)
            return {
                "valid": geom.is_valid,
                "centroid": [centroid.y, centroid.x],
                "bounds": [bounds[1], bounds[0], bounds[3], bounds[2]], # min_lat, min_lon, max_lat, max_lon
                "geometryType": geom.geom_type
            }
        except Exception as e:
            return {"valid": False, "error": str(e)}

geospatial_service = GeospatialService()

