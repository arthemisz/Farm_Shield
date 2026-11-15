import json
import os
from flask import Blueprint, jsonify, request
from services.crop_service import crop_service
from services.dataset_registry_service import get_country_dataset_availability

countries_bp = Blueprint("countries", __name__)

def _load_countries():
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    path = os.path.join(base_dir, "data", "country_profiles", "countries.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@countries_bp.route("", methods=["GET"])
def get_countries():
    countries = _load_countries()

    region = request.args.get("region")
    if region:
        countries = [c for c in countries if c.get("region", "").lower() == region.lower()]

    support_status = request.args.get("status")
    if support_status:
        countries = [c for c in countries if c.get("supportStatus") == support_status]

    query = request.args.get("q")
    if query:
        q = query.lower().strip()
        countries = [
            c for c in countries
            if q in c.get("name", "").lower()
            or q in c.get("isoCode", "").lower()
            or q in c.get("isoAlpha3", "").lower()
            or q in c.get("capital", "").lower()
        ]

    return jsonify({
        "success": True,
        "data": countries,
        "total": len(countries),
        "isDemoData": False
    })

@countries_bp.route("/regions", methods=["GET"])
def get_regions():
    countries = _load_countries()
    region_map = {}
    for c in countries:
        r = c.get("region", "Other")
        if r not in region_map:
            region_map[r] = {
                "name": r,
                "countryCount": 0,
                "countries": []
            }
        region_map[r]["countryCount"] += 1
        region_map[r]["countries"].append({
            "id": c.get("id"),
            "isoAlpha2": c.get("isoCode"),
            "isoAlpha3": c.get("isoAlpha3"),
            "name": c.get("name"),
            "capital": c.get("capital")
        })

    return jsonify({
        "success": True,
        "data": list(region_map.values()),
        "totalRegions": len(region_map),
        "isDemoData": False
    })

@countries_bp.route("/<country_code>", methods=["GET"])
def get_country(country_code):
    countries = _load_countries()
    cc = country_code.upper()
    for c in countries:
        if c.get("isoCode", "").upper() == cc or c.get("id", "").upper() == cc or c.get("isoAlpha3", "").upper() == cc:
            return jsonify({"success": True, "data": c, "isDemoData": False})
    return jsonify({"success": False, "message": f"Country profile '{country_code}' not found"}), 404

@countries_bp.route("/<country_code>/crops", methods=["GET"])
def get_country_crops(country_code):
    countries = _load_countries()
    cc = country_code.upper()
    country = None
    for c in countries:
        if c.get("isoCode", "").upper() == cc or c.get("id", "").upper() == cc or c.get("isoAlpha3", "").upper() == cc:
            country = c
            break

    if not country:
        return jsonify({"success": False, "message": f"Country '{country_code}' not found"}), 404

    crops = crop_service.get_all_crops(country_code=country.get("isoCode"))
    return jsonify({
        "success": True,
        "countryCode": country.get("isoCode"),
        "countryName": country.get("name"),
        "totalCrops": len(crops),
        "data": crops,
        "isDemoData": False
    })

@countries_bp.route("/<country_code>/data-availability", methods=["GET"])
def get_country_data_availability(country_code):
    countries = _load_countries()
    cc = country_code.upper()
    country = None
    for c in countries:
        if c.get("isoCode", "").upper() == cc or c.get("id", "").upper() == cc or c.get("isoAlpha3", "").upper() == cc:
            country = c
            break

    if not country:
        return jsonify({"success": False, "message": f"Country '{country_code}' not found"}), 404

    avail = get_country_dataset_availability(country.get("isoCode"))
    return jsonify({
        "success": True,
        "country": {
            "name": country.get("name"),
            "isoAlpha2": country.get("isoCode"),
            "isoAlpha3": country.get("isoAlpha3"),
            "region": country.get("region"),
            "dataProviders": country.get("dataProviders", [])
        },
        "data": avail,
        "isDemoData": False
    })

@countries_bp.route("/<country_code>/images", methods=["GET"])
def get_country_images(country_code):
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    path = os.path.join(base_dir, "data", "country_profiles", "country_images.json")
    registry = {}
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            registry = json.load(f)

    cc = country_code.upper()
    info = registry.get(cc)
    if not info:
        # Try matching by isoAlpha3 or scanning
        countries = _load_countries()
        for c in countries:
            if c.get("isoAlpha3", "").upper() == cc or c.get("name", "").upper() == cc:
                iso2 = c.get("isoAlpha2", c.get("isoCode", "")).upper()
                info = registry.get(iso2)
                break

    if not info:
        return jsonify({"success": False, "message": f"Image metadata for '{country_code}' not found"}), 404

    return jsonify({
        "success": True,
        "data": info,
        "isDemoData": False
    })

@countries_bp.route("/<country_code>/divisions", methods=["GET"])
def get_country_divisions(country_code):
    """
    Returns administrative divisions (cities, states/provinces, sub-cities/districts)
    for any of the 54 African countries.
    """
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    path = os.path.join(base_dir, "data", "country_profiles", "african_divisions.json")
    divisions = {}
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            divisions = json.load(f)

    cc = country_code.upper()
    info = divisions.get(cc)
    if not info:
        # Check by 3-letter code
        countries = _load_countries()
        for c in countries:
            if c.get("isoAlpha3", "").upper() == cc or c.get("name", "").upper() == cc:
                iso2 = c.get("isoAlpha2", c.get("isoCode", "")).upper()
                info = divisions.get(iso2)
                break

    if not info:
        return jsonify({"success": False, "message": f"Divisions for '{country_code}' not found"}), 404

    return jsonify({
        "success": True,
        "countryCode": cc,
        "data": info,
        "isDemoData": False
    })

@countries_bp.route("/<country_code>/agriculture", methods=["GET"])
def get_country_agriculture(country_code):
    """
    Returns verified national and subnational agricultural statistics, land use,
    yields, water productivity metrics, and remote sensing layers.
    """
    from services.data_sources.faostat_service import faostat_service
    from services.data_sources.crop_calendar_service import crop_calendar_service

    countries = _load_countries()
    cc = country_code.upper()
    country = None
    for c in countries:
        if c.get("isoCode", "").upper() == cc or c.get("id", "").upper() == cc or c.get("isoAlpha3", "").upper() == cc:
            country = c
            break

    if not country:
        return jsonify({"success": False, "message": f"Country '{country_code}' not found"}), 404

    iso2 = country.get("isoCode")
    faostat_stats = faostat_service.get_country_crop_statistics(iso2)
    crop_cal = crop_calendar_service.get_crop_calendar(iso2)
    crops = crop_service.get_all_crops(country_code=iso2)
    avail = get_country_dataset_availability(iso2)

    # Compile structured coverage and data structure: Country -> Region -> District -> Farm
    payload = {
        "country": {
            "isoAlpha2": iso2,
            "isoAlpha3": country.get("isoAlpha3"),
            "name": country.get("name"),
            "capital": country.get("capital"),
            "region": country.get("region"),
            "operationalStatus": country.get("operationalStatus", "DIRECTORY_ONLY"),
            "climateZones": country.get("climateZones", []),
            "agriculturalRegions": country.get("agriculturalRegions", []),
            "supportedCrops": country.get("supportedCrops", []),
            "dataProviders": country.get("dataProviders", [])
        },
        "agriculturalStatistics": faostat_stats.get("statistics", {}),
        "nationalCropCalendar": crop_cal.get("calendar", {}),
        "cropsCatalog": crops,
        "datasetAvailability": avail,
        "waterProductivity": {
            "source": "FAO WaPOR 3.0",
            "coverage": "100m Continental Africa",
            "status": "LIVE",
            "variables": ["AETI (Actual Evapotranspiration)", "Gross Biomass Water Productivity (kg/m³)", "NPP (Net Primary Production)"]
        },
        "soilGridsSummary": {
            "source": "ISRIC SoilGrids 2.0 (250m)",
            "coverage": "National Geographic Bounds",
            "status": "LIVE"
        },
        "disclaimer": "National statistics represent official macroeconomic and agronomic averages. Do not interpret as individual farm observations."
    }

    return jsonify({
        "success": True,
        "countryCode": iso2,
        "data": payload,
        "isDemoData": False
    })





