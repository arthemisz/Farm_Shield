# FarmShield African Climate & Agricultural Intelligence Report

**Project:** FarmShield — NASA-Powered Climate-Resilient Crop Rotation Decision Support System  
**Phase:** Phase 3 — African Climate and Agricultural Intelligence Layer  
**Date:** 2026-11-14  

---

## 1. Executive Summary

Phase 3 establishes FarmShield's operational African agricultural intelligence engine. It introduces:
1. **CHIRPS 2.0 Integration**: Historical, daily, monthly, and seasonal rainfall monitoring benchmarking against the 30-year 1981–2010 climatological baseline.
2. **Transparent Drought Monitoring**: WMO Standardized Precipitation Index (SPI-3 & SPI-6) calculation, consecutive dry period tracking, and rigorous scientific separation of meteorological vs. agricultural drought.
3. **Copernicus Sentinel-2 Vegetation Monitoring**: Real STAC search across Microsoft Planetary Computer, cloud-cover filtering (<25%), red/NIR asset discovery, 500m centroid buffer sampling, and NDVI evaluation.
4. **Dedicated Intelligence Endpoints**: REST APIs for farm-level rainfall, drought, vegetation, and seasonal calendars.

---

## 2. Integrated Datasets & Technical Specifications

| Parameter | Dataset / Provider | Spatial Resolution | Temporal Coverage | Operational Status |
| :--- | :--- | :--- | :--- | :--- |
| **Rainfall & Anomalies** | CHIRPS 2.0 (Climate Hazards Center, UC Santa Barbara) | 0.05° (~5.3 km) | 1981 – Present (Daily / Monthly) | **LIVE** / **CACHED** with transparent baseline |
| **Temperature & Insolation** | NASA POWER Agroclimatology | 0.5° × 0.5° (~50 km) | 1981 – Present | **LIVE** / **CACHED** |
| **Drought Indicators** | WMO-1095 SPI (Standardized Precipitation Index) | 0.05° (CHIRPS grid) | 3-Month & 6-Month rolling windows | **LIVE** |
| **Vegetation & Canopy** | Copernicus Sentinel-2 Level-2A (ESA / Microsoft PC) | 10m (B04 Red, B08 NIR) | 2015 – Present (5-day revisit) | **LIVE** (STAC metadata & spectral assets) |
| **Land Cover Baseline** | ESA WorldCover 10m | 10m | 2020 – 2021 global baseline | **LIVE** |
| **Edaphic Properties** | ISRIC SoilGrids 2.0 | 250m | Depth slices: 0-5, 5-15, 15-30cm | **LIVE** |

---

## 3. Dedicated Agricultural Intelligence API Endpoints

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/farms/<id>/rainfall` | `?year=2024` | Complete monthly observed rainfall, 1981-2010 baseline normals, mm anomalies, and percentage variations. |
| `GET` | `/api/farms/<id>/drought` | `?year=2024` | Meteorological drought (SPI-3, SPI-6 under WMO-No. 1095) + Agricultural drought risk evaluation. |
| `GET` | `/api/farms/<id>/vegetation` | — | Sentinel-2 multispectral NDVI analysis, centroid buffer aggregation, cloud cover %, and scene metadata. |
| `GET` | `/api/farms/<id>/climate/seasonal`| `?year=2024` | Tailored African seasonal calendars (e.g. MAM/OND in East Africa, JJAS in West Africa, DJF in Southern Africa). |

All endpoint payloads return the standard FarmShield envelope:
```json
{
  "success": true,
  "farmId": "farm-1",
  "farmName": "Bishoftu Demonstration Farm",
  "data": { ... },
  "isDemoData": false
}
```

---

## 4. Drought Calculation Methodology & Scientific Integrity

### A. Meteorological Drought (SPI)
- **Standard**: Follows the World Meteorological Organization (WMO-No. 1095, 2012) *Standardized Precipitation Index User Guide*.
- **Formula**:
  $$\text{SPI} = \frac{P_{\text{observed}} - P_{\text{baseline}}}{\sigma}$$
  Where $P_{\text{baseline}}$ is the 30-year normal precipitation for the selected aggregation window (3-month or 6-month) derived from CHIRPS 2.0 climatology.
- **WMO Classifications**:
  - $\text{SPI} \ge +2.00$: Extremely Wet
  - $+1.50 \text{ to } +1.99$: Very Wet
  - $+1.00 \text{ to } +1.49$: Moderately Wet
  - $-0.99 \text{ to } +0.99$: Near Normal
  - $-1.00 \text{ to } -1.49$: Moderately Dry (Mild Drought)
  - $-1.50 \text{ to } -1.99$: Severely Dry (Severe Drought)
  - $\text{SPI} \le -2.00$: Extremely Dry (Extreme Drought)

### B. Distinction from Agricultural Drought
FarmShield explicitly distinguishes atmospheric water deficits from agronomic moisture stress:
1. **Meteorological Drought**: Quantifies precipitation deviation in the atmosphere.
2. **Agricultural Drought**: Assesses whether root-zone soil water satisfies specific crop evapotranspiration needs at critical phenological stages (e.g., silking in maize or flowering in faba bean).
3. **Caveat Output**: Soil texture (clay fraction vs. sand), residual moisture, and irrigation access can decouple agronomic performance from negative SPI periods.

---

## 5. Copernicus Sentinel-2 Level-2A Workflow

1. **STAC Discovery**:
   - Queries `https://planetarycomputer.microsoft.com/api/stac/v1/search`.
   - Collection: `sentinel-2-l2a`.
   - Spatial query: Point intersection buffered to farm coordinates.
   - Temporal window: Rolling 90 days.
   - Cloud threshold: `eo:cloud_cover < 25.0%`.
2. **Spectral Asset Resolution**:
   - Red Band: `B04` ($665\text{ nm}$, 10m).
   - Near-Infrared Band: `B08` ($842\text{ nm}$, 10m).
   - Visual Composite: `visual` (True color 10m RGB).
3. **NDVI Computation & Constraints**:
   $$\text{NDVI} = \frac{\text{B08} - \text{B04}}{\text{B08} + \text{B04}}$$
   - **Disclaimer**: FarmShield never claims NDVI identifies crop taxonomy or guarantees financial yield; it measures photosynthetic canopy greenness and vegetative vigor.

---

## 6. Multi-Country Verification & Real Testing Results

Six representative regional agricultural environments were tested across Africa:
1. **Ethiopia (East African Highlands, Vertisols)**: $\text{Lat } 8.75, \text{Lon } 38.98$
2. **Kenya (Rift Valley / Bimodal Rainfed)**: $\text{Lat } 0.02, \text{Lon } 37.90$
3. **Nigeria (Guinea Savanna / Forest Transition)**: $\text{Lat } 9.08, \text{Lon } 8.67$
4. **Ghana (Coastal Rainforest / Cocoa Belt)**: $\text{Lat } 7.94, \text{Lon } -1.02$
5. **Senegal (Sahelian Sandy Groundnut Basin)**: $\text{Lat } 14.49, \text{Lon } -14.45$
6. **South Africa (Summer Highveld / Winter Western Cape)**: $\text{Lat } -30.55, \text{Lon } 22.93$

### Automated Test Suite Results
- Total tests executed: **16 test cases** across `test_api.py`, `test_international.py`, `test_african_expansion.py`, and `test_african_intelligence.py`.
- Result: **100% Passed (Exit Code 0)**.

---

## 7. Data Provenance & Honesty Protocol

Every API response provides complete metadata identifying data origin:
- `LIVE`: Directly retrieved from active satellite or API telemetry.
- `CACHED`: Fresh cached record within valid TTL window.
- `PARTIAL`: Incomplete satellite revisit or interpolated day count.
- `DEMONSTRATION`: Calibrated baseline fallback during external network disconnection.
- `UNAVAILABLE`: Service offline or coordinates outside coverage boundary.

