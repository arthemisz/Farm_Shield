"""
Dataset Discovery & Availability Registry Service
=================================================
Central catalog of all real global and African datasets integrated into FarmShield:
  1. CHIRPS 2.0 (Precipitation)
  2. NASA POWER (Meteorology & Solar)
  3. ISRIC SoilGrids 2.0 (Soil Physical & Chemical Properties)
  4. Copernicus Sentinel-2 Level-2A (Satellite Vegetation / NDVI)
  5. NASA SMAP L-Band (Soil Moisture Analytical Pipeline)
  6. FAOSTAT (National Agricultural Production & Harvested Area)
  7. FAO Agro-MAPS (Subnational Land-Use Statistics)
  8. FAO WaPOR 3.0 (Water Productivity through Open-access Remotely sensed data)
  9. National Crop Calendars & Extension Guides
 10. NASA GEDI L4A — Footprint-level Aboveground Biomass Density v2.1
 11. NASA GEDI L4B — Gridded 1km Aboveground Biomass Density v2.1

Formally rejected (documented here for auditability):
  - USGS Water Data (NWIS): US-only gauge network; UNAVAILABLE_FOR_AFRICA
  - OpenET: Western US irrigated ET only; UNAVAILABLE_FOR_AFRICA; no API key stored
  - USDA NAL DMP: Governance guidance document; NOT_A_DATA_SOURCE
"""

from typing import Dict, Any, List, Optional
from services.data_sources.faostat_service import FAO_AREA_CODES
from services.data_sources.crop_calendar_service import CROP_CALENDARS

ALL_DATASETS = [
    {
        "id": "chirps-2.0",
        "name": "CHIRPS 2.0 (Climate Hazards Center InfraRed Precipitation with Station data)",
        "provider": "Climate Hazards Center, UC Santa Barbara (UCSB)",
        "type": "precipitation",
        "spatialResolution": "0.05° (~5.3 km)",
        "temporalResolution": "Daily, Monthly, Seasonal",
        "temporalCoverage": "1981 - Present",
        "status": "LIVE",
        "accessMethod": "HTTP point extraction / NASA POWER bridge / Regional Climatology",
        "officialUrl": "https://www.chc.ucsb.edu/data/chirps",
        "license": "Public Domain (Creative Commons Zero / Open Access)",
        "variables": ["Daily precipitation (mm)", "Monthly accumulation (mm)", "Long-term anomalies (mm, %)", "SPI-3", "SPI-6"]
    },
    {
        "id": "nasa-power",
        "name": "NASA POWER (Prediction Of Worldwide Energy Resources)",
        "provider": "NASA Langley Research Center",
        "type": "climatology",
        "spatialResolution": "0.5° × 0.5° (~50km)",
        "temporalResolution": "Daily, Monthly",
        "temporalCoverage": "1981 - Present",
        "status": "LIVE",
        "accessMethod": "REST API (https://power.larc.nasa.gov/api/temporal/monthly/point)",
        "officialUrl": "https://power.larc.nasa.gov/",
        "license": "NASA Open Data Policy (Public Access)",
        "variables": ["T2M (Mean Temp °C)", "T2M_MAX (°C)", "T2M_MIN (°C)", "PRECTOTCORR (mm/day)", "ALLSKY_SFC_SW_DWN (MJ/m²/day)"]
    },
    {
        "id": "isric-soilgrids",
        "name": "ISRIC SoilGrids 2.0",
        "provider": "ISRIC - World Soil Information",
        "type": "edaphic",
        "spatialResolution": "250m",
        "temporalResolution": "Static Baseline (Modeled)",
        "temporalCoverage": "Global Soil Profile Baseline",
        "status": "LIVE",
        "accessMethod": "REST API (https://rest.isric.org/soilgrids/v2.0/properties/query) / WCS / WebDAV",
        "officialUrl": "https://soilgrids.org/",
        "license": "CC-BY 4.0 Open Access",
        "variables": ["pH (H2O)", "Soil Organic Carbon (g/kg, %)", "Clay (%)", "Sand (%)", "Silt (%)", "CEC (cmol/kg)"],
        "disclaimer": "Gridded model predictions are not a substitute for localized laboratory soil tests."
    },
    {
        "id": "sentinel-2-l2a",
        "name": "Copernicus Sentinel-2 Level-2A (Surface Reflectance)",
        "provider": "European Space Agency (ESA) & Microsoft Planetary Computer",
        "type": "optical_satellite",
        "spatialResolution": "10m (B04 Red, B08 NIR)",
        "temporalResolution": "5-day revisit at equator",
        "temporalCoverage": "2015 - Present",
        "status": "LIVE",
        "accessMethod": "STAC API & Azure Blob SAS Signed COG GeoTIFF streaming",
        "officialUrl": "https://dataspace.copernicus.eu/",
        "license": "Copernicus Open Access / Microsoft Planetary Computer Terms",
        "variables": ["Band 4 (Red 665nm)", "Band 8 (NIR 842nm)", "NDVI = (B08 - B04)/(B08 + B04)"],
        "disclaimer": "NDVI indicates photosynthetic vigor; does not directly predict harvest yields."
    },
    {
        "id": "nasa-smap",
        "name": "NASA SMAP L3 Radiometer Soil Moisture (SPL3SMP_E)",
        "provider": "NASA Jet Propulsion Laboratory (JPL) & Goddard Space Flight Center",
        "type": "soil_moisture",
        "spatialResolution": "9 km gridded L-Band",
        "temporalResolution": "Daily 2-3 day revisit",
        "temporalCoverage": "2015 - Present",
        "status": "LIVE",
        "accessMethod": "NASA Earthdata HDF5 / CMR Cloud API",
        "officialUrl": "https://smap.jpl.nasa.gov/",
        "license": "NASA Open Data Policy",
        "variables": ["Volumetric Soil Moisture (m³/m³)", "Root-zone estimate", "Plant Available Water % (PAW)", "Irrigation Deficit mm"],
        "disclaimer": "L-band microwave observations sense top 0-5cm; root-zone derived via Saxton-Rawls pedotransfer models."
    },
    {
        "id": "faostat-production",
        "name": "FAOSTAT Agricultural Production Statistics (QCL)",
        "provider": "Food and Agriculture Organization of the United Nations (FAO)",
        "type": "agricultural_statistics",
        "spatialResolution": "National boundary",
        "temporalResolution": "Annual",
        "temporalCoverage": "1961 - 2022",
        "status": "LIVE",
        "accessMethod": "REST API (https://fenixservices.fao.org/faostat/api/v1/en/data/QCL)",
        "officialUrl": "https://www.fao.org/faostat/",
        "license": "FAO Open Access (CC-BY-NC-SA 3.0 IGO)",
        "variables": ["Production (tonnes)", "Harvested Area (ha)", "Yield (kg/ha)"],
        "disclaimer": "National statistics provide macroeconomic context, not farm-level harvest counts."
    },
    {
        "id": "fao-agro-maps",
        "name": "FAO Agro-MAPS (Subnational Land-Use and Crop Production)",
        "provider": "FAO Land and Water Division & IFPRI",
        "type": "subnational_crop_statistics",
        "spatialResolution": "Administrative Level 1 & 2 (Provinces / Districts)",
        "temporalResolution": "Multi-year agricultural censuses",
        "temporalCoverage": "Historical Baseline",
        "status": "CACHED",
        "accessMethod": "FAO Land & Water Spatial Data Repository",
        "officialUrl": "https://www.fao.org/land-water/resources/tools/databases/agro-maps/en/",
        "license": "FAO Open Access",
        "variables": ["Crop area by administrative unit", "Regional crop share (%)", "Irrigation extent"]
    },
    {
        "id": "fao-wapor",
        "name": "FAO WaPOR 3.0 (Water Productivity through Open Access of Remotely sensed data)",
        "provider": "FAO Land and Water Division",
        "type": "water_productivity",
        "spatialResolution": "100m (Continental Africa) / 20m (Selected Pilot Schemes)",
        "temporalResolution": "Dekadal / Monthly / Annual",
        "temporalCoverage": "2009 - Present",
        "status": "LIVE",
        "accessMethod": "WaPOR API (https://io.apps.fao.org/gws/catalog/api/v1/)",
        "officialUrl": "https://www.fao.org/in-action/remote-sensing-for-water-productivity/wapor-data/en",
        "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
        "variables": ["Actual Evapotranspiration (AETI mm)", "Gross Biomass Water Productivity (kg/m³)", "Net Primary Production (NPP)", "Precipitation (PCP)"]
    },
    {
        "id": "national-crop-calendars",
        "name": "National Agricultural Research Crop Calendars",
        "provider": "EIAR (Ethiopia), KALRO (Kenya), IITA (Nigeria), CSIR-CRI (Ghana), ARC (South Africa)",
        "type": "agronomic_knowledge",
        "spatialResolution": "National Agroecological Zone",
        "temporalResolution": "Phenological stage / Seasonal",
        "temporalCoverage": "Updated seasonal extension packages",
        "status": "LIVE",
        "accessMethod": "Curated National Agricultural Extension Datasets",
        "officialUrl": "https://www.fao.org/giews/countrybrief/",
        "license": "Public Agricultural Extension Literature",
        "variables": ["Planting window", "Flowering period", "Harvest window", "Critical moisture stages"]
    },
    # ─────────────────────────────────────────────────────────────────────────
    # NASA GEDI L4A — Footprint-level Aboveground Biomass Density v2.1
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "nasa-gedi-l4a",
        "name": "NASA GEDI L4A Footprint Level Aboveground Biomass Density v2.1",
        "provider": "NASA GEDI / ORNL DAAC",
        "type": "vegetation_structure",
        "spatialResolution": "25m footprint (~60m along-track, ~600m cross-track beam spacing)",
        "temporalResolution": "Instantaneous / Irregular ISS overpass",
        "temporalCoverage": "2019-04-18 to Present",
        "status": "CACHED",
        "integrationStatus": "VERIFIED",
        "accessMethod": "ORNL DAAC HDF5 granule files (DOI: 10.3334/ORNLDAAC/2056)",
        "officialUrl": "https://daac.ornl.gov/cgi-bin/dsviewer.pl?ds_id=2056",
        "doi": "10.3334/ORNLDAAC/2056",
        "license": "NASA Open Data Policy",
        "variables": [
            "agbd (Aboveground Biomass Density, Mg/ha)",
            "agbd_se (AGBD Standard Error, Mg/ha)",
            "l4_quality_flag (1=science-grade)",
            "degrade_flag (0=unaffected)"
        ],
        "africanCoverage": True,
        "africanCoverageNote": "Ethiopian Highlands (8–10°N) confirmed within GEDI 51.6°N–51.6°S orbital range.",
        "limitations": [
            "Footprint-level (not continuous raster) — gaps between footprints are DATA_PENDING.",
            "Cannot measure crop yield, soil fertility, or crop species.",
            "Requires l4_quality_flag=1 for science-grade data."
        ]
    },
    # ─────────────────────────────────────────────────────────────────────────
    # NASA GEDI L4B — Gridded 1km Aboveground Biomass Density v2.1
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": "nasa-gedi-l4b",
        "name": "NASA GEDI L4B Gridded Aboveground Biomass Density v2.1",
        "provider": "NASA GEDI / ORNL DAAC",
        "type": "vegetation_structure",
        "spatialResolution": "1km gridded (1000m x 1000m)",
        "temporalResolution": "Multi-year baseline (2019–2023)",
        "temporalCoverage": "2019-04-18 to 2023-03-16 (v2.1 baseline)",
        "status": "CACHED",
        "integrationStatus": "VERIFIED",
        "accessMethod": "ORNL DAAC COG GeoTIFF (DOI: 10.3334/ORNLDAAC/2299)",
        "officialUrl": "https://daac.ornl.gov/cgi-bin/dsviewer.pl?ds_id=2299",
        "doi": "10.3334/ORNLDAAC/2299",
        "license": "NASA Open Data Policy",
        "variables": [
            "MU (Mean AGBD, Mg/ha)",
            "SE (AGBD Standard Error, Mg/ha)",
            "CNT (Footprint count per 1km cell)",
            "V1 (Lower CI bound)",
            "V2 (Upper CI bound)"
        ],
        "africanCoverage": True,
        "africanCoverageNote": "Global 52°N–52°S; all 54 African countries covered.",
        "limitations": [
            "Gridded spatial mean — not individual waveforms (see L4A).",
            "Baseline period only (2019–2023 v2.1); not real-time.",
            "Cannot measure crop yield, soil fertility, or crop species."
        ]
    },
    {
        "id": "openet-evapotranspiration",
        "name": "OpenET Satellite Evapotranspiration Ensemble",
        "provider": "OpenET Consortium (Desert Research Institute / NASA Ames / USGS / EDF / Google)",
        "type": "evapotranspiration",
        "spatialResolution": "30m (Landsat & gridMET)",
        "temporalResolution": "Daily, Monthly",
        "temporalCoverage": "2016 - Present (CONUS)",
        "status": "UNAVAILABLE",
        "accessMethod": "REST API (https://openet-api.org/raster/timeseries/point)",
        "officialUrl": "https://openet-api.org/",
        "license": "OpenET Terms of Service (API Key Authentication Required)",
        "variables": [
            "ET (Evapotranspiration, mm)",
            "ETo (Reference Evapotranspiration, mm)",
            "ETof (Evapotranspiration Fraction)",
            "NDVI (Normalized Difference Vegetation Index)",
            "PR (Precipitation, mm)"
        ],
        "africanCoverage": False,
        "africanCoverageNote": "UNAVAILABLE FOR AFRICA. Operational domain is strictly limited to the Conterminous United States (CONUS). African locations report UNAVAILABLE.",
        "limitations": [
            "Operational API domain is strictly CONUS; Africa, Ethiopia, and other non-US coordinates are outside the operational grid domain.",
            "Requires registered OpenET API key configured in backend environment (OPENET_API_KEY).",
            "FarmShield does not fabricate or simulate ET observations for African farms."
        ]
    }
]

def get_all_dataset_records() -> List[Dict[str, Any]]:
    return ALL_DATASETS

def get_country_dataset_availability(country_code: str) -> Dict[str, Any]:
    cc = country_code.upper()
    has_faostat = cc in FAO_AREA_CODES
    has_calendar = cc in CROP_CALENDARS
    is_pilot = cc in ["ET", "KE", "NG", "GH", "ZA"]
    
    availability = [
        {"datasetId": "chirps-2.0", "name": "CHIRPS Precipitation", "available": True, "status": "LIVE", "coverage": "Pan-Africa (54)"},
        {"datasetId": "nasa-power", "name": "NASA POWER Climate", "available": True, "status": "LIVE", "coverage": "Global"},
        {"datasetId": "isric-soilgrids", "name": "ISRIC SoilGrids 2.0", "available": True, "status": "LIVE", "coverage": "Global (250m)"},
        {"datasetId": "sentinel-2-l2a", "name": "Sentinel-2 Satellite", "available": True, "status": "LIVE", "coverage": "Pan-Africa (10m)"},
        {"datasetId": "nasa-smap", "name": "NASA SMAP Soil Moisture", "available": True, "status": "LIVE", "coverage": "Pan-Africa (9km)"},
        {"datasetId": "faostat-production", "name": "FAOSTAT Production Statistics", "available": has_faostat, "status": "LIVE" if has_faostat else "REGIONAL_ESTIMATE", "coverage": f"Area Code {FAO_AREA_CODES.get(cc, 'Unmapped')}"},
        {"datasetId": "fao-agro-maps", "name": "FAO Agro-MAPS Subnational", "available": is_pilot, "status": "LIVE" if is_pilot else "DATA_PENDING", "coverage": "Subnational admin levels 1 & 2"},
        {"datasetId": "fao-wapor", "name": "FAO WaPOR Water Productivity", "available": True, "status": "LIVE", "coverage": "Continental Africa (100m)"},
        {"datasetId": "national-crop-calendars", "name": "National Crop Calendar", "available": has_calendar, "status": "LIVE" if has_calendar else "EXTENSION_GENERAL", "coverage": "National Research Institutes"},
        # NASA GEDI — global coverage includes all 54 African countries (52°N–52°S)
        {
            "datasetId": "nasa-gedi-l4a",
            "name": "NASA GEDI L4A Footprint Biomass",
            "available": True,
            "status": "CACHED",
            "coverage": "Global (51.6°N–51.6°S, ISS orbit) — Africa fully covered",
            "note": "Footprint-level (25m circles at ~600m spacing). Gaps are DATA_PENDING."
        },
        {
            "datasetId": "nasa-gedi-l4b",
            "name": "NASA GEDI L4B Gridded Biomass (1km)",
            "available": True,
            "status": "CACHED",
            "coverage": "Global (52°N–52°S) — all 54 African countries covered",
            "note": "1km gridded spatial mean of L4A footprints. Distinct from L4A."
        },
        {
            "datasetId": "openet-evapotranspiration",
            "name": "OpenET Satellite Evapotranspiration",
            "available": False,
            "status": "UNAVAILABLE",
            "coverage": "Conterminous US Only (CONUS) — UNAVAILABLE FOR AFRICA",
            "note": "OpenET API operational coverage does not extend to Africa. FarmShield reports this limitation transparently without synthetic substitution."
        }
    ]
    
    return {
        "countryCode": cc,
        "totalDatasets": len(availability),
        "availableCount": sum(1 for a in availability if a["available"]),
        "datasets": availability
    }
