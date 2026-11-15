from flask import Blueprint, jsonify, request
from services.explainable_recommendation_engine import ExplainableRecommendationEngine
from models import Farm

recommendations_bp = Blueprint("recommendations", __name__)
engine = ExplainableRecommendationEngine()

import math
from datetime import datetime, timezone

def calculate_polygon_area_ha(geometry):
    if not geometry or not isinstance(geometry, dict):
        return None
    coords = geometry.get("coordinates", [])
    if geometry.get("type") == "Polygon" and coords:
        ring = coords[0]
    elif geometry.get("type") == "MultiPolygon" and coords:
        ring = coords[0][0]
    else:
        return None
    if len(ring) < 3:
        return 0.0
    R = 6378137.0
    area = 0.0
    for i in range(len(ring)):
        p1 = ring[i]
        p2 = ring[(i + 1) % len(ring)]
        lon1 = math.radians(p1[0])
        lat1 = math.radians(p1[1])
        lon2 = math.radians(p2[0])
        lat2 = math.radians(p2[1])
        area += (lon2 - lon1) * (2 + math.sin(lat1) + math.sin(lat2))
    area = abs(area * R * R / 2.0)
    return round(area / 10000.0, 2)

@recommendations_bp.route("/farm/<farm_id>", methods=["GET"])
def get_farm_recommendations(farm_id):
    """
    Evaluates explainable agronomic recommendations for a specific registered farm
    using stored observations, NASA POWER, CHIRPS, and SoilGrids edaphic profile.
    """
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "message": f"Farm '{farm_id}' not found."}), 404

    farm_dict = farm.to_dict()
    # Pull any actual GPM or ECOSTRESS stored observation if present
    from models import EnvironmentalObservation
    gpm_obs = EnvironmentalObservation.query.filter_by(farm_id=farm_id, variable_name="precipitationAccumulation").first()
    ecostress_obs = EnvironmentalObservation.query.filter_by(farm_id=farm_id, variable_name="soil_moisture").first()

    rec_result = engine.get_crop_recommendations(farm_dict)
    
    # Attach actual observation linkages if found in SQL database
    if gpm_obs:
        rec_result["environmentalProfile"]["storedGpmPrecipitationMm"] = gpm_obs.value
    if ecostress_obs:
        rec_result["environmentalProfile"]["storedEcostressSoilMoistureM3m3"] = ecostress_obs.value

    # Compute spatial metadata
    boundary_geojson = farm_dict.get("boundaryGeoJson")
    calculated_area_ha = calculate_polygon_area_ha(boundary_geojson)
    has_polygon = bool(boundary_geojson and boundary_geojson.get("coordinates"))
    geometry_type = "POLYGON" if has_polygon else "POINT"
    provenance_classification = (
        farm.crop_provenance if farm.crop_provenance in ["FIELD_VERIFIED", "FARMER_REPORTED"] 
        else ("DEMONSTRATION" if farm.id in ["farm-1", "farm-2", "farm-3"] else "ESTIMATED")
    )

    spatial_data = {
        "farmId": farm_id,
        "farmName": farm.name,
        "latitude": farm.latitude,
        "longitude": farm.longitude,
        "registeredSizeHectares": farm.size,
        "calculatedAreaHectares": calculated_area_ha,
        "geometryType": geometry_type,
        "boundaryGeoJson": boundary_geojson,
        "hasBoundary": has_polygon,
        "geometryProvenance": provenance_classification,
        "recommendationDate": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "plots": [
            {
                "id": p.id,
                "name": p.name,
                "cropName": p.crop_name,
                "areaHectares": p.area_hectares,
                "boundaryGeoJson": p.to_dict().get("boundaryGeoJson")
            }
            for p in farm.plots
        ] if farm.plots else []
    }

    return jsonify({
        "success": True,
        "farmId": farm_id,
        "farmName": farm.name,
        "currentCrop": farm.current_crop,
        "spatial": spatial_data,
        "data": rec_result
    })
