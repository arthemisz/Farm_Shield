# FarmShield Phase 3.8 — Data Verification & Explainable Decision Engine Report

**Project:** FarmShield AI  
**Phase:** 3.8  
**Date:** 2026-11-14  
**Audit Scope:** Verification of the 6 data source feeds across 5 African nations, construction of the Farm Data Quality Service, and implementation of the Explainable Crop Recommendation & Rotation Engine.

---

## 1. Task 1 & 2: Five-Country Data Verification Audit

Live observational testing was conducted across 5 core African agricultural territories with representative farm coordinates:
- **Ethiopia (ET):** Bishoftu Agricultural Research Station (`8.75°N, 38.98°E`)
- **Kenya (KE):** Nakuru Rift Valley Maize/Legume Belt (`-0.30°S, 36.06°E`)
- **Nigeria (NG):** Ibadan IITA Research Agroecological Zone (`7.37°N, 3.94°E`)
- **Ghana (GH):** Kumasi CSIR-CRI Forest/Transition Agrozone (`6.69°N, -1.62°W`)
- **South Africa (ZA):** Potchefstroom ARC Highveld Cropping Basin (`-26.71°S, 27.10°E`)

### Country-by-Country Evidence Table

| Country | Dataset | Provider Contacted? | Metadata Found? | Actual Obs/Pixels Retrieved? | Observation Period / Date | Units | Provenance Status | Live or Cached? | Mocked or Simulated? |
|---|---|---|---|---|---|---|---|---|---|
| **Ethiopia** (`ET`) | **CHIRPS** | Yes (HTTP) | Yes | Yes (Bridge & Normal) | 2024 annual / monthly | mm/month | `CACHED` | Cached | No (calibrated normal) |
| | **NASA POWER** | Yes (REST) | Yes | Yes (point parameters) | 2024 (5-yr trend) | °C, mm, MJ/m² | `CACHED` | Cached | No |
| | **SoilGrids** | Yes (REST) | Yes | Yes (0-30cm layers) | Static baseline | pH, %, cmol/kg | `CACHED` | Cached | No |
| | **Sentinel-2** | Yes (STAC) | Yes | Partial (token signed) | 2024-12-28 | Surface reflectance | `PARTIAL` | Live query | No (`currentNdvi: null`) |
| | **FAOSTAT** | Yes (REST) | Yes | Yes (National totals) | 2022 | Tonnes, ha, kg/ha | `CACHED` | Cached | No |
| | **Crop Calendar**| Yes (Local) | Yes | Yes (EIAR Package) | Seasonal (Meher/Belg) | Planting/Harvest window | `LIVE` | Live index | No |
| **Kenya** (`KE`) | **CHIRPS** | Yes (HTTP) | Yes | Yes (Daily/Monthly) | 2024 annual | mm/month | `LIVE` | Live query | No |
| | **NASA POWER** | Yes (REST) | Yes | Yes (T2M, PRECTOT) | 2024 (5-yr trend) | °C, mm, MJ/m² | `LIVE` | Live query | No |
| | **SoilGrids** | Yes (REST) | Yes | Yes (pH, SOC, texture)| Static baseline | pH, %, cmol/kg | `LIVE` | Live query | No |
| | **Sentinel-2** | Yes (STAC) | Yes | Yes (COG tile streamed) | 2024-12-15 | Reflectance (B04/B08) | `LIVE` | Live query | No (actual pixels) |
| | **FAOSTAT** | Yes (REST) | Yes | Yes (National totals) | 2022 | Tonnes, ha, kg/ha | `CACHED` | Cached fallback | No |
| | **Crop Calendar**| Yes (Local) | Yes | Yes (KALRO Package) | Seasonal (Long/Short) | Planting/Harvest window | `LIVE` | Live index | No |
| **Nigeria** (`NG`) | **CHIRPS** | Yes (HTTP) | Yes | Yes | 2024 annual | mm/month | `LIVE` | Live query | No |
| | **NASA POWER** | Yes (REST) | Yes | Yes | 2024 | °C, mm, MJ/m² | `CACHED` | Cached | No |
| | **SoilGrids** | Yes (REST) | Yes | Yes | Static baseline | pH, %, cmol/kg | `CACHED` | Cached | No |
| | **Sentinel-2** | Yes (STAC) | Yes | Unavailable (cloud > 25%)| 2024 search window | N/A | `UNAVAILABLE`| Live query | No (`currentNdvi: null`) |
| | **FAOSTAT** | Yes (REST) | Yes | Yes (IITA context) | 2022 | Tonnes, ha, kg/ha | `CACHED` | Cached fallback | No |
| | **Crop Calendar**| Yes (Local) | Yes | Yes (IITA Package) | Seasonal (Savanna) | Planting/Harvest window | `LIVE` | Live index | No |
| **Ghana** (`GH`) | **CHIRPS** | Yes (HTTP) | Yes | Yes | 2024 annual | mm/month | `LIVE` | Live query | No |
| | **NASA POWER** | Yes (REST) | Yes | Yes | 2024 | °C, mm, MJ/m² | `LIVE` | Live query | No |
| | **SoilGrids** | Yes (REST) | Yes | Yes | Static baseline | pH, %, cmol/kg | `LIVE` | Live query | No |
| | **Sentinel-2** | Yes (STAC) | Yes | Demo fallback | 2024 search window | N/A | `DEMONSTRATION`| Live query | Explicitly labeled DEMO |
| | **FAOSTAT** | Yes (REST) | Yes | Yes (Cocoa/Yam) | 2022 | Tonnes, ha, kg/ha | `CACHED` | Cached fallback | No |
| | **Crop Calendar**| Yes (Local) | Yes | Yes (CSIR-CRI) | Seasonal (Major/Minor) | Planting/Harvest window | `LIVE` | Live index | No |
| **South Africa** (`ZA`) | **CHIRPS** | Yes (HTTP) | Yes | Yes | 2024 annual | mm/month | `LIVE` | Live query | No |
| | **NASA POWER** | Yes (REST) | Yes | Yes | 2024 | °C, mm, MJ/m² | `LIVE` | Live query | No |
| | **SoilGrids** | Yes (REST) | Yes | Yes | Static baseline | pH, %, cmol/kg | `LIVE` | Live query | No |
| | **Sentinel-2** | Yes (STAC) | Yes | Yes (Clear Highveld scene)| 2024-11-20 | Reflectance (B04/B08) | `LIVE` | Live query | No (actual pixels) |
| | **FAOSTAT** | Yes (REST) | Yes | Yes (Maize/Soybean) | 2022 | Tonnes, ha, kg/ha | `CACHED` | Cached fallback | No |
| | **Crop Calendar**| Yes (Local) | Yes | Yes (ARC Package) | Summer/Winter rain | Planting/Harvest window | `LIVE` | Live index | No |

---

## 2. Task 3: Farm Data Quality Service (`FarmDataQualityService`)

Constructed in `backend/services/farm_data_quality_service.py` to evaluate farm data integrity across 6 core criteria without fabricating arbitrary accuracy percentages:
- **Completeness:** Assesses whether required agro-climatic, soil, satellite, and calendar variables are populated.
- **Freshness:** Evaluates temporal alignment against the active cropping cycle.
- **Source Reliability:** Authoritative scientific platforms vs. uncalibrated heuristics.
- **Spatial Resolution:** Tracks sensor granularity (from 10m Sentinel-2 pixels to 50km NASA reanalysis grids).
- **Readiness Classification:** Outputs transparent qualitative classifications:
  - `HIGH_FIDELITY_OBSERVATIONAL`: All 6 feeds active with live Sentinel-2 NDVI pixel decoding.
  - `OPERATIONAL_DECISION_GRADE`: Core meteorology, rainfall, soil, and calendar active; satellite restricted by clouds.
  - `PROVISIONAL_DEMONSTRATION`: Operating on regional baseline fallbacks.
  - `INCOMPLETE_DATA`: Critical observational layers offline for the coordinate.

---

## 3. Task 4 & 5: Explainable Crop Recommendation & Rotation Engine

Implemented in `backend/services/explainable_recommendation_engine.py`:
- **Multi-Factor Agronomic Scoring:**
  1. *Thermal Window Match (25%):* Compares NASA POWER `T2M` against crop optimal, minimum, and maximum thermal thresholds.
  2. *Moisture Sufficiency (25%):* Compares annual CHIRPS rainfall and WMO SPI-3 against crop water requirements (`waterRequirementsMm`). Accounts for irrigation availability.
  3. *Soil Compatibility (20%):* Validates SoilGrids pH and texture against tolerance ranges.
  4. *National Extension Adaptation (20%):* Restricts high-confidence scores to verified national research packages.
  5. *Rotational Synergy (10%):* Rewards biological nitrogen fixation (legumes) and penalizes botanical family repetition.
- **Explainable Output Contract:** Every recommendation returns:
  - Ranked crop candidate with `overallScore` and `confidenceLevel` (`HIGH`, `MEDIUM`, `LOW`).
  - Specific `supportingObservations` referencing sensor values.
  - Transparent `identifiedRisks` highlighting deficits or pH divergence.
  - Verified `suggestedPlantingWindow` linked to the national research institution.
  - List of missing data inputs.

---

## 4. Verification Suite Results

- **Backend Unit Tests:** **82 passed, 0 failures, 0 errors** (`Ran 82 tests in 1.081s — OK`).
- **Frontend Production Build:** **Clean build** via Vite (`✓ built in 7.56s`, 2212 modules transformed, 0 TypeScript errors).
- **Endpoint Upgrades:**
  - `GET /api/farms/<id>/recommendations`: Serves explainable crop suitability rankings.
  - `GET /api/farms/<id>/data-quality`: Serves transparent multi-domain data readiness audits.
  - `POST /api/rotation/recommend`: Serves rotation sequence assessments.

