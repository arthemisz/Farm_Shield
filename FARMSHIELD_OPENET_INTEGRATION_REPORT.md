# FarmShield — OpenET Final Live Retrieval & Coverage Verification Report

**Audit Date & Time:** November 15, 2026 — 03:57 UTC  
**Component:** OpenET Data Provider Integration (`backend/services/openet_service.py`)  
**Product / Entity:** OpenET Satellite Evapotranspiration Ensemble (Desert Research Institute, NASA Ames Research Center, USGS, Environmental Defense Fund, Google)  
**Security Status:** Key reads strictly from backend environment `OPENET_API_KEY`; never logged, exposed to client bundles, or stored in version control.

---

## 1. BACKEND ENVIRONMENT CONFIGURATION & CREDENTIAL STATUS

1. **Credential Check:**
   - Evaluated `OPENET_API_KEY` in backend execution environment.
   - Result: `Has OPENET_API_KEY in os.environ: False` (No key currently set in local shell/container).
   - Secret Exposure Status: **ZERO EXPOSURE** (no keys hardcoded, logged, or serialized into client bundles).
2. **System Behavior with Missing Credentials:**
   - Evaluated control query for supported location (`Central Valley, California`: `36.7468°N, -119.7726°W`).
   - Returned Status: **`CONFIGURATION_REQUIRED`**
   - Provenance Status: **`UNAVAILABLE`**
   - Exact Response Payload:
     ```json
     {
       "coordinates": {
         "latitude": 36.7468,
         "longitude": -119.7726
       },
       "data": null,
       "error": "OpenET API key is not configured in backend environment (OPENET_API_KEY).",
       "provenanceStatus": "UNAVAILABLE",
       "provider": "OpenET Consortium",
       "status": "CONFIGURATION_REQUIRED",
       "success": false
     }
     ```
   - **Non-Mocking Rule Preserved:** When credentials are not configured, the service does **NOT** synthesize, simulate, or mock ET observations. It cleanly returns `CONFIGURATION_REQUIRED`.

---

## 2. OFFICIAL OPENET API REQUEST SPECIFICATION (WHEN KEY CONFIGURED)

When a valid user key is supplied via `OPENET_API_KEY`, the service issues the following documented HTTP request to the live OpenET production API:

- **Target URL:** `https://openet-api.org/raster/timeseries/point`
- **Method:** `POST`
- **Headers:**
  ```http
  Authorization: <OPENET_API_KEY>
  Content-Type: application/json
  Accept: application/json
  User-Agent: FarmShield-AgriIntelligence/1.0
  ```
- **Documented JSON Payload (California Control):**
  ```json
  {
    "date_range": ["2023-01-01", "2023-12-31"],
    "interval": "monthly",
    "geometry": [-119.7726, 36.7468],
    "model": "Ensemble",
    "variable": "ET",
    "reference_et": "gridMET",
    "units": "mm",
    "file_format": "JSON"
  }
  ```
- **Units & Spatial Resolution:**
  - Evapotranspiration: Depth in millimetres (`mm`)
  - Spatial Resolution: 30m Landsat thermal infrared + gridMET reference meteorological data
  - Ensemble Models: Weighted median of SIMS, SSEBop, DisALEXI, eeMETRIC, geeSEBAL, PT-JPL

---

## 3. LOCATION-BY-LOCATION AFRICAN COVERAGE VERIFICATION

All six African pilot locations were independently queried through the live backend endpoint (`/api/datasets/openet/point` and `/api/datasets/openet/farm/<farm_id>`):

| Target Location | Coordinates | OpenET Operational Coverage | Live Retrieval Status | Provenance Status | Documented Scientific Reason / Detail |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Bishoftu, Ethiopia** (`farm-1`) | `8.7523°N, 38.9841°E` | **NO** | `OUT_OF_COVERAGE` | `UNAVAILABLE` | Outside operational grid domain. OpenET operational API covers only CONUS. |
| **Arsi, Ethiopia** (`farm-2`) | `7.8500°N, 39.1000°E` | **NO** | `OUT_OF_COVERAGE` | `UNAVAILABLE` | Outside operational grid domain. African coordinates rejected pre-flight. |
| **Nairobi, Kenya** | `-1.2921°S, 36.8219°E` | **NO** | `OUT_OF_COVERAGE` | `UNAVAILABLE` | Outside operational grid domain. Pre-flight bounding box filter triggers. |
| **Ibadan, Nigeria** | `7.3775°N, 3.9470°E` | **NO** | `OUT_OF_COVERAGE` | `UNAVAILABLE` | Outside operational grid domain. |
| **Accra, Ghana** | `5.6037°N, -0.1870°W` | **NO** | `OUT_OF_COVERAGE` | `UNAVAILABLE` | Outside operational grid domain. |
| **Johannesburg, South Africa** | `-26.2041°S, 28.0473°E` | **NO** | `OUT_OF_COVERAGE` | `UNAVAILABLE` | Outside operational grid domain. |
| *Central Valley, California (Control)* | `36.7468°N, -119.7726°W` | **YES** | `CONFIGURATION_REQUIRED` | `UNAVAILABLE` | Within CONUS bounds (~24.5°N–49.5°N, ~-125.0°W–-66.5°W). Waiting for local key. |

### Scientific Non-Interference Guardrail:
- **Zero Impact on Crop Rotation Recommendations:** Verified that neither `explainable_recommendation_engine.py` nor `routes/rotation.py` references OpenET.
- Rotation calculations rely solely on verified African precipitation and thermal inputs (CHIRPS, NASA POWER, ISRIC SoilGrids).
- No synthetic or estimated ET values are fabricated for African farms.

---

## 4. FRONTEND CATALOGUE & DISPLAY VERIFICATION

1. **Environmental Catalogue Endpoint (`GET /api/datasets/availability?country=ET`):**
   ```json
   {
     "available": false,
     "coverage": "Conterminous US Only (CONUS) — UNAVAILABLE FOR AFRICA",
     "datasetId": "openet-evapotranspiration",
     "name": "OpenET Satellite Evapotranspiration",
     "note": "OpenET API operational coverage does not extend to Africa. FarmShield reports this limitation transparently without synthetic substitution.",
     "status": "UNAVAILABLE"
   }
   ```
2. **Client-side Fallback (`frontend/src/services/api.ts`):**
   Explicitly includes OpenET with status `UNAVAILABLE` alongside USDA Web Soil Survey (`UNAVAILABLE_FOR_AFRICA`).

---

## 5. TECHNICAL TEST SUITE RESULTS

1. **Backend Unit Test Suite:**
   - Command: `./venv/bin/python3 -m unittest discover tests`
   - Result: **148/148 tests passed** in 3.318s (`test_openet_service.py` passed all 7 unit test specifications).
2. **TypeScript Compilation:**
   - Command: `./node_modules/.bin/tsc --noEmit`
   - Result: **0 errors** (Exit code 0).
3. **Frontend Production Build:**
   - Command: `npm run build` (`tsc -b && vite build`)
   - Result: **Built successfully in 9.78s** (`dist/assets/index-ma3Lq1WS.js` 1,025.51 kB).
4. **Live Flask API Status:**
   - Endpoint: `GET http://127.0.0.1:5000/api/health` $\rightarrow$ `200 OK` (Healthy).

---

## CONCLUSION

The OpenET integration handles missing credentials safely (`CONFIGURATION_REQUIRED`), cleanly identifies African coordinates as `OUT_OF_COVERAGE` / `UNAVAILABLE`, strictly prohibits synthetic ET data fabrication, and ensures zero credential exposure across git and client bundles.
