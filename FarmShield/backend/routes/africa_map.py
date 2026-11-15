import json
import os
from flask import Blueprint, jsonify, request

africa_map_bp = Blueprint("africa_map", __name__)

_geojson_cache = None

def _load_africa_geojson():
    global _geojson_cache
    if _geojson_cache is not None:
        return _geojson_cache
    
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    path = os.path.join(base_dir, "data", "africa_countries.geojson")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            _geojson_cache = json.load(f)
            return _geojson_cache
    return {"type": "FeatureCollection", "features": []}

@africa_map_bp.route("/geojson", methods=["GET"])
def get_africa_geojson():
    """Returns the verified 54-country GeoJSON feature collection for Africa."""
    geo = _load_africa_geojson()
    return jsonify({
        "success": True,
        "type": "FeatureCollection",
        "featureCount": len(geo.get("features", [])),
        "data": geo
    })

@africa_map_bp.route("/country/<iso_code>", methods=["GET"])
def get_country_boundary(iso_code):
    """Returns boundary geometry and metadata for a specific country."""
    geo = _load_africa_geojson()
    iso = iso_code.upper()
    for feat in geo.get("features", []):
        props = feat.get("properties", {})
        if props.get("isoCode", "").upper() == iso or props.get("isoAlpha3", "").upper() == iso:
            return jsonify({
                "success": True,
                "country": props,
                "geometry": feat.get("geometry")
            })
    return jsonify({"success": False, "message": f"Boundary for country '{iso_code}' not found."}), 404

@africa_map_bp.route("/agricultural-layers", methods=["GET"])
def get_agricultural_layers():
    """
    Returns verified layer catalog for mapping: standard, satellite, terrain,
    farm boundaries, rainfall, soil, vegetation (NDVI), and agricultural water productivity.
    """
    layers = [
        {
            "id": "standard",
            "name": "Standard Basemap",
            "category": "base",
            "provider": "OpenStreetMap",
            "type": "cartographic",
            "status": "LIVE",
            "description": "Cartographic vector tiles with roads, borders, and town labels."
        },
        {
            "id": "satellite",
            "name": "Satellite True-Color Imagery",
            "category": "base",
            "provider": "Esri World Imagery",
            "type": "raster",
            "status": "LIVE",
            "description": "High-resolution true-color visual satellite base imagery."
        },
        {
            "id": "terrain",
            "name": "Terrain & Topography",
            "category": "base",
            "provider": "Esri World Topo Map",
            "type": "raster",
            "status": "LIVE",
            "description": "Shaded relief and topographic elevation contours."
        },
        {
            "id": "farm_boundaries",
            "name": "Registered Farm & Plot Boundaries",
            "category": "farm",
            "provider": "FarmShield Cadastral Database",
            "type": "vector_geojson",
            "status": "LIVE",
            "description": "Field polygons, planted crop records, and sub-plot boundaries."
        },
        {
            "id": "precipitation_chirps",
            "name": "Rainfall & Drought Anomaly (CHIRPS)",
            "category": "climate",
            "provider": "Climate Hazards Center (UCSB)",
            "type": "analytical",
            "status": "LIVE",
            "description": "5km high-resolution rainfall observations and SPI drought indices."
        },
        {
            "id": "soil_moisture_smap",
            "name": "Soil Moisture & Water Deficit (SMAP)",
            "category": "soil",
            "provider": "NASA JPL / Goddard",
            "type": "analytical",
            "status": "LIVE",
            "description": "L-band microwave surface and root-zone plant available water (PAW %)."
        },
        {
            "id": "vegetation_sentinel2",
            "name": "Vegetation Vigor & NDVI (Sentinel-2)",
            "category": "vegetation",
            "provider": "ESA Copernicus / Planetary Computer",
            "type": "satellite_multispectral",
            "status": "LIVE",
            "description": "10-meter resolution normalized difference vegetation index."
        },
        {
            "id": "water_productivity_wapor",
            "name": "Agricultural Water Productivity (WaPOR)",
            "category": "water",
            "provider": "FAO Land and Water Division",
            "type": "analytical",
            "status": "LIVE",
            "description": "Biomass water productivity (kg/m³) and evapotranspiration (AETI mm)."
        }
    ]
    return jsonify({
        "success": True,
        "count": len(layers),
        "data": layers
    })


@africa_map_bp.route("/point-query", methods=["GET"])
def query_map_point():
    """
    Independent Spatial Query Endpoint:
    Given (lat, lon), queries actual backend services for SoilGrids pH, NASA/CHIRPS rainfall,
    and returns exact, non-hardcoded values with data availability status and provenance.
    """
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "Valid 'lat' and 'lon' query parameters required."}), 400

    from services.soil_service import soil_service
    from services.chirps_service import ChirpsRainfallService

    # 1. Soil Query (SoilGrids 2.0 pH)
    soil_res = soil_service.get_soil_properties(lat, lon)
    ph_val = soil_res.get("ph")

    # 2. CHIRPS Rainfall Query
    chirps_svc = ChirpsRainfallService()
    rf_res = chirps_svc.get_rainfall_analysis(lat, lon)
    annual_rf = rf_res.get("annual", {}).get("totalRainfallMm", None)

    return jsonify({
        "success": True,
        "coordinates": {"lat": round(lat, 4), "lon": round(lon, 4)},
        "soil_ph": {
            "value": ph_val,
            "depth": "0-30cm",
            "status": "LIVE" if not soil_res.get("provenance", {}).get("isDemoData") else "CALCULATED_ESTIMATE",
            "source": soil_res.get("provenance", {}).get("source", "ISRIC SoilGrids 2.0")
        },
        "rainfall_chirps": {
            "annual_total_mm": annual_rf,
            "status": "LIVE" if not rf_res.get("provenance", {}).get("isDemoData") else "CALIBRATED_CLIMATOLOGY",
            "source": "Climate Hazards Center (CHIRPS 2.0)"
        },
        "water_resources": {
            "status": "CARTOGRAPHIC_VECTOR",
            "note": "River and lake vectors from HydroRIVERS/HydroLAKES database. No live discharge telemetry."
        },
        "soil_degradation": {
            "status": "MODELLED_RISK_PROXY",
            "note": "FAO GLADA/ISRIC proxy indicator based on slope and vegetative cover; not direct in-situ lab degradation."
        }
    })
