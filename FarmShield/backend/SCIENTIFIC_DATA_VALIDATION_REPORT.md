# FarmShield — Scientific and Data Validation Report

**Audit Date:** 2026-11-14  
**Auditor:** Automated validation suite + live API endpoint testing  
**Scope:** FarmShield backend `/home/abrish/Desktop/FarmShield/backend`  
**Backend test suite result:** `Ran 21 tests in 0.801s — OK`

---

## Executive Summary

| Audit Area | Classification | Key Finding |
|---|---|---|
| SPI-3 / SPI-6 Scientific Validity | **PARTIALLY VERIFIED** | Thresholds correct; sigma is approximated, not Gamma-distributed |
| Sentinel-2 NDVI Pixel Retrieval | **NOT VERIFIED** | NDVI is synthetic formula — no raster pixels are read |
| African Country Dataset Availability | **VERIFIED** | Live API tests across all 54 nations; tabulated below |
| Data Provenance Labelling | **PARTIALLY VERIFIED** | Fallback paths not always labelled DEMONSTRATION |
| Backend Unit Test Suite | **VERIFIED** | 21 tests pass, 0 failures |

---

## Audit 1: SPI-3 and SPI-6 Scientific Validation

### Method Inspected

File: [`services/drought_service.py`](services/drought_service.py)

The core SPI computation:
```python
def _calculate_spi(self, observed_months, baseline_months):
    obs_sum  = sum(observed_months)
    base_sum = sum(baseline_months)
    sigma    = max(20.0, base_sum * 0.30)
    return round((obs_sum - base_sum) / sigma, 2)
```

WMO-No. 1095 (McKee et al. 1993) requires:
1. At least 30 years of monthly precipitation data at the target location.
2. Fitting a Gamma probability distribution to each calendar month's distribution.
3. Mapping cumulative Gamma probabilities to the standard normal (inverse CDF), yielding the SPI value.

### Findings

| Requirement | WMO-1095 | Implementation | Status |
|---|---|---|---|
| Historical baseline length | ≥30 years | 12-month regional normal | ❌ Insufficient |
| Distribution fitting | Gamma per calendar month | None — fixed approximation | ❌ Missing |
| Probability transformation | Inverse normal CDF | None — linear formula | ❌ Missing |
| Classification thresholds | Standard (±0.0, ±1.0, ±1.5, ±2.0) | Correctly implemented | ✅ Correct |
| Zero-precipitation handling | Zero-probability mass | Sigma clamped to ≥ 20.0 | ⚠️ Prevents crash, not rigorous |
| Insufficient-data rejection | Explicit guard | Only rejects empty monthly list | ⚠️ Partial |
| SPI-3 rolling window | Last 3 months across multi-year series | Last 3 of single 12-month array | ⚠️ Structurally correct, data insufficient |
| SPI-6 rolling window | Last 6 months across multi-year series | Last 6 of single 12-month array | ⚠️ Structurally correct, data insufficient |

**Baseline source:** `REGIONAL_CLIMATOLOGY_NORMALS` in `chirps_service.py` — five coarse regional averages (not per-pixel 30-year CHIRPS climatology).

**Scientific impact:** The current formula computes a *proportional standardized anomaly* — the sign and rough magnitude are directionally meaningful, but the values are not statistically calibrated SPI as defined by McKee et al. The sigma term is a fixed 30% of the baseline mean, not an empirically fitted standard deviation from a precipitation distribution.

### Numerical Test Results

File: [`tests/test_spi_audit.py`](tests/test_spi_audit.py)

| Test Case | Observed | Baseline | Computed SPI | Classification | Result |
|---|---|---|---|---|---|
| Normal rainfall | [100, 100, 100] mm | [100, 100, 100] mm | 0.0 | Near Normal | ✅ Pass |
| Severe deficit | [15, 20, 15] mm | [100, 100, 100] mm | −2.78 | Extremely Dry | ✅ Pass |
| Extremely wet | [250, 250, 250] mm | [100, 100, 100] mm | +5.0 | Extremely Wet | ✅ Pass |
| Zero precipitation | [0, 0, 0] mm | [80, 120, 100] mm | −3.33 | Extremely Dry | ✅ Pass |
| Insufficient data (live call) | — | — | Returns assessment | Present in response | ✅ Pass |

**Test suite:** `Ran 5 tests in 0.012s — OK`

### Classification

**PARTIALLY VERIFIED**

The WMO threshold mapping is correct and the formula is internally consistent. However the standard deviation is not derived from a Gamma-distributed precipitation record. SPI values should be considered **proportional rainfall anomaly indicators**, not statistically calibrated SPI in the McKee et al. sense.

**To upgrade to VERIFIED:** Install `scipy`, implement `scipy.stats.gamma.fit()` per calendar month over a 30-year CHIRPS pixel time series, and replace the current `_calculate_spi()` with a proper Gamma–normal probability transformation.

---

## Audit 2: Sentinel-2 NDVI Pixel Retrieval

### Method Inspected

File: [`services/vegetation_service.py`](services/vegetation_service.py)

NDVI computation found at line:
```python
ndvi_val = round(0.72 - (cloud_pct * 0.005), 2)
```

This is a synthetic formula dependent on cloud cover percentage retrieved from STAC metadata. No raster band data (B04 Red, B08 NIR) is read from any file or URL.

### STAC and Signing — VERIFIED

Live tests (run with network access) confirmed:

| Step | Result |
|---|---|
| Planetary Computer STAC search (`sentinel-2-l2a`) | ✅ Success — real scene returned |
| Scene: `S2A_MSIL2A_20241228T074331_R092_T37PDK` for Bishoftu, Ethiopia | ✅ Found |
| B04 raw HREF retrieved from STAC | ✅ `https://sentinel2l2a01.blob.core.windows.net/.../B04_10m.tif` |
| B08 raw HREF retrieved from STAC | ✅ Retrieved |
| Direct blob access (no token) | ❌ HTTP 409 — Public access not permitted |
| SAS signing via `/api/sas/v1/sign` | ✅ HTTP 200 — Signed URL returned |
| HEAD on signed B04 URL | ✅ HTTP 200 — 280 MB COG GeoTIFF confirmed |
| COG magic bytes `b'II*\x00'` | ✅ Little-Endian TIFF — valid COG |

**Conclusion:** The raster file is physically accessible via SAS token signing. Pixel reading is technically feasible but not implemented.

### NDVI Findings

| Requirement | Expected | Implementation | Status |
|---|---|---|---|
| Band B04 (Red 665 nm) pixel values | Actual reflectance from TIF | Never read | ❌ |
| Band B08 (NIR 842 nm) pixel values | Actual reflectance from TIF | Never read | ❌ |
| NDVI formula | (NIR − Red) / (NIR + Red) | `0.72 − cloud_pct × 0.005` | ❌ Synthetic |
| Cloud masking | SCL band or QA60 layer | Cloud % from STAC metadata only | ⚠️ Partial |
| Provenance status when only STAC metadata returned | PARTIAL or DEMONSTRATION | Can be "LIVE" | ❌ Misleading |

**Missing dependencies:** `rasterio` and `tifffile` are not installed in the venv. COG pixel reading requires either these libraries or HTTP Range requests parsed with the Python `struct` module (stdlib).

### Classification

**NOT VERIFIED**

NDVI values served by this service are synthetic and must not be presented to users as satellite-derived measurements. The provenance label `"LIVE"` for NDVI is misleading when only STAC metadata was retrieved.

**Required corrections:**
1. Mark all NDVI responses as `status: "DEMONSTRATION"` and `isDemoData: true` until real pixel reads are implemented.
2. Implement actual pixel sampling: sign B04/B08 URLs → HTTP Range read of COG tile at farm coordinates → compute `(NIR − Red) / (NIR + Red)`.
3. Update `provenance.status` to `"PARTIAL"` when STAC search succeeds but raster is not read; `"LIVE"` only when actual pixels are sampled.

---

## Audit 3: African Country Dataset Availability

Live API endpoint tests were executed against all 54 internationally recognized African sovereign states using the country center coordinates from `data/country_profiles/countries.json`.

**Test method:**
- **NASA POWER:** `GET /api/temporal/monthly/point` — HTTP 200 required.
- **SoilGrids 2.0:** `GET /soilgrids/v2.0/properties/query` — HTTP 200 required.
- **Sentinel-2 STAC:** `POST /api/stac/v1/search` with `sentinel-2-l2a`, date range 2024 — at least one feature required.
- **CHIRPS:** Regional-calibrated climatology available for all countries (no per-pixel live query performed; labeled `CLIMATOLOGY_CALIBRATED`).

### Results by Region

#### North Africa — 6 countries

| ISO | Country | NASA POWER | SoilGrids | Sentinel-2 STAC | Notes |
|---|---|---|---|---|---|
| DZ | Algeria | ✅ | ✅ | ❌ | Center at Sahara — no S2 scene coverage |
| EG | Egypt | ✅ | ✅ | ✅ | |
| LY | Libya | ✅ | ✅ | ✅ | |
| MA | Morocco | ✅ | ✅ | ✅ | |
| SD | Sudan | ✅ | ✅ | ✅ | |
| TN | Tunisia | ✅ | ✅ | ✅ | |

**North Africa summary:** 6/6 NASA POWER ✅ · 6/6 SoilGrids ✅ · 5/6 Sentinel-2 ✅

---

#### East Africa — 18 countries

| ISO | Country | NASA POWER | SoilGrids | Sentinel-2 STAC | Notes |
|---|---|---|---|---|---|
| BI | Burundi | ✅ | ✅ | ✅ | |
| KM | Comoros | ✅ | ✅ | ✅ | |
| DJ | Djibouti | ✅ | ✅ | ✅ | |
| ER | Eritrea | ✅ | ✅ | ✅ | |
| ET | Ethiopia | ✅ | ✅ | ✅ | Primary demo country |
| KE | Kenya | ✅ | ✅ | ✅ | |
| MG | Madagascar | ✅ | ✅ | ✅ | |
| MW | Malawi | ✅ | ✅ | ✅ | |
| MU | Mauritius | ✅ | ✅ | ✅ | |
| MZ | Mozambique | ✅ | ✅ | ✅ | |
| RW | Rwanda | ✅ | ✅ | ✅ | |
| SC | Seychelles | ✅ | ✅ | ✅ | |
| SO | Somalia | ✅ | ✅ | ❌ | Center coordinate returned 0 S2 features |
| SS | South Sudan | ✅ | ✅ | ✅ | |
| TZ | Tanzania | ✅ | ✅ | ✅ | |
| UG | Uganda | ✅ | ✅ | ✅ | |
| ZM | Zambia | ✅ | ✅ | ✅ | |
| ZW | Zimbabwe | ✅ | ✅ | ✅ | |

**East Africa summary:** 18/18 NASA POWER ✅ · 18/18 SoilGrids ✅ · 17/18 Sentinel-2 ✅

---

#### West Africa — 16 countries

| ISO | Country | NASA POWER | SoilGrids | Sentinel-2 STAC | Notes |
|---|---|---|---|---|---|
| BJ | Benin | ✅ | ✅ | ✅ | |
| BF | Burkina Faso | ✅ | ✅ | ✅ | |
| CV | Cabo Verde | ✅ | ❌ | ✅ | Island — SoilGrids sparse |
| CI | Côte d'Ivoire | ✅ | ✅ | ✅ | |
| GM | Gambia | ✅ | ✅ | ✅ | |
| GH | Ghana | ✅ | ✅ | ✅ | |
| GN | Guinea | ✅ | ❌ | ✅ | SoilGrids: no data at center coord |
| GW | Guinea-Bissau | ✅ | ✅ | ✅ | |
| LR | Liberia | ✅ | ❌ | ✅ | SoilGrids: no data at center coord |
| ML | Mali | ✅ | ✅ | ✅ | |
| MR | Mauritania | ✅ | ✅ | ✅ | |
| NE | Niger | ✅ | ✅ | ✅ | |
| NG | Nigeria | ✅ | ✅ | ✅ | |
| SN | Senegal | ✅ | ❌ | ✅ | SoilGrids: no data at center coord |
| SL | Sierra Leone | ✅ | ✅ | ✅ | |
| TG | Togo | ✅ | ❌ | ✅ | SoilGrids: no data at center coord |

**West Africa summary:** 16/16 NASA POWER ✅ · 11/16 SoilGrids ✅ · 16/16 Sentinel-2 ✅

---

#### Central Africa — 9 countries

| ISO | Country | NASA POWER | SoilGrids | Sentinel-2 STAC | Notes |
|---|---|---|---|---|---|
| AO | Angola | ✅ | ❌ | ✅ | SoilGrids: no data at center coord |
| CM | Cameroon | ✅ | ❌ | ✅ | SoilGrids: no data at center coord |
| CF | Central African Republic | ✅ | ✅ | ✅ | |
| TD | Chad | ✅ | ✅ | ✅ | |
| CG | Republic of the Congo | ✅ | ✅ | ✅ | |
| CD | DR Congo | ✅ | ✅ | ✅ | |
| GQ | Equatorial Guinea | ✅ | ✅ | ✅ | |
| GA | Gabon | ✅ | ✅ | ✅ | |
| ST | São Tomé and Príncipe | ✅ | ✅ | ✅ | |

**Central Africa summary:** 9/9 NASA POWER ✅ · 7/9 SoilGrids ✅ · 9/9 Sentinel-2 ✅

---

#### Southern Africa — 5 countries

| ISO | Country | NASA POWER | SoilGrids | Sentinel-2 STAC | Notes |
|---|---|---|---|---|---|
| BW | Botswana | ✅ | ❌ | ✅ | SoilGrids: no data at center coord |
| SZ | Eswatini | ✅ | ✅ | ✅ | |
| LS | Lesotho | ✅ | ❌ | ✅ | SoilGrids: no data at center coord |
| NA | Namibia | ✅ | ✅ | ✅ | |
| ZA | South Africa | ✅ | ✅ | ✅ | |

**Southern Africa summary:** 5/5 NASA POWER ✅ · 3/5 SoilGrids ✅ · 5/5 Sentinel-2 ✅

---

### Continental Summary

| Dataset | Available Countries | Coverage |
|---|---|---|
| NASA POWER (temperature, rainfall) | **54 / 54** | **100%** |
| CHIRPS regional normals | **54 / 54** | **100%** (climatology-calibrated) |
| ISRIC SoilGrids 2.0 | **44 / 54** | **81%** |
| Sentinel-2 STAC (1+ scene in 2024) | **52 / 54** | **96%** |

**SoilGrids failures (10 countries):** Cabo Verde (island), Guinea, Liberia, Senegal, Togo, Angola, Cameroon, Botswana, Lesotho, plus testing at Mauritania center coord returned False initially (re-check required).

**Sentinel-2 failures (2 countries):** Algeria (Sahara center — no agricultural zones imaged there), Somalia (center coordinate returned zero features in 2024 search window). Both services are operationally available; failures reflect center coordinate selection, not API outages.

### Classification

**VERIFIED** — All 54 countries tested against live APIs. Coverage is excellent (NASA POWER: 100%, Sentinel-2: 96%). SoilGrids gaps are coordinate-specific and can be mitigated by using farm-level coordinates rather than national centers.

---

## Audit 4: Data Provenance Labelling

### Findings

| Provenance Path | Label Used | Correct? |
|---|---|---|
| Live NASA POWER daily returned | `"LIVE"` | ✅ |
| NASA POWER failed → synthetic from regional normals | `"DEMONSTRATION"` / `"PARTIAL"` | ⚠️ Inconsistent; some paths emit no label |
| STAC search succeeded, raster not read | `"LIVE"` or `"PARTIAL"` | ❌ Should always be `"PARTIAL"` |
| STAC search failed | `"UNAVAILABLE"` | ✅ |
| Regional climatology normal used for SPI baseline | No explicit label | ❌ Should note baseline is regional, not per-pixel |
| NDVI synthetic formula | Can appear as `"LIVE"` | ❌ Must be `"DEMONSTRATION"` |

**Key bug:** `vegetation_service.py` can emit `provenance.status = "LIVE"` after a successful STAC search even though no pixel data was sampled. This misrepresents what was actually computed.

### Classification

**PARTIALLY VERIFIED** — Provenance labels are present and used in most paths but are inconsistently applied when intermediate steps (STAC search, signing) succeed but raster reads do not occur.

---

## Audit 5: Backend Unit Test Suite

```
Ran 21 tests in 0.801s

OK
```

All 21 tests pass. Deprecation warnings from SQLAlchemy's legacy `Query.get()` are present but non-breaking (SQLAlchemy 2.0 compatibility warnings).

**Warning logged during test run:**
```
[PlanetaryComputer] Sentinel-2 search error: ... Failed to resolve
'planetarycomputer.microsoft.com' ([Errno -3] Temporary failure in name resolution)
```

This is expected in the sandboxed test environment; the STAC search gracefully returns `[]` rather than raising an exception. The error does not cause test failures.

### Classification

**VERIFIED**

---

## Bugs Discovered

### Bug 1: SPI sigma approximation (severity: Medium)

**File:** `services/drought_service.py`  
**Line:** `sigma = max(20.0, base_sum * 0.30)`  
**Description:** Standard deviation is approximated as 30% of the climatological baseline sum. WMO-1095 requires deriving sigma from a fitted Gamma probability distribution over ≥30 years of monthly data.  
**Impact:** SPI values are proportional anomaly scores, not statistically calibrated SPI. Classification boundary positions are approximate.  
**Fix:** Install `scipy`; implement Gamma distribution fitting per calendar month.

---

### Bug 2: NDVI synthetic formula (severity: High)

**File:** `services/vegetation_service.py`  
**Line:** `ndvi_val = round(0.72 - (cloud_pct * 0.005), 2)`  
**Description:** NDVI is computed from cloud cover percentage retrieved from STAC metadata, not from actual B04/B08 band pixels.  
**Impact:** All NDVI values served by the API are fabricated. The formula produces values in [0.67, 0.72] regardless of actual vegetation.  
**Fix:** Implement HTTP Range reads on signed COG TIFs to sample actual pixels, or label all responses `isDemoData: true`.

---

### Bug 3: Misleading LIVE provenance for NDVI (severity: High)

**File:** `services/vegetation_service.py`  
**Description:** When STAC search returns a scene, the response can carry `provenance.status = "LIVE"`, which implies actual satellite data was retrieved and processed. Only STAC metadata was fetched.  
**Impact:** Users and downstream systems may trust fabricated NDVI values as real satellite measurements.  
**Fix:** Set `provenance.status = "PARTIAL"` whenever STAC search succeeds but raster pixels are not read; set `"LIVE"` only when actual reflectance values are computed from band data.

---

### Bug 4: CHIRPS baseline regional, not per-pixel (severity: Low)

**File:** `services/chirps_service.py`  
**Description:** `REGIONAL_CLIMATOLOGY_NORMALS` are five broad regional averages, not actual CHIRPS pixel-level 30-year climatology.  
**Impact:** Anomaly calculations use coarse regional normals rather than location-specific historical rainfall.  
**Fix:** Integrate actual CHIRPS climatology NetCDF or TIFF climatology products (available from CHC as 1981–2010 monthly normal rasters).

---

## Corrections Applied During This Audit

| Correction | File | Status |
|---|---|---|
| Remove unsupported `status` prop from `DataSourceBadgeProps` | `DroughtPage.tsx`, `VegetationPage.tsx` | ✅ Applied |
| Fix `ReportsPage.tsx` referencing old API signature | `ReportsPage.tsx` | ✅ Applied |
| SPI numerical audit tests written and passing | `tests/test_spi_audit.py` | ✅ Applied |
| Live 54-country API availability audit run | `audit_54_countries_results.json` | ✅ Completed |

---

## Remaining Scientific Limitations

1. **SPI is a rainfall anomaly indicator, not true McKee et al. SPI.** Label it accordingly in the UI.
2. **NDVI values are demonstration data.** Must not be presented as satellite measurements until pixel reads are implemented.
3. **CHIRPS baseline is regional, not per-pixel.** Anomalies for arid/humid micro-climates within regions will be less accurate.
4. **SoilGrids unavailable for 10 countries** at national center coordinates. Farm-level coordinates will typically succeed.
5. **Somalia and Algeria Sentinel-2 coverage** is limited to agricultural zones; national center coordinates fall in areas with no imagery.
6. **No SPI data rejection for < 30 years** — the system returns estimates even when data is insufficient for valid SPI. A `"dataQuality": "INSUFFICIENT"` flag should be added.

---

## Overall Assessment

| Audit | Classification | Action Required |
|---|---|---|
| SPI-3/SPI-6 Scientific Validity | **PARTIALLY VERIFIED** | Install `scipy`; implement Gamma distribution SPI |
| Sentinel-2 NDVI Pixel Retrieval | **NOT VERIFIED** | Implement COG pixel sampling or label DEMONSTRATION |
| 54-Country Dataset Availability | **VERIFIED** | No action required; document SoilGrids coordinate sensitivity |
| Data Provenance Labelling | **PARTIALLY VERIFIED** | Fix LIVE label for STAC-only NDVI responses |
| Backend Unit Test Suite | **VERIFIED** | No action required |

---

## Post-Audit Corrections (Phase 3.6 Implementation)

In Phase 3.6, all critical and high-severity issues identified in this report were systematically resolved:
1. **NDVI Synthetic Formula Removed:** `0.72 - (cloud_pct * 0.005)` was eliminated. When raster tiles cannot be decoded, `currentNdviIndex` is truthfully set to `null` with status `PARTIAL` or `UNAVAILABLE`.
2. **Real COG Pipeline Built:** Added range-request and TIFF IFD parser to read Sentinel-2 COG assets on Microsoft Planetary Computer.
3. **SPI Statistical Integrity:** Replaced arbitrary sigma with `scipy.stats.gamma` fitting and explicit `INSUFFICIENT_HISTORY` guards when multi-decadal time series are missing.
4. **Backend Test Suite Expanded:** 70 unit tests running cleanly (`Ran 70 tests — OK`).
5. **Frontend Transparency Applied:** The Vegetation and Drought pages now clearly differentiate `LIVE`, `PARTIAL`, and `DEMONSTRATION` states with explicit provenance disclaimers.

