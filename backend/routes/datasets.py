from flask import Blueprint, jsonify, request
from services.dataset_registry_service import get_all_dataset_records, get_country_dataset_availability
from services.data_sources.faostat_service import faostat_service
from services.data_sources.crop_calendar_service import crop_calendar_service

datasets_bp = Blueprint("datasets", __name__)

@datasets_bp.route("", methods=["GET"])
def get_datasets():
    """Lists all integrated global and African agricultural datasets with complete specifications."""
    datasets = get_all_dataset_records()
    return jsonify({
        "success": True,
        "count": len(datasets),
        "data": datasets,
        "isDemoData": False
    })

@datasets_bp.route("/availability", methods=["GET"])
def get_availability():
    """Queries dataset availability for a given country ISO code (e.g. ?country=ET)."""
    country_code = request.args.get("country", "ET").upper()
    availability = get_country_dataset_availability(country_code)
    return jsonify({
        "success": True,
        "data": availability
    })

@datasets_bp.route("/faostat/<country_code>", methods=["GET"])
def get_faostat_country(country_code):
    """Retrieves national crop production, yield, and area statistics from FAOSTAT."""
    crop_id = request.args.get("crop")
    year = int(request.args.get("year", 2022))
    stats = faostat_service.get_country_crop_statistics(country_code, crop_id=crop_id, year=year)
    return jsonify({
        "success": True,
        "data": stats
    })

@datasets_bp.route("/crop-calendar/<country_code>", methods=["GET"])
def get_crop_calendar(country_code):
    """Retrieves verified national crop calendar and planting periods."""
    crop_id = request.args.get("crop")
    cal = crop_calendar_service.get_crop_calendar(country_code, crop_id=crop_id)
    return jsonify({
        "success": True,
        "data": cal
    })

@datasets_bp.route("/observations", methods=["GET"])
def get_observations():
    """
    Retrieves stored scientific observations from the database with filtering by:
    - country: ISO code (e.g. ET)
    - farm_id: specific farm
    - dataset_id: (e.g. nasa-gpm-imerg, nasa-ecostress, nasa-viirs-vegetation)
    - variable: (e.g. NDVI, precipitationAccumulation, T2M, soil_moisture)
    - lat, lon: coordinate proximity query
    """
    from models import EnvironmentalObservation
    query = EnvironmentalObservation.query

    country = request.args.get("country")
    if country:
        query = query.filter_by(country_code=country.upper())

    farm_id = request.args.get("farm_id")
    if farm_id:
        query = query.filter_by(farm_id=farm_id)

    dataset_id = request.args.get("dataset_id")
    if dataset_id:
        query = query.filter_by(dataset_id=dataset_id)

    variable = request.args.get("variable")
    if variable:
        query = query.filter_by(variable_name=variable)

    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    if lat is not None and lon is not None:
        # Bounding box filter within ~0.5 degree
        query = query.filter(
            EnvironmentalObservation.latitude.between(lat - 0.5, lat + 0.5),
            EnvironmentalObservation.longitude.between(lon - 0.5, lon + 0.5)
        )

    records = query.order_by(EnvironmentalObservation.observation_date.desc()).limit(100).all()
    return jsonify({
        "success": True,
        "count": len(records),
        "data": [r.to_dict() for r in records]
    })

def _haversine_distance_km(lat1, lon1, lat2, lon2):
    import math
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 3)

@datasets_bp.route("/gedi/farm/<farm_id>", methods=["GET"])
def get_gedi_for_farm(farm_id):
    """
    Returns GEDI L4A footprint and L4B gridded biomass data for a specific farm.

    IMPORTANT scientific notices returned with every response:
    - GEDI footprints are ~25m diameter circles with ~60m along-track spacing 
      and ~600m cross-track beam spacing. A single footprint does NOT characterise the whole farm.
    - Gaps between footprints are DATA_PENDING, never zero-filled.
    - GEDI cannot directly measure crop yield, soil fertility, or crop health.
    - L4A and L4B are distinct products: L4A = individual footprint waveforms;
      L4B = 1km spatial mean aggregated from L4A.
    """
    from models import EnvironmentalObservation, Farm
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({"success": False, "error": f"Farm {farm_id} not found"}), 404

    l4a_obs = (EnvironmentalObservation.query
               .filter_by(farm_id=farm_id, dataset_id="nasa-gedi-l4a")
               .order_by(EnvironmentalObservation.observation_date.desc())
               .all())
    l4b_obs = (EnvironmentalObservation.query
               .filter_by(farm_id=farm_id, dataset_id="nasa-gedi-l4b")
               .order_by(EnvironmentalObservation.observation_date.desc())
               .all())

    # Build detailed L4A list with actual distance and geometry info
    l4a_list = []
    min_dist_km = None
    for o in l4a_obs:
        d_dict = o.to_dict()
        dist = _haversine_distance_km(farm.latitude, farm.longitude, o.latitude, o.longitude)
        d_dict["distanceFromFarmKm"] = dist
        if min_dist_km is None or dist < min_dist_km:
            min_dist_km = dist
        l4a_list.append(d_dict)

    # Build detailed L4B list with 1km cell metadata
    l4b_list = []
    for o in l4b_obs:
        d_dict = o.to_dict()
        d_dict["gridCellSize"] = "1km x 1km"
        d_dict["spatialCoverage"] = "Spatial mean of L4A footprints inside cell"
        l4b_list.append(d_dict)

    within_orbital = abs(farm.latitude) <= 51.6
    dist_val = min_dist_km if min_dist_km is not None else 0.0

    # Determine spatial matching classification
    # If the observation has identical coordinates to the farm because it was synthetic/literature-seeded,
    # or no genuine granule footprint boundary intersection exists, classify accurately:
    has_genuine_spatial_match = False
    spatial_match_status = "NO_MATCHING_OBSERVATION"
    if within_orbital:
        spatial_match_status = "ORBITAL_COVERAGE_ONLY_NO_GENUINE_FOOTPRINT_MATCH"

    return jsonify({
        "success": True,
        "farmId": farm_id,
        "farmName": farm.name,
        "farmCoordinates": {"latitude": farm.latitude, "longitude": farm.longitude},
        "hasFarmBoundary": False,
        "gediCoverage": {
            "withinOrbitalRange": within_orbital,
            "orbitalInclination": "51.6°",
            "geographicMatchStatus": spatial_match_status,
            "hasGenuineSpatialMatch": has_genuine_spatial_match,
            "matchingRadiusKm": 0.5,
            "l4aFootprintDistanceKm": dist_val,
            "samplingGeometry": {
                "footprintDiameterM": 25,
                "alongTrackSpacingM": 60,
                "crossTrackBeamSpacingM": 600
            },
            "notice": (
                "A GEDI footprint is a ~25m circular sample with ~60m along-track spacing "
                "and ~600m cross-track beam spacing. Gaps between footprints are DATA_PENDING, never zero-filled. "
                "Orbital latitude coverage alone does NOT constitute a verified spatial footprint match."
            )
        },
        "l4a": {
            "product": "GEDI L4A Footprint Level Aboveground Biomass Density v2.1",
            "doi": "10.3334/ORNLDAAC/2056",
            "provenance": "LITERATURE_REFERENCE",
            "isGenuineSatelliteObservation": False,
            "observations": l4a_list,
            "count": len(l4a_list)
        },
        "l4b": {
            "product": "GEDI L4B Gridded Aboveground Biomass Density v2.1",
            "doi": "10.3334/ORNLDAAC/2299",
            "gridResolution": "1km x 1km",
            "observationPeriod": "2019-04-18 to 2023-03-16 (v2.1 baseline)",
            "provenance": "LITERATURE_REFERENCE",
            "isGenuineSatelliteObservation": False,
            "observations": l4b_list,
            "count": len(l4b_list)
        },
        "versionComparison": {
            "currentVersion": "v2.1",
            "v3Status": "Under evaluation; v2.1 is currently the stable science-grade product.",
            "recommendation": "Use v2.1 baseline until v3 has validated continental coverage."
        },
        "scientificLimitations": [
            "GEDI does not directly measure crop yield.",
            "GEDI does not measure soil fertility or soil nutrient content.",
            "GEDI does not identify crop species or crop health.",
            "GEDI biomass estimates carry uncertainty (agbd_se variable).",
            "l4_quality_flag=1 required for science-grade L4A retrievals.",
            "L4B is a spatial mean; individual footprint variation is captured only by L4A.",
            "CACHED provenance: live ORNL DAAC download requires network access not available in sandbox."
        ],
        "rejectedSources": {
            "usgs-water-data": "UNAVAILABLE_FOR_AFRICA — US-only gauge network, no African data.",
            "openet-et": "UNAVAILABLE_FOR_AFRICA — Western US only, no African ET coverage, no API key stored.",
            "usda-nal-dmp": "NOT_A_DATA_SOURCE — Governance reference document only."
        }
    })


@datasets_bp.route("/openet/point", methods=["GET", "POST"])
def get_openet_point():
    """
    OpenET API point-level Evapotranspiration endpoint.
    Retrieves monthly/daily ET for given coordinates.
    Strictly checks geographic coverage (CONUS) and returns UNAVAILABLE for African coordinates.
    """
    from services.openet_service import OpenETService
    
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        lat = data.get("lat") or data.get("latitude")
        lon = data.get("lon") or data.get("longitude")
        start_date = data.get("startDate", "2023-01-01")
        end_date = data.get("endDate", "2023-12-31")
        variable = data.get("variable", "ET")
        model = data.get("model", "Ensemble")
        interval = data.get("interval", "monthly")
        units = data.get("units", "mm")
    else:
        lat = request.args.get("lat", type=float)
        lon = request.args.get("lon", type=float)
        start_date = request.args.get("startDate", "2023-01-01")
        end_date = request.args.get("endDate", "2023-12-31")
        variable = request.args.get("variable", "ET")
        model = request.args.get("model", "Ensemble")
        interval = request.args.get("interval", "monthly")
        units = request.args.get("units", "mm")

    if lat is None or lon is None:
        return jsonify({
            "success": False,
            "status": "MISSING_COORDINATES",
            "provenanceStatus": "UNAVAILABLE",
            "error": "Query parameters 'lat' and 'lon' are required."
        }), 400

    service = OpenETService()
    result = service.get_point_evapotranspiration(
        lat=float(lat),
        lon=float(lon),
        start_date=start_date,
        end_date=end_date,
        variable=variable,
        model=model,
        interval=interval,
        units=units
    )
    return jsonify(result), 200


@datasets_bp.route("/openet/farm/<farm_id>", methods=["GET"])
def get_openet_farm(farm_id):
    """
    Retrieves OpenET data for a specific farm ID.
    African farms immediately return status OUT_OF_COVERAGE / UNAVAILABLE with full scientific disclosure.
    """
    from models import Farm
    from services.openet_service import OpenETService

    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({
            "success": False,
            "status": "NOT_FOUND",
            "error": f"Farm '{farm_id}' not found."
        }), 404

    service = OpenETService()
    result = service.get_point_evapotranspiration(
        lat=farm.latitude,
        lon=farm.longitude
    )
    result["farmId"] = farm.id
    result["farmName"] = farm.name
    result["country"] = farm.country
    result["countryCode"] = farm.country_code
    return jsonify(result), 200


@datasets_bp.route("/database-summary", methods=["GET"])
def get_database_summary():
    """
    Returns live database-derived statistics across all 54 African countries:
    - Total verified datasets in SQL database
    - Total stored scientific observations
    - Breakdown by satellite/sensor (NASA POWER, GPM, ECOSTRESS, VIIRS, SoilGrids)
    - Countries with stored ground observations
    - Geographic restrictions (e.g. USDA Web Soil Survey flagged as UNAVAILABLE_FOR_AFRICA)
    """
    from models import db, DatasetRecord, EnvironmentalObservation, DatasetIngestionLog
    datasets = DatasetRecord.query.all()
    total_obs = EnvironmentalObservation.query.count()
    
    by_dataset = {}
    for ds in datasets:
        cnt = EnvironmentalObservation.query.filter_by(dataset_id=ds.id).count()
        by_dataset[ds.id] = {
            "name": ds.name,
            "provider": ds.provider,
            "observationCount": cnt,
            "geographicCoverage": ds.geographic_coverage,
            "integrationStatus": ds.integration_status,
            "status": ds.status
        }

    # Distinct countries with observations
    distinct_countries = [r[0] for r in db.session.query(EnvironmentalObservation.country_code).distinct().all()]

    return jsonify({
        "success": True,
        "totalDatasets": len(datasets),
        "totalObservations": total_obs,
        "datasets": by_dataset,
        "coveredCountries": distinct_countries,
        "geographicRestrictions": {
            "usdaWebSoilSurvey": "United States Only (CONUS). Formally blocked from African soil records.",
            "conusCroplandIntensity": "Continental US Only. Formally excluded from Africa."
        }
    })
