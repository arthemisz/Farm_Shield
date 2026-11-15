from flask import Blueprint, jsonify, request
from services.soil_service import soil_service
from services.smap_soil_moisture_service import smap_soil_moisture_service

soil_bp = Blueprint("soil", __name__)

@soil_bp.route("", methods=["GET"])
def get_soil():
    try:
        lat = float(request.args.get("lat", 9.02))
        lon = float(request.args.get("lon", 38.74))
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid coordinates"}), 400

    data = soil_service.get_soil_properties(lat, lon)

    is_demo = data.get("provenance", {}).get("isDemoData", False)

    return jsonify({
        "success": True,
        "data": data,
        "isDemoData": is_demo
    })

@soil_bp.route("/moisture", methods=["GET"])
def get_soil_moisture():
    """
    Returns NASA SMAP surface and root-zone soil moisture analysis combined
    with SoilGrids hydraulic limits (PWP, Field Capacity, PAW) and irrigation deficit.
    """
    try:
        lat = float(request.args.get("lat", 9.02))
        lon = float(request.args.get("lon", 38.74))
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid coordinates"}), 400

    crop = request.args.get("crop", "General Crop")
    data = smap_soil_moisture_service.get_soil_moisture_analysis(lat, lon, crop_type=crop)

    is_demo = data.get("provenance", {}).get("isDemoData", False)

    return jsonify({
        "success": True,
        "data": data,
        "isDemoData": is_demo
    })

