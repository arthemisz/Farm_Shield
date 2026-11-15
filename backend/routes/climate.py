from flask import Blueprint, jsonify, request
from services.nasa_power_service import nasa_power_service
from services.historical_climate_service import historical_climate_service

climate_bp = Blueprint("climate", __name__)

@climate_bp.route("", methods=["GET"])
def get_climate():
    try:
        lat = float(request.args.get("lat", request.args.get("latitude", 9.02)))
        lon = float(request.args.get("lon", request.args.get("longitude", 38.74)))
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid coordinates"}), 400

    year = request.args.get("year", type=int)
    data = nasa_power_service.get_monthly_climatology(lat, lon, year)

    is_demo = data.get("provenance", {}).get("isDemoData", False)

    return jsonify({
        "success": True,
        "data": data,
        "isDemoData": is_demo
    })

@climate_bp.route("/historical-comparison", methods=["GET"])
def get_historical_climate_comparison():
    try:
        lat = float(request.args.get("lat", request.args.get("latitude", 8.7523)))
        lon = float(request.args.get("lon", request.args.get("longitude", 38.9841)))
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Invalid coordinates"}), 400

    year = request.args.get("year", type=int)
    month = request.args.get("month", default=7, type=int)
    num_years = request.args.get("numYears", default=5, type=int)
    country_code = request.args.get("countryCode", default="ET")

    comparison = historical_climate_service.get_historical_comparison(
        lat=lat,
        lon=lon,
        selected_year=year,
        selected_month=month,
        num_comparison_years=num_years,
        country_code=country_code
    )

    if "error" in comparison:
        return jsonify({"success": False, "message": comparison["error"]}), 400

    return jsonify({
        "success": True,
        "data": comparison,
        "isDemoData": False
    })


