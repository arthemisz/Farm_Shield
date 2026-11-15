# GEDI DATA AUTHENTICITY AUDIT
## FarmShield Scientific Integrity Assessment

**Audit Date:** 2026-11-14  
**Evaluator:** Antigravity Autonomous Scientific Verification Engine  
**Subject:** 12 NASA GEDI Database Records in `farmshield.db`

---

## 1. Executive Scientific Verdict

> **CRITICAL SCIENTIFIC VERDICT**:  
> **None of the 12 stored GEDI records represent direct satellite downlinks or processed Level-4 HDF5 granule retrievals from NASA/ORNL DAAC.**  
> All 12 records are classified as **`LITERATURE_REFERENCE` / `DEMONSTRATION`**.  
> They originate from regional agroforestry and cropland literature values (calibrated from published Ethiopian Highland studies: Mbow et al. 2014, Asrat et al. 2020, Spracklen et al. 2021) seeded directly into the database.  
> **Calling these records "genuine satellite observations" or "live NASA GEDI data" is scientifically inaccurate.**  
> The backend API and frontend UI have been updated to explicitly label all such records as **LITERATURE_REFERENCE** and state **NO_MATCHING_OBSERVATION** for genuine spatial satellite footprint matching.

---

## 2. Complete 12-Record Authenticity Inventory

| Database ID | Farm ID | Dataset ID | Product Version | Variable | Value & Unit | Uncertainty (SE) | Quality Flag | Stored Lat / Lon | Acquisition Date | Ingestion Date | Authenticity Classification | Original Data Origin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `obs-3ae31814fbe3` | `farm-1` | `nasa-gedi-l4a` | v2.1 | `agbd` | 45.2 Mg/ha | ±8.3 Mg/ha | `l4_quality_flag=1` | 8.7523, 38.9841 | 2022-08 | 2026-11-14 | **LITERATURE_REFERENCE** | Seeded from literature baseline; no granule file |
| `obs-4db2586caa87` | `farm-1` | `nasa-gedi-l4a` | v2.1 | `agbd_se` | 8.3 Mg/ha | — | `l4_quality_flag=1` | 8.7523, 38.9841 | 2022-08 | 2026-11-14 | **LITERATURE_REFERENCE** | Seeded from literature baseline; no granule file |
| `obs-ebdefdc4ae5d` | `farm-1` | `nasa-gedi-l4b` | v2.1 | `MU` | 52.8 Mg/ha | — | `VALID` | 8.7523, 38.9841 | 2023-01 | 2026-11-14 | **LITERATURE_REFERENCE** | Seeded from literature baseline; no COG GeoTIFF |
| `obs-3b991ccf7977` | `farm-2` | `nasa-gedi-l4a` | v2.1 | `agbd` | 45.2 Mg/ha | ±8.3 Mg/ha | `l4_quality_flag=1` | 7.8732, 39.1412 | 2022-08 | 2026-11-14 | **LITERATURE_REFERENCE** | Seeded from literature baseline; no granule file |
| `obs-06bb6cdea7ac` | `farm-2` | `nasa-gedi-l4a` | v2.1 | `agbd_se` | 8.3 Mg/ha | — | `l4_quality_flag=1` | 7.8732, 39.1412 | 2022-08 | 2026-11-14 | **LITERATURE_REFERENCE** | Seeded from literature baseline; no granule file |
| `obs-974ad5168e9b` | `farm-2` | `nasa-gedi-l4b` | v2.1 | `MU` | 52.8 Mg/ha | — | `VALID` | 7.8732, 39.1412 | 2023-01 | 2026-11-14 | **LITERATURE_REFERENCE** | Seeded from literature baseline; no COG GeoTIFF |
| `obs-196e278d7503` | `farm-3` | `nasa-gedi-l4a` | v2.1 | `agbd` | 45.2 Mg/ha | ±8.3 Mg/ha | `l4_quality_flag=1` | 8.5411, 39.2689 | 2022-08 | 2026-11-14 | **LITERATURE_REFERENCE** | Seeded from literature baseline; no granule file |
| `obs-19341ff4b188` | `farm-3` | `nasa-gedi-l4a` | v2.1 | `agbd_se` | 8.3 Mg/ha | — | `l4_quality_flag=1` | 8.5411, 39.2689 | 2022-08 | 2026-11-14 | **LITERATURE_REFERENCE** | Seeded from literature baseline; no granule file |
| `obs-1b4dc860a110` | `farm-3` | `nasa-gedi-l4b` | v2.1 | `MU` | 52.8 Mg/ha | — | `VALID` | 8.5411, 39.2689 | 2023-01 | 2026-11-14 | **LITERATURE_REFERENCE** | Seeded from literature baseline; no COG GeoTIFF |
| `obs-7e7233502a36` | `farm-test-et` | `nasa-gedi-l4a` | v2.1 | `agbd` | 45.2 Mg/ha | ±8.3 Mg/ha | `l4_quality_flag=1` | 8.7500, 38.9800 | 2022-08 | 2026-11-14 | **LITERATURE_REFERENCE** | Seeded from literature baseline; no granule file |
| `obs-ba68c189be90` | `farm-test-et` | `nasa-gedi-l4a` | v2.1 | `agbd_se` | 8.3 Mg/ha | — | `l4_quality_flag=1` | 8.7500, 38.9800 | 2022-08 | 2026-11-14 | **LITERATURE_REFERENCE** | Seeded from literature baseline; no granule file |
| `obs-3e0c846c9d6a` | `farm-test-et` | `nasa-gedi-l4b` | v2.1 | `MU` | 52.8 Mg/ha | — | `VALID` | 8.7500, 38.9800 | 2023-01 | 2026-11-14 | **LITERATURE_REFERENCE** | Seeded from literature baseline; no COG GeoTIFF |

---

## 3. Spatial Matching & Orbital Geometry Audit

### 3.1 Spatial Reality
- The stored observations possess coordinates identical to the farm coordinates because they were synthetically assigned during data seeding.
- **Genuine GEDI L4A footprints** are circular swaths of approximately 25 m diameter distributed along 8 ground tracks with ~60 m along-track pulse spacing and ~600 m cross-track beam spacing.
- Because no actual GEDI HDF5 file (e.g., `GEDI02_A_2022..._02_002_01.h5`) was parsed to locate true laser shot coordinates within farm boundaries, **there is currently no verified satellite footprint intersection**.
- **Corrected Status**: The API route now reports:
  ```json
  "hasGenuineSpatialMatch": false,
  "geographicMatchStatus": "ORBITAL_COVERAGE_ONLY_NO_GENUINE_FOOTPRINT_MATCH"
  ```
  Orbital coverage (latitude between 51.6°S and 51.6°N) confirms the ISS flies over the region, but does **not** prove an actual laser pulse intersected the specific farm polygon.

### 3.2 L4B Grid Specification
- GEDI L4B is a global 1 km × 1 km gridded mean biomass density product (`MU`) derived from quality-filtered L4A footprints over the 2019–2023 baseline period.
- While 1 km grid cells do cover the Ethiopian highlands, the stored 52.8 Mg/ha value is an agronomic regional literature average, not an extracted GeoTIFF pixel value.

---

## 4. API & UI Integrity Corrections

1. **Endpoint `GET /api/datasets/gedi/farm/<farm_id>`**:
   - `provenance`: Set to `"LITERATURE_REFERENCE"`.
   - `isGenuineSatelliteObservation`: Set to `false`.
   - `hasGenuineSpatialMatch`: Set to `false`.
   - `geographicMatchStatus`: Set to `"ORBITAL_COVERAGE_ONLY_NO_GENUINE_FOOTPRINT_MATCH"`.
2. **Frontend `<GEDIBiomassPanel>`**:
   - Badge prominently displays **LITERATURE REFERENCE** (amber badge).
   - Description explicitly states: *"Regional literature-calibrated baseline reference. Not an original direct NASA GEDI satellite granule retrieval."*
   - Spatial Match indicator states: *"NO MATCHING GRANULE (ORBITAL RANGE ONLY)"*.

---

## 5. Summary & Recommendations

- **Do not delete the 12 records**: They serve as valid, scientifically grounded regional agronomic reference points for biomass density in the Ethiopian Highlands.
- **Strict truth in reporting**: By honestly declaring them as `LITERATURE_REFERENCE`, FarmShield protects its scientific credibility for demonstrations and presentations without fabricating satellite telemetry.

