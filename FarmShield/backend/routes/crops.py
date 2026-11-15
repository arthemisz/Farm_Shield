from flask import Blueprint, jsonify, request
from services.crop_service import crop_service

crops_bp = Blueprint("crops", __name__)

@crops_bp.route("", methods=["GET"])
def get_crops():
    country_code = request.args.get("country_code")
    region = request.args.get("region")
    query = request.args.get("q")
    if query:
        crops = crop_service.search_crops(query, country_code, region)
    else:
        crops = crop_service.get_all_crops(country_code, region)

    return jsonify({
        "success": True,
        "data": crops,
        "isDemoData": False,
        "total": len(crops)
    })

@crops_bp.route("/<crop_id>", methods=["GET"])
def get_crop(crop_id):
    crop = crop_service.get_crop_by_id(crop_id)
    if not crop:
        return jsonify({"success": False, "message": "Crop not found"}), 404
    return jsonify({
        "success": True,
        "data": crop,
        "isDemoData": False
    })

