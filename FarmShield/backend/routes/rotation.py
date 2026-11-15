from flask import Blueprint, jsonify, request
from services.explainable_recommendation_engine import explainable_recommendation_engine
from models import Farm

rotation_bp = Blueprint("rotation", __name__)

@rotation_bp.route("/recommend", methods=["POST"])
def recommend_rotation():
    payload = request.get_json() or {}
    farm_id = payload.get("farmId")
    current_crop = payload.get("currentCrop", "teff")
    proposed_crops = payload.get("proposedCrops", ["faba_bean"])

    farm_data = {}
    if farm_id:
        farm = Farm.query.get(farm_id)
        if farm:
            farm_data = farm.to_dict()

    if not farm_data:
        farm_data = {
            "latitude": float(payload.get("latitude", 9.02)),
            "longitude": float(payload.get("longitude", 38.74)),
            "countryCode": payload.get("countryCode", "ET"),
            "soilType": payload.get("soilType", "Vertisols (Black clay)"),
            "waterAvailability": payload.get("waterAvailability", "Rainfed")
        }

    evaluation = explainable_recommendation_engine.evaluate_crop_rotation(farm_data, current_crop, proposed_crops)

    return jsonify({
        "success": True,
        "data": evaluation,
        "isDemoData": False
    })


