from typing import Dict, Any, Tuple, List
from .geo import validate_coordinates

def validate_farm_payload(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    errors = []
    if not data or not isinstance(data, dict):
        return False, ["Payload must be a non-empty JSON object."]
        
    name = data.get("name")
    if not name or not isinstance(name, str) or not name.strip():
        errors.append("Farm name is required.")
        
    lat = data.get("latitude")
    lon = data.get("longitude")
    if lat is None or lon is None:
        errors.append("Latitude and longitude coordinates are required.")
    else:
        valid_coords, coord_err = validate_coordinates(lat, lon)
        if not valid_coords:
            errors.append(coord_err)
            
    size = data.get("size") or data.get("sizeHectares")
    if size is not None:
        try:
            size_val = float(size)
            if size_val <= 0:
                errors.append("Farm size must be greater than 0.")
        except (ValueError, TypeError):
            errors.append("Farm size must be a valid positive number.")
            
    country_code = data.get("countryCode")
    if country_code and (not isinstance(country_code, str) or len(country_code.strip()) != 2):
        errors.append("Country code must be a 2-letter ISO 3166-1 alpha-2 code (e.g. 'ET', 'KE', 'US').")

    return len(errors) == 0, errors

def validate_rotation_payload(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    errors = []
    if not data or not isinstance(data, dict):
        return False, ["Payload must be a non-empty JSON object."]
        
    current_crop = data.get("currentCrop")
    if not current_crop or not isinstance(current_crop, str):
        errors.append("currentCrop string is required.")
        
    proposed = data.get("proposedCrops") or data.get("proposedSequence")
    if not proposed or not isinstance(proposed, list) or len(proposed) == 0:
        errors.append("proposedCrops must be a non-empty list of candidate crop names.")
        
    lat = data.get("latitude")
    lon = data.get("longitude")
    if lat is not None and lon is not None:
        valid_coords, coord_err = validate_coordinates(lat, lon)
        if not valid_coords:
            errors.append(coord_err)
            
    return len(errors) == 0, errors

