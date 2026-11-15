from flask import Blueprint, jsonify, request
from services.vegetation_service import vegetation_service

vegetation_bp = Blueprint("vegetation", __name__)

@vegetation_bp.route("", methods=["GET"])
def get_vegetation():
    try:
        lat = float(request.args.get("lat", 9.02))
        lon = float(request.args.get("lon", 38.74))
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid coordinates"}), 400

    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    data = vegetation_service.get_vegetation_analysis(lat, lon, start_date, end_date)
    is_demo = data.get("provenance", {}).get("isDemoData", False)

    return jsonify({
        "success": True,
        "data": data,
        "isDemoData": is_demo
    })

