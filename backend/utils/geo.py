import math
from typing import Tuple, Dict, Any, Optional

def validate_coordinates(lat: float, lon: float) -> Tuple[bool, Optional[str]]:
    """Validate latitude and longitude ranges."""
    try:
        lat = float(lat)
        lon = float(lon)
    except (ValueError, TypeError):
        return False, "Latitude and longitude must be valid floating point numbers."
    
    if not (-90.0 <= lat <= 90.0):
        return False, f"Latitude {lat} is outside the valid range of -90.0 to 90.0 degrees."
    if not (-180.0 <= lon <= 180.0):
        return False, f"Longitude {lon} is outside the valid range of -180.0 to 180.0 degrees."
        
    return True, None

def point_to_bbox(lat: float, lon: float, radius_km: float = 1.0) -> Tuple[float, float, float, float]:
    """
    Generate bounding box [min_lon, min_lat, max_lon, max_lat] around a point.
    1 degree of latitude is ~111 km.
    """
    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * max(0.01, math.cos(math.radians(lat))))
    
    min_lat = max(-90.0, lat - lat_delta)
    max_lat = min(90.0, lat + lat_delta)
    min_lon = max(-180.0, lon - lon_delta)
    max_lon = min(180.0, lon + lon_delta)
    
    return min_lon, min_lat, max_lon, max_lat

def to_geojson_point(lat: float, lon: float) -> Dict[str, Any]:
    return {
        "type": "Point",
        "coordinates": [round(lon, 6), round(lat, 6)]
    }

def convert_area(value: float, from_unit: str, to_unit: str = "hectares") -> float:
    """Standardize area conversion between hectares and acres."""
    if from_unit == to_unit:
        return value
    if from_unit == "acres" and to_unit == "hectares":
        return value * 0.404686
    if from_unit == "hectares" and to_unit == "acres":
        return value * 2.47105
    return value

