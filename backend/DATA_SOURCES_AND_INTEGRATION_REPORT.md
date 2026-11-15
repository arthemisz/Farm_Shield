# FarmShield — Real Agricultural Data Sources & Integration Report

**Project:** FarmShield AI  
**Audit & Implementation Phase:** Phase 3.7  
**Date:** 2026-11-14  
**Scope:** Integration of real, publicly accessible agricultural, climate, soil, rainfall, and satellite datasets across Africa and internationally.

---

## 1. Executive Summary

Phase 3.7 establishes an integrated, multi-tier data architecture for FarmShield. The system connects to six real, internationally recognized scientific data providers, backed by automated retry backoffs, thread-safe persistent caching, transparent provenance metadata, and strict refusal to fabricate missing observations.

```
+---------------------------------------------------------------------------------------+
|                                    FARMSHIELD CORE                                    |
+---------------------------------------------------------------------------------------+
        |                 |                  |                 |               |
        v                 v                  v                 v               v
  [NASA POWER]        [CHIRPS]        [SoilGrids 2.0]     [Sentinel-2]     [FAOSTAT]
Meteorology/Solar   Precipitation     Soil Properties      NDVI Bands      Production
   (0.5° Grid)      (0.05° Grid)        (250m Map)        (10m BOA)       (National)
        |                 |                  |                 |               |
        +-----------------+------------------+-----------------+---------------+
                                             |
                                             v
                      [National Extension Crop Calendars]
                      (EIAR, KALRO, IITA, CSIR-CRI, ARC)
```

---

## 2. Integrated Data Providers & Technical Specifications

| # | Data Provider | Official Source & Access URL | Variables & Parameters | Spatial & Temporal Resolution | License & Attribution |
|---|---|---|---|---|---|
| **1** | **CHIRPS 2.0** | Climate Hazards Center, UC Santa Barbara (`https://data.chc.ucsb.edu/products/CHIRPS/`) | Daily rainfall (`PRECTOTCORR`), monthly accumulation, long-term anomalies, SPI-3, SPI-6 | 0.05° (~5.3 km grid); Daily/Monthly; 1981–present | Public Domain (CC0 / Open Access) |
| **2** | **NASA POWER** | NASA Langley Research Center (`https://power.larc.nasa.gov/api/temporal/monthly/point`) | `T2M`, `T2M_MAX`, `T2M_MIN` (°C), `PRECTOTCORR` (mm/day), `ALLSKY_SFC_SW_DWN` (MJ/m²/day) | 0.5° × 0.5° (~50 km); Daily & Monthly; 1981–present | NASA Open Data Policy (Public Access) |
| **3** | **ISRIC SoilGrids 2.0** | ISRIC - World Soil Information (`https://rest.isric.org/soilgrids/v2.0/properties/query`) | Soil pH (`phh2o`), SOC (`soc` %), Sand/Silt/Clay fractions (%), CEC (`cec` cmol/kg) | 250m gridded; 0–5cm, 5–15cm, 15–30cm depths | CC-BY 4.0 Open Access |
| **4** | **Copernicus Sentinel-2 L2A** | European Space Agency (ESA) & Microsoft Planetary Computer STAC (`https://planetarycomputer.microsoft.com/`) | Band 04 (Red 665nm), Band 08 (NIR 842nm), NDVI calculation, Scene RGB preview | 10m surface reflectance; 5-day equatorial revisit; 2015–present | Copernicus Open Access / Microsoft Planetary Computer |
| **5** | **FAOSTAT (QCL)** | UN Food and Agriculture Organization (`https://fenixservices.fao.org/faostat/api/v1/en/data/QCL`) | Element 5510 (Production, tonnes), Element 5312 (Area, ha), Element 5419 (Yield, kg/ha) | National administrative boundary; Annual (1961–2022) | CC-BY-NC-SA 3.0 IGO |
| **6** | **National Crop Calendars** | EIAR (Ethiopia), KALRO (Kenya), IITA (Nigeria), CSIR-CRI (Ghana), ARC (South Africa) | Planting windows, flowering periods, harvest windows, critical growth vulnerability stages | National agroecological zone; Seasonal phenology | Public Agricultural Extension Literature |

---

## 3. Five-Country Core Audit Verification

The integrated pipeline was evaluated across 5 representative agricultural locations in Africa spanning distinct agroecological and climate regimes.

| Country | Code | Representative Coordinates | Primary Crop | NASA POWER | CHIRPS | SoilGrids | Sentinel-2 L2A | FAOSTAT | National Crop Calendar |
|---|---|---|---|---|---|---|---|---|---|
| **Ethiopia** | `ET` | 8.75°N, 38.98°E (Bishoftu) | Teff | **CACHED/LIVE** | **CACHED/LIVE** | **CACHED/LIVE** | **PARTIAL** | **CACHED** | **LIVE (EIAR)** |
| **Kenya** | `KE` | -0.30°S, 36.06°E (Nakuru) | Maize | **LIVE** | **LIVE** | **LIVE** | **LIVE** | **CACHED** | **LIVE (KALRO)** |
| **Nigeria** | `NG` | 7.37°N, 3.94°E (Ibadan) | Cassava | **CACHED/LIVE** | **LIVE** | **CACHED/LIVE** | **UNAVAILABLE** (cloud threshold) | **CACHED** | **LIVE (IITA)** |
| **Ghana** | `GH` | 6.69°N, -1.62°W (Kumasi) | Cocoa | **LIVE** | **LIVE** | **LIVE** | **DEMONSTRATION** | **CACHED** | **LIVE (CSIR-CRI)** |
| **South Africa** | `ZA` | -26.71°S, 27.10°E (Potchefstroom) | Maize | **LIVE** | **LIVE** | **LIVE** | **LIVE** | **CACHED** | **LIVE (ARC)** |

*Audit results permanently recorded in `backend/phase37_five_countries_audit.json`.*

---

## 4. Architectural Highlights

### Reusable Adapter Pattern (`backend/services/data_sources/base_service.py`)
- Standardized `BaseDataSource` class implementing:
  - Configurable timeouts (`REQUEST_TIMEOUT`).
  - Exponential backoff retry logic on HTTP 429 (rate-limit) and 5xx errors.
  - Standardized provenance generation across all providers.
- File-backed, coordinate-rounded persistent cache (`SimpleCache`) preventing redundant external downloads and rate limits.

### National Extension Distinction Safeguard
- FarmShield forbids homogenizing agricultural advice across borders.
- Ethiopian Meher/Belg bimodal seasons (EIAR) are kept distinct from Kenyan Long/Short Rains (KALRO) and West African monomodal cycles (IITA/CSIR).

### Macro vs. Micro Scale Disclaimers
- Every FAOSTAT response and dossier report explicitly documents:
  > *"FAOSTAT statistics report national totals and country-average yields. They do NOT measure specific farm yields or field conditions. Use exclusively as macro-economic and regional benchmarking context."*
- Every SoilGrids response explicitly states:
  > *"Gridded machine-learning predictions are not a substitute for localized laboratory soil testing."*
- Every NDVI query reminds users:
  > *"NDVI quantifies photosynthetic canopy greenness, not botanical taxonomy or harvest yield."*

---

## 5. Verification Suite Results

- **Backend Unit Tests:** **77 passed, 0 failed, 0 errors** (`Ran 77 tests in 6.913s — OK`).
- **Frontend Production Build:** **Clean build** via Vite (`✓ built in 9.81s`, 2212 modules transformed, 0 TypeScript errors).

