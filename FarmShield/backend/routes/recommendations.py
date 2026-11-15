from flask import Blueprint, jsonify, request
from services.explainable_recommendation_engine import ExplainableRecommendationEngine
from models import Farm

recommendations_bp = Blueprint("recommendations", __name__)
engine = ExplainableRecommendationEngine()

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

    return jsonify({
        "success": True,
        "farmId": farm_id,
        "farmName": farm.name,
        "currentCrop": farm.current_crop,
        "data": rec_result
    })
