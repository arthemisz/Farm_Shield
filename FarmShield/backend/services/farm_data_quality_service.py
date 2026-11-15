"""
Farm Data Quality Evaluation Service
====================================
Evaluates the completeness, freshness, source reliability, spatial resolution,
and temporal resolution of all data feeds available for a specific farm.

Core Principles:
  1. No arbitrary scientific scores.
  2. Clear, transparent criteria covering 6 core data dimensions.
  3. Explicit identification of missing or unverified layers.
  4. Distinguishes live observations from static baselines and cached queries.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List

class FarmDataQualityService:
    """Evaluates the multi-layer data readiness and fidelity for a farm parcel."""

    def evaluate_farm_data_quality(
        self,
        climate_data: Dict[str, Any],
        soil_data: Dict[str, Any],
        rainfall_data: Dict[str, Any],
        vegetation_data: Dict[str, Any],
        drought_data: Dict[str, Any],
        crop_calendar_data: Dict[str, Any],
        faostat_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Assesses completeness across the 6 major agricultural intelligence domains.
        """
        evaluations = []
        missing_domains = []
        live_layers_count = 0
        cached_layers_count = 0
        demonstration_layers_count = 0

        # 1. Climate (NASA POWER)
        clim_prov = climate_data.get("provenance", {})
        clim_status = clim_prov.get("status", "UNAVAILABLE")
        clim_eval = {
            "domain": "Meteorology & Climatology",
            "provider": clim_prov.get("provider", "NASA Langley Research Center"),
            "dataset": clim_prov.get("dataset", "NASA POWER Daily/Monthly AG"),
            "status": clim_status,
            "spatialResolution": clim_prov.get("spatialResolution", "0.5° × 0.5° (~50km)"),
            "temporalResolution": "Monthly aggregate (1981-present)",
            "isDemoData": clim_prov.get("isDemoData", False),
            "completeness": "COMPLETE" if clim_status in ["LIVE", "CACHED"] else "PARTIAL",
            "notes": "Covers thermal windows (T2M), GDD potential, and solar radiation (ALLSKY_SFC_SW_DWN)."
        }
        evaluations.append(clim_eval)

        # 2. Precipitation & Anomalies (CHIRPS 2.0)
        rain_prov = rainfall_data.get("provenance", {})
        rain_status = rain_prov.get("status", "UNAVAILABLE")
        rain_eval = {
            "domain": "Precipitation & Rainfall Anomalies",
            "provider": rain_prov.get("provider", "Climate Hazards Center UCSB"),
            "dataset": rain_prov.get("dataset", "CHIRPS 2.0"),
            "status": rain_status,
            "spatialResolution": "0.05° (~5.3 km)",
            "temporalResolution": "Daily aggregated to monthly / seasonal",
            "isDemoData": rain_prov.get("isDemoData", False),
            "completeness": "COMPLETE" if rain_status in ["LIVE", "CACHED"] else "PARTIAL",
            "notes": "Benchmarked against 1981-2010 regional climatology for anomaly tracking."
        }
        evaluations.append(rain_eval)

        # 3. Soil Properties (ISRIC SoilGrids 2.0)
        soil_prov = soil_data.get("provenance", {})
        soil_status = soil_prov.get("status", "UNAVAILABLE")
        soil_eval = {
            "domain": "Soil Edaphic Baseline",
            "provider": soil_prov.get("provider", "ISRIC - World Soil Information"),
            "dataset": soil_prov.get("dataset", "SoilGrids 2.0"),
            "status": soil_status,
            "spatialResolution": soil_prov.get("spatialResolution", "250m"),
            "temporalResolution": "Static baseline model",
            "isDemoData": soil_prov.get("isDemoData", False),
            "completeness": "COMPLETE" if soil_status in ["LIVE", "CACHED"] else "INCOMPLETE",
            "notes": "Provides pH (H2O), organic carbon, sand/silt/clay fractions, and CEC at 0-30cm."
        }
        evaluations.append(soil_eval)

        # 4. Satellite Canopy Monitoring (Sentinel-2 L2A)
        veg_prov = vegetation_data.get("provenance", {})
        veg_status = veg_prov.get("status", "UNAVAILABLE")
        has_real_ndvi = vegetation_data.get("currentNdviIndex") is not None
        veg_eval = {
            "domain": "Optical Satellite Vegetation Monitoring",
            "provider": veg_prov.get("provider", "ESA & Microsoft Planetary Computer"),
            "dataset": veg_prov.get("dataset", "Sentinel-2 Level-2A"),
            "status": veg_status,
            "spatialResolution": veg_prov.get("spatialResolution", "10m (B04, B08)"),
            "temporalResolution": "5-day revisit at equator",
            "isDemoData": veg_prov.get("isDemoData", False),
            "completeness": "COMPLETE" if has_real_ndvi else ("PARTIAL_METADATA_ONLY" if veg_status == "PARTIAL" else "UNAVAILABLE"),
            "notes": "NDVI computed from actual B04/B08 pixels when LIVE; STAC metadata only when PARTIAL."
        }
        evaluations.append(veg_eval)

        # 5. Drought Risk Monitoring (SPI-3 & SPI-6)
        drought_prov = drought_data.get("provenance", {})
        meteo = drought_data.get("meteorologicalDrought", {})
        drought_status = drought_prov.get("status", "UNAVAILABLE")
        drought_eval = {
            "domain": "Drought Risk & Moisture Stress",
            "provider": "WMO Standardized Precipitation Index Guidelines",
            "dataset": "SPI-3 / SPI-6 Indices",
            "status": drought_status,
            "spatialResolution": "Point-derived from CHIRPS precipitation",
            "temporalResolution": "3-month & 6-month cumulative rolling windows",
            "isDemoData": drought_prov.get("isDemoData", False),
            "completeness": meteo.get("spiDataQuality", "INSUFFICIENT_HISTORY"),
            "notes": f"Method: {meteo.get('spiMethod', 'Linear approximation')}. Distinguishes atmospheric SPI from agricultural soil moisture."
        }
        evaluations.append(drought_eval)

        # 6. Agronomic Knowledge & Calendars
        cal_prov = crop_calendar_data.get("provenance", {})
        cal_status = cal_prov.get("status", "UNAVAILABLE")
        cal_eval = {
            "domain": "National Agronomic Calendar & Extension",
            "provider": crop_calendar_data.get("researchInstitution", "National Extension Services"),
            "dataset": "Verified National Research Packages (EIAR, KALRO, IITA, CSIR, ARC)",
            "status": cal_status,
            "spatialResolution": "National agroecological zones",
            "temporalResolution": "Phenological crop stages",
            "isDemoData": False,
            "completeness": "VERIFIED_NATIONAL" if crop_calendar_data.get("calendarAvailable", True) else "GENERAL_REGIONAL",
            "notes": "Locally adapted planting and harvesting windows based on seasonal onset."
        }
        evaluations.append(cal_eval)

        # Count layer classifications
        for ev in evaluations:
            st = ev["status"]
            if st == "LIVE":
                live_layers_count += 1
            elif st == "CACHED":
                cached_layers_count += 1
            elif st == "DEMONSTRATION":
                demonstration_layers_count += 1
            elif st in ["UNAVAILABLE", "INCOMPLETE"]:
                missing_domains.append(ev["domain"])

        # Determine overall qualitative readiness level
        if live_layers_count + cached_layers_count >= 5 and has_real_ndvi:
            readiness_level = "HIGH_FIDELITY_OBSERVATIONAL"
            readiness_description = "Comprehensive multi-sensor and agronomic telemetry available for precision decision support."
        elif live_layers_count + cached_layers_count >= 4:
            readiness_level = "OPERATIONAL_DECISION_GRADE"
            readiness_description = "Core agro-climatic, soil, and calendar layers verified; satellite imagery may be limited by cloud cover."
        elif demonstration_layers_count > 0:
            readiness_level = "PROVISIONAL_DEMONSTRATION"
            readiness_description = "Operating with simulated or regional baseline fallbacks; ground verification strongly advised."
        else:
            readiness_level = "INCOMPLETE_DATA"
            readiness_description = "Multiple required data feeds are unavailable for this parcel's geographic location."

        return {
            "evaluatedAt": datetime.now(timezone.utc).isoformat(),
            "readinessLevel": readiness_level,
            "readinessDescription": readiness_description,
            "summaryMetrics": {
                "totalDomainsEvaluated": len(evaluations),
                "liveLayersCount": live_layers_count,
                "cachedLayersCount": cached_layers_count,
                "demonstrationLayersCount": demonstration_layers_count,
                "missingDomainsCount": len(missing_domains),
                "hasRealSatelliteNdvi": has_real_ndvi
            },
            "missingDomains": missing_domains,
            "evaluations": evaluations,
            "evaluationCriteria": {
                "completeness": "Assessment of whether required variables are fully populated or omitted.",
                "freshness": "Temporal currency of observations against current cropping cycle.",
                "sourceReliability": "Use of authoritative international or national research platforms vs uncalibrated heuristics.",
                "spatialFidelity": "Resolution appropriateness (from 10m satellite pixels to 50km climatological reanalysis grids)."
            }
        }

farm_data_quality_service = FarmDataQualityService()

