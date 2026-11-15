from flask import Blueprint, jsonify, request
import json
import os
from datetime import datetime, timezone
from models import db, Farm
from utils.validators import validate_farm_payload
from services.chirps_service import chirps_service
from services.drought_service import drought_service
from services.vegetation_service import vegetation_service
from services.nasa_power_service import nasa_power_service

farms_bp = Blueprint("farms", __name__)

def _get_country_region(country_code: str) -> str:
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    path = os.path.join(base_dir, "data", "country_profiles", "countries.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                countries = json.load(f)
            for c in countries:
                if c.get("isoCode", "").upper() == country_code.upper():
                    return c.get("region", "East Africa")
        except Exception:
            pass
    return "East Africa"

@farms_bp.route("/<farm_id>/rainfall", methods=["GET"])
def get_farm_rainfall(farm_id):
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "message": "Farm not found"}), 404
    year = request.args.get("year", type=int)
    region = _get_country_region(farm.country_code)
    data = chirps_service.get_rainfall_analysis(farm.latitude, farm.longitude, year, region)
    return jsonify({
        "success": True,
        "farmId": farm.id,
        "farmName": farm.name,
        "data": data,
        "isDemoData": data.get("provenance", {}).get("isDemoData", False)
    })

@farms_bp.route("/<farm_id>/drought", methods=["GET"])
def get_farm_drought(farm_id):
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "message": "Farm not found"}), 404
    year = request.args.get("year", type=int)
    region = _get_country_region(farm.country_code)
    data = drought_service.get_drought_assessment(farm.latitude, farm.longitude, year, region)
    return jsonify({
        "success": True,
        "farmId": farm.id,
        "farmName": farm.name,
        "data": data,
        "isDemoData": data.get("provenance", {}).get("isDemoData", False)
    })

@farms_bp.route("/<farm_id>/vegetation", methods=["GET"])
def get_farm_vegetation(farm_id):
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "message": "Farm not found"}), 404
    data = vegetation_service.get_vegetation_analysis(farm.latitude, farm.longitude)
    return jsonify({
        "success": True,
        "farmId": farm.id,
        "farmName": farm.name,
        "data": data,
        "isDemoData": data.get("provenance", {}).get("isDemoData", False)
    })

@farms_bp.route("/<farm_id>/climate/seasonal", methods=["GET"])
def get_farm_seasonal_climate(farm_id):
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "message": "Farm not found"}), 404
    year = request.args.get("year", type=int)
    region = _get_country_region(farm.country_code)
    rainfall_data = chirps_service.get_rainfall_analysis(farm.latitude, farm.longitude, year, region)
    climate_data = nasa_power_service.get_monthly_climatology(farm.latitude, farm.longitude, year)
    
    seasonal_data = {
        "farmId": farm.id,
        "farmName": farm.name,
        "latitude": farm.latitude,
        "longitude": farm.longitude,
        "region": region,
        "countryCode": farm.country_code,
        "seasonalPrecipitation": rainfall_data.get("seasonalSummary", {}),
        "temperatureSummary": climate_data.get("summary", {}),
        "annualOverview": rainfall_data.get("annual", {}),
        "provenance": {
            "rainfallSource": "CHIRPS 2.0 (Climate Hazards Center)",
            "temperatureSource": "NASA POWER Climatology",
            "status": rainfall_data.get("provenance", {}).get("status", "LIVE"),
            "isDemoData": rainfall_data.get("provenance", {}).get("isDemoData", False)
        }
    }
    return jsonify({
        "success": True,
        "data": seasonal_data,
        "isDemoData": seasonal_data["provenance"]["isDemoData"]
    })

@farms_bp.route("", methods=["GET"])
def get_farms():
    country_code = request.args.get("country_code")
    query = Farm.query
    if country_code and country_code.upper() != "ALL":
        query = query.filter_by(country_code=country_code.upper())
    farms = query.order_by(Farm.created_at.desc()).all()
    
    return jsonify({
        "success": True,
        "data": [f.to_dict() for f in farms],
        "isDemoData": False,
        "message": f"Retrieved {len(farms)} farms"
    })

@farms_bp.route("/<farm_id>", methods=["GET"])
def get_farm(farm_id):
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({
            "success": False,
            "data": None,
            "message": "Farm not found"
        }), 404
    return jsonify({
        "success": True,
        "data": farm.to_dict(),
        "isDemoData": False
    })

@farms_bp.route("", methods=["POST"])
def create_farm():
    payload = request.get_json() or {}
    valid, errs = validate_farm_payload(payload)
    if not valid:
        return jsonify({
            "success": False,
            "errors": errs,
            "message": "Validation failed"
        }), 400

    boundary_str = None
    if "boundaryGeoJson" in payload and payload["boundaryGeoJson"]:
        boundary_str = json.dumps(payload["boundaryGeoJson"])

    farm = Farm(
        name=payload["name"],
        country_code=payload.get("countryCode", "ET").upper(),
        country=payload.get("country", "Ethiopia"),
        admin_level1=payload.get("adminLevel1") or payload.get("region"),
        admin_level2=payload.get("adminLevel2") or payload.get("zone"),
        admin_level3=payload.get("adminLevel3") or payload.get("woreda"),
        latitude=float(payload["latitude"]),
        longitude=float(payload["longitude"]),
        size=float(payload.get("size", 5.0)),
        size_unit=payload.get("sizeUnit", "hectares"),
        soil_type=payload.get("soilType", "Vertisols (Black clay)"),
        water_availability=payload.get("waterAvailability", "Rainfed"),
        current_crop=payload.get("currentCrop", "Teff"),
        planting_date=payload.get("plantingDate"),
        growing_season=payload.get("growingSeason"),
        crop_provenance=payload.get("cropProvenance", "FARMER_REPORTED"),
        elevation_meters=payload.get("elevationMeters"),
        description=payload.get("description"),
        boundary_geojson=boundary_str,
        owner_id=payload.get("ownerId", "demo-user")
    )

    db.session.add(farm)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": farm.to_dict(),
        "message": "Farm created successfully",
        "isDemoData": False
    }), 201

@farms_bp.route("/<farm_id>", methods=["PUT", "PATCH"])
def update_farm(farm_id):
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({
            "success": False,
            "message": "Farm not found"
        }), 404

    payload = request.get_json() or {}
    # Basic Authorization check: if farm has an owner and a requesting user is supplied, check match
    req_user = request.headers.get("X-User-Id") or payload.get("requestUserId")
    if farm.owner_id and req_user and farm.owner_id != "demo-user" and farm.owner_id != req_user:
        return jsonify({
            "success": False,
            "message": "Unauthorized. You do not have permission to modify this farm record."
        }), 403

    if "name" in payload:
        farm.name = payload["name"]
    if "countryCode" in payload:
        farm.country_code = payload["countryCode"].upper()
    if "country" in payload:
        farm.country = payload["country"]
    if "adminLevel1" in payload:
        farm.admin_level1 = payload["adminLevel1"]
    if "adminLevel2" in payload:
        farm.admin_level2 = payload["adminLevel2"]
    if "adminLevel3" in payload:
        farm.admin_level3 = payload["adminLevel3"]
    if "latitude" in payload:
        farm.latitude = float(payload["latitude"])
    if "longitude" in payload:
        farm.longitude = float(payload["longitude"])
    if "size" in payload:
        farm.size = float(payload["size"])
    if "sizeUnit" in payload:
        farm.size_unit = payload["sizeUnit"]
    if "soilType" in payload:
        farm.soil_type = payload["soilType"]
    if "waterAvailability" in payload:
        farm.water_availability = payload["waterAvailability"]
    if "currentCrop" in payload:
        farm.current_crop = payload["currentCrop"]
    if "plantingDate" in payload:
        farm.planting_date = payload["plantingDate"]
    if "growingSeason" in payload:
        farm.growing_season = payload["growingSeason"]
    if "cropProvenance" in payload:
        farm.crop_provenance = payload["cropProvenance"]
    if "boundaryGeoJson" in payload:
        farm.boundary_geojson = json.dumps(payload["boundaryGeoJson"]) if payload["boundaryGeoJson"] else None
    if "description" in payload:
        farm.description = payload["description"]
    if "elevationMeters" in payload:
        farm.elevation_meters = payload["elevationMeters"]

    db.session.commit()
    return jsonify({
        "success": True,
        "data": farm.to_dict(),
        "message": "Farm updated successfully"
    })

@farms_bp.route("/<farm_id>/plots", methods=["GET"])
def get_farm_plots(farm_id):
    from models import FarmPlot
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "message": "Farm not found"}), 404

    plots = FarmPlot.query.filter_by(farm_id=farm_id).all()
    return jsonify({
        "success": True,
        "farmId": farm_id,
        "farmName": farm.name,
        "count": len(plots),
        "data": [p.to_dict() for p in plots]
    })

@farms_bp.route("/<farm_id>/plots", methods=["POST"])
def create_farm_plot(farm_id):
    from models import FarmPlot
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "message": "Farm not found"}), 404

    payload = request.get_json() or {}
    if not payload.get("name") or not payload.get("cropName"):
        return jsonify({"success": False, "message": "Plot name and cropName are required"}), 400

    boundary_str = None
    if "boundaryGeoJson" in payload and payload["boundaryGeoJson"]:
        boundary_str = json.dumps(payload["boundaryGeoJson"])

    plot = FarmPlot(
        farm_id=farm_id,
        name=payload["name"],
        crop_name=payload["cropName"],
        area_hectares=float(payload.get("areaHectares", 1.0)),
        planting_date=payload.get("plantingDate"),
        harvest_target=payload.get("harvestTarget"),
        crop_provenance=payload.get("cropProvenance", "FARMER_REPORTED"),
        boundary_geojson=boundary_str
    )
    db.session.add(plot)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": plot.to_dict(),
        "message": "Farm plot created successfully"
    }), 201

@farms_bp.route("/<farm_id>/climate", methods=["GET"])
def get_farm_climate(farm_id):
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "message": "Farm not found"}), 404
    year = request.args.get("year", type=int)
    data = nasa_power_service.get_monthly_climatology(farm.latitude, farm.longitude, year)
    return jsonify({
        "success": True,
        "farmId": farm.id,
        "farmName": farm.name,
        "data": data,
        "isDemoData": data.get("provenance", {}).get("isDemoData", False)
    })

@farms_bp.route("/<farm_id>/climate/historical-comparison", methods=["GET"])
def get_farm_historical_climate_comparison(farm_id):
    from services.historical_climate_service import historical_climate_service
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "message": "Farm not found"}), 404

    year = request.args.get("year", type=int)
    month = request.args.get("month", default=7, type=int)
    num_years = request.args.get("numYears", default=5, type=int)

    comparison = historical_climate_service.get_historical_comparison(
        lat=farm.latitude,
        lon=farm.longitude,
        selected_year=year,
        selected_month=month,
        num_comparison_years=num_years,
        country_code=farm.country_code or "ET"
    )

    if "error" in comparison:
        return jsonify({"success": False, "message": comparison["error"]}), 400

    return jsonify({
        "success": True,
        "farmId": farm.id,
        "farmName": farm.name,
        "data": comparison,
        "isDemoData": False
    })


@farms_bp.route("/<farm_id>/soil", methods=["GET"])
def get_farm_soil(farm_id):
    from services.soil_service import soil_service
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "message": "Farm not found"}), 404
    data = soil_service.get_soil_properties(farm.latitude, farm.longitude)
    return jsonify({
        "success": True,
        "farmId": farm.id,
        "farmName": farm.name,
        "data": data,
        "isDemoData": data.get("provenance", {}).get("isDemoData", False)
    })

@farms_bp.route("/<farm_id>/recommendations", methods=["GET"])
def get_farm_recommendations(farm_id):
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "message": "Farm not found"}), 404
    
    from services.explainable_recommendation_engine import explainable_recommendation_engine
    recs = explainable_recommendation_engine.get_crop_recommendations(farm.to_dict())
    return jsonify({
        "success": True,
        "farmId": farm.id,
        "data": recs,
        "isDemoData": False
    })

@farms_bp.route("/<farm_id>/data-quality", methods=["GET"])
def get_farm_data_quality(farm_id):
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "message": "Farm not found"}), 404

    from services.farm_data_quality_service import farm_data_quality_service
    from services.nasa_power_service import nasa_power_service
    from services.chirps_service import chirps_service
    from services.soil_service import soil_service
    from services.vegetation_service import vegetation_service
    from services.drought_service import drought_service
    from services.data_sources.crop_calendar_service import crop_calendar_service
    from services.data_sources.faostat_service import faostat_service

    lat, lon = farm.latitude, farm.longitude
    climate = nasa_power_service.get_monthly_climatology(lat, lon)
    soil = soil_service.get_soil_properties(lat, lon)
    rainfall = chirps_service.get_rainfall_analysis(lat, lon)
    vegetation = vegetation_service.get_vegetation_analysis(lat, lon)
    drought = drought_service.get_drought_assessment(lat, lon)
    calendar = crop_calendar_service.get_crop_calendar(farm.country_code)
    faostat = faostat_service.get_country_crop_statistics(farm.country_code)

    dq = farm_data_quality_service.evaluate_farm_data_quality(
        climate_data=climate,
        soil_data=soil,
        rainfall_data=rainfall,
        vegetation_data=vegetation,
        drought_data=drought,
        crop_calendar_data=calendar,
        faostat_data=faostat
    )

    return jsonify({
        "success": True,
        "farmId": farm.id,
        "data": dq,
        "isDemoData": False
    })

@farms_bp.route("/<farm_id>/report", methods=["GET"])
def get_farm_report(farm_id):
    from services.soil_service import soil_service
    from services.recommendation_service import recommendation_service
    from services.crop_service import crop_service

    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "message": "Farm not found"}), 404

    region = _get_country_region(farm.country_code)
    year = request.args.get("year", type=int)

    climate = nasa_power_service.get_monthly_climatology(farm.latitude, farm.longitude, year)
    soil = soil_service.get_soil_properties(farm.latitude, farm.longitude)
    rainfall = chirps_service.get_rainfall_analysis(farm.latitude, farm.longitude, year, region)
    drought = drought_service.get_drought_assessment(farm.latitude, farm.longitude, year, region)
    vegetation = vegetation_service.get_vegetation_analysis(farm.latitude, farm.longitude)
    
    current_crop = farm.current_crop or "Teff"
    crops = crop_service.get_all_crops(farm.country_code)
    candidates = [c["id"] for c in crops if c["id"].lower() != current_crop.lower()][:3]
    if not candidates:
        candidates = ["faba_bean"]
    recommendation = recommendation_service.evaluate_rotation(farm.to_dict(), current_crop, candidates)

    # Enrich with FAOSTAT benchmark statistics and National Crop Calendars
    from services.data_sources.faostat_service import faostat_service
    from services.data_sources.crop_calendar_service import crop_calendar_service
    
    faostat_stats = faostat_service.get_country_crop_statistics(farm.country_code)
    crop_cal = crop_calendar_service.get_crop_calendar(farm.country_code)

    report_payload = {
        "farm": farm.to_dict(),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "region": region,
        "climate": climate,
        "soil": soil,
        "rainfall": rainfall,
        "drought": drought,
        "vegetation": vegetation,
        "recommendations": recommendation,
        "faostatStatistics": faostat_stats,
        "nationalCropCalendar": crop_cal,
        "sources": [
            {"name": "CHIRPS 2.0", "type": "Precipitation", "provider": "Climate Hazards Center UCSB"},
            {"name": "NASA POWER", "type": "Solar & Temperature", "provider": "NASA Langley"},
            {"name": "ISRIC SoilGrids 2.0", "type": "Edaphic properties", "provider": "ISRIC World Soil Information"},
            {"name": "Copernicus Sentinel-2 L2A", "type": "Vegetation / NDVI", "provider": "ESA / Microsoft Planetary Computer"},
            {"name": "WMO Standardized Precipitation Index", "type": "Drought metrics", "provider": "WMO-No. 1095"},
            {"name": "FAOSTAT", "type": "Agricultural Production Statistics", "provider": "FAO"},
            {"name": "National Crop Calendars", "type": "Agronomic Extension Guides", "provider": "EIAR, KALRO, IITA, CSIR, ARC"}
        ],
        "limitations": [
            "NDVI measures photosynthetic canopy greenness, not crop yield or species taxonomy.",
            "SPI metrics quantify meteorological atmospheric drought, distinct from soil-moisture agricultural drought.",
            "Soil attributes represent standardized 250m machine-learning digital soil mappings.",
            "FAOSTAT statistics represent macroeconomic national production totals, not individual farm output."
        ]
    }

    return jsonify({
        "success": True,
        "farmId": farm.id,
        "data": report_payload,
        "isDemoData": climate.get("provenance", {}).get("isDemoData", False)
    })

@farms_bp.route("/<farm_id>", methods=["DELETE"])
def delete_farm(farm_id):
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({
            "success": False,
            "message": "Farm not found"
        }), 404

    db.session.delete(farm)
    db.session.commit()
    return jsonify({
        "success": True,
        "data": True,
        "message": "Farm deleted successfully"
    })

