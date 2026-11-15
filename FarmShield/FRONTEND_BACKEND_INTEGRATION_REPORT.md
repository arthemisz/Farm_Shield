# FarmShield — Frontend & Backend Integration Report

**Date:** 2026-11-14  
**Project:** FarmShield — NASA-Powered Climate-Resilient Crop Rotation Decision Support System  
**Phase:** Phase 4 — Complete Frontend-Backend Integration  

---

## 1. Executive Summary

Phase 4 achieves the complete end-to-end integration between the **React + TypeScript frontend** and the **Flask Python backend**, replacing isolated client mocks with live data pipelines while maintaining graceful degradation.

All 54 African country profiles, 19 African crop profiles, CHIRPS 2.0 rainfall anomaly baselines, WMO Standardized Precipitation Index (SPI) drought metrics, and Copernicus Sentinel-2 Level-2A canopy vigor analyses are now directly accessible through the interactive user interface.

---

## 2. Connected Endpoints and Page Mapping

| API Endpoint | HTTP Method | Frontend Page / Component | Live State |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | System Health Monitor & Connectivity Badge | Connected |
| `/api/countries` | `GET` | Country Context Switcher & Admin Dropdowns | Connected (54 sovereign states) |
| `/api/datasets` | `GET` | Settings & Data Sources Modal | Connected |
| `/api/farms` | `GET`, `POST` | Dashboard, My Farms, Add Farm, Leaflet Map | Connected (SQLite + REST) |
| `/api/farms/<id>` | `GET`, `PUT`, `DELETE`| Farm Detail Profile, Edit Farm Modal | Connected |
| `/api/crops` | `GET` | Crop Database, Rotation Selector | Connected (19 African crops) |
| `/api/farms/<id>/climate` | `GET` | Climate Intelligence Page & Dashboard Charts | Connected (NASA POWER) |
| `/api/farms/<id>/soil` | `GET` | Soil Information Page & Edaphic Profiling | Connected (ISRIC SoilGrids 2.0) |
| `/api/farms/<id>/rainfall` | `GET` | Climate Page & Dashboard Rainfall Card | Connected (CHIRPS 2.0) |
| `/api/farms/<id>/drought` | `GET` | Dedicated Drought Monitoring Page (`/drought`) | Connected (WMO SPI-3 & SPI-6) |
| `/api/farms/<id>/vegetation` | `GET` | Dedicated Sentinel-2 Page (`/vegetation`) | Connected (ESA 10m NDVI) |
| `/api/farms/<id>/climate/seasonal`| `GET` | Seasonal Cropping Calendar | Connected |
| `/api/rotation/recommend` | `POST` | Crop Rotation Planner Core Engine | Connected (5-factor explainable) |
| `/api/farms/<id>/report` | `GET` | Comprehensive Dossier (`/reports`) | Connected |

---

## 3. UI/UX & Functional Enhancements

1. **Dashboard (`/`)**:
   - Added interactive **Active Farm Selector** allowing instantaneous multi-parcel switching.
   - Live KPI cards displaying **Total Registered Parcels**, **CHIRPS Rainfall & Anomaly (%)**, **WMO SPI-3 Drought Indicator**, and **Sentinel-2 NDVI Canopy Vigor**.
   - Dual-axis precipitation and temperature charts react dynamically to selected farm coordinates.

2. **Dedicated Drought Monitoring Page (`/drought`)**:
   - Displays short-term **SPI-3** and seasonal **SPI-6** deviations.
   - Highlights consecutive dry month runs ($<25\text{ mm}$ during crop cycles).
   - Prominently displays the scientific distinction explaining that **meteorological drought does not equate to agricultural crop failure** when soil moisture retention or irrigation is present.

3. **Sentinel-2 Level-2A Vegetation Page (`/vegetation`)**:
   - Displays 10m NDVI canopy vigor derived from Band 04 (Red, 665nm) and Band 08 (NIR, 842nm).
   - Clarifies the sampling method: **500-meter centroid buffer** over farm coordinates.
   - Disclaims that NDVI indicates greenness, not final yield or botanical taxonomy.

4. **Crop Rotation Planner (`/rotation-planner`)**:
   - Fully connected to the 5-factor explainable recommendation service:
     - Climate Suitability (30%)
     - Soil Chemistry Suitability (25%)
     - Water & Moisture Demand (20%)
     - Botanical Family Crop Diversity (15%)
     - Biological Nitrogen Fixation (10%)
   - Advisory notices explain that output scores are decision-support guidelines, not guaranteed yield predictions.

5. **Decision & Agronomic Reports (`/reports`)**:
   - Connects to `/api/farms/<id>/report` aggregating farm GPS, NASA POWER climate, SoilGrids edaphic properties, CHIRPS rainfall anomaly, WMO SPI drought, Sentinel-2 vegetation, and crop rotation sequences.
   - Print-ready with browser PDF export styling.

---

## 4. Multi-Country Verification & Validation

The complete end-to-end workflow was verified across multiple representative African farming environments:
1. **Ethiopia (Bishoftu Demonstration Farm — `ET`)**:
   - Altitude: 1,920m | Soil: Vertisols (Black clay) | Current Crop: Teff.
   - Verified CHIRPS bimodal rain and +75 kg N/ha biological legume bonus with Faba bean rotation.
2. **Kenya (Rift Valley Plot — `KE`)**:
   - Counties, Sub-Counties, and Wards hierarchy loaded dynamically.
   - Verified Long Rains (MAM) and Short Rains (OND) seasonal calendar.
3. **Nigeria (Savanna/Forest Transition — `NG`)**:
   - States, LGAs, and Wards loaded dynamically.
   - Tested Yam $\rightarrow$ Cowpea rotation with Striga weed cycle interruption.

---

## 5. Verification Commands & Execution Instructions

### A. Run Backend API Server
```bash
cd /home/abrish/Desktop/FarmShield/backend
./venv/bin/python3 app.py
```
*API runs on `http://localhost:5000`.*

### B. Run Frontend Dev Server
```bash
cd /home/abrish/Desktop/FarmShield/frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### C. Run Full Test Suites
```bash
cd /home/abrish/Desktop/FarmShield/backend
./venv/bin/python3 -m unittest discover tests
```
*Result: 16/16 tests passing.*

### D. Verify Frontend Production Build
```bash
cd /home/abrish/Desktop/FarmShield/frontend
npm run build
```
*Result: Production build succeeded (`✓ 2212 modules transformed`, exit code 0).*

