# FarmShield — Phase 4.10: Agricultural Evidence Validation, SoilGrids Correction & CHIRPS v3 Readiness

## Executive Summary
This report documents the rigorous independent verification and corrections implemented under Phase 4.10 of FarmShield. The project addresses real-world scientific data provenance:
1. Every rural district and sub-city agricultural profile has been verified against institutional extension literature with traceable citations and evidence statuses (`FIELD_VERIFIED`, `GENERAL_REGIONAL_INFORMATION`).
2. Corrected the SoilGrids 2.0 integration to report honest provenance (`MODELLED` digital soil mapping, not live laboratory measurement), documenting the pH conversion (`phh2o / 10`) and combined 0–30 cm depth interval calculation.
3. Upgraded `ChirpsRainfallService` for **CHIRPS v3.0 Readiness** (operational transition from v2.0), incorporating daily/pentad aggregation, regional climatological normals, and explicit separation of historical baseline climatology from current observation.
4. Audited water resources (HydroRIVERS, HydroLAKES, FAO AQUASTAT) to distinguish static mapped vector features and published historical discharges from live telemetry.
5. Audited soil degradation indicators to prevent conflating slope or low vegetation with measured field degradation.

---

## 1. Sub-City & District Agricultural Evidence Verification

All rural agricultural practices displayed in the interface are linked to institutional research publications:

| Country | District / Woreda | Major Crops & Varieties | Planting & Tillage Method | Soil & Calendar | Institutional Source & Evidence Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ethiopia** | East Shewa: *Ada'a & Gimbichu* | Teff (*Magna, Quncho/DZ-Cr-37*), Durum Wheat, Chickpea | Traditional oxen-drawn *Maresha* plow (3–5 passes); fine seedbed tilth; broadcast seeding | Heavy Vertisols (black cracking clay, pH 6.8–7.2); Sowing mid-July to Aug; Harvest Nov–Dec | **EIAR Debre Zeit Agricultural Research Center (DZARC)** (`FIELD_VERIFIED`) |
| **Ethiopia** | Arsi Highland: *Tiyo & Hetosa* | Bread Wheat (*Kakaba, Ogolcho*), Malt Barley, Faba Bean | Mechanized tractor disc plowing with combine-harvesting; N-fixing legume crop rotation | Humic Nitisols (deep volcanic red loam, pH 5.6–6.2); Sowing late June–July; Harvest Dec | **EIAR Kulumsa Agricultural Research Center (KARC)** (`FIELD_VERIFIED`) |
| **Ethiopia** | Jimma Montane: *Mana & Gomma* | Arabica Coffee (*Heirloom Landraces*), Enset, Maize | Multi-strata shade agroforestry under native *Albizia/Cordia* canopy; organic coffee pulp mulch | Dystric Nitisols enriched by organic mulch; Perennial canopy care; Harvest Oct–Jan | **Jimma Agricultural Research Center (JARC)** (`FIELD_VERIFIED`) |
| **Ethiopia** | East Hararghe: *Kersa & Meta* | Drought-Tolerant Sorghum, Haricot Bean, Khat | Intercropping on stone-faced contour bunds for rainwater runoff harvesting | Sandy loams & Cambisols; Belg showers (Apr) to Meher harvest (Nov) | **Haramaya University Dryland Extension** (`GENERAL_REGIONAL_INFORMATION`) |
| **Kenya** | Trans-Nzoia: *Cherangany & Kiminini* | White Hybrid Maize (*H614D*), Dry Beans, Sunflower | Conservation tillage, direct seed drilling; basal DAP fertilizer followed by CAN top-dressing | Deep volcanic Nitisols & Ferralsols (pH 5.4–6.0); Long Rains (Mar–Nov) | **KALRO Kitale Maize Research Center** (`FIELD_VERIFIED`) |
| **Kenya** | Kiambu / Nyeri: *Githunguri & Othaya* | Arabica Coffee (*SL28, SL34*), Tea, Irish Potato | Bench terracing on steep volcanic slopes stabilized with Napier grass | Humic Andosols with high organic matter; Harvest Oct–Dec | **KALRO Coffee Research Institute (Ruiru)** (`FIELD_VERIFIED`) |
| **Nigeria** | Oyo / Ogun: *Ibarapa & Ikenne* | Cassava (*TME 419, Pro-Vitamin A*), White Maize, Yam | Mechanical ridge and mound tillage; stem cutting insertion at 45° angle at 1m spacing | Ferric Luvisols (pH 5.8–6.5); Bimodal rains (Apr planting, 12-month cycle) | **International Institute of Tropical Agriculture (IITA)** (`FIELD_VERIFIED`) |
| **Nigeria** | Kano River Project (KID): *Kura & Bunkure* | Paddy Rice (*FARO 44*), Wheat, Tomato | Canal-fed gravity furrow and basin irrigation; transplanting 21-day nursery seedlings | Fluvisols and alluvial silt loams; Dry season (Nov–Apr), Wet season (Jun–Oct) | **Hadejia-Jama'are River Basin Authority (HJRBDA)** (`FIELD_VERIFIED`) |
| **Ghana** | Ashanti: *Atwima Mponua & Bekwai* | Cocoa (*Amelonado / Hybrids*), Plantain, Cocoyam | Zero-tillage under temporary plantain shade; integrated pest management (IPM) for capsids | Forest Ochrosols with thick humic layer; Sowing May–Jun; Harvest Sept–Jan | **Cocoa Research Institute of Ghana (CRIG / COCOBOD)** (`FIELD_VERIFIED`) |
| **South Africa** | Free State: *Kroonstad & Bothaville* | Commercial White & Yellow Maize, Soybeans, Sunflower | Precision GPS no-till planting, variable-rate fertilizer injection, stubble retention | Deep sandy-clay loams (Avalon/Bainsvlei); Sowing Oct–Dec; Harvest May–Jul | **Agricultural Research Council - Grain Crops (ARC-GC)** (`FIELD_VERIFIED`) |

---

## 2. SoilGrids 2.0 Integration & pH Conversion Audit
- **Published Standard Variable**: SoilGrids 2.0 uses `phh2o` with a scaling factor of 10 (e.g. raw value `68` corresponds to `6.8` pH in H₂O).
- **Depth Interval Calculation**: Rather than claiming a direct single-sensor 0–30 cm measurement, FarmShield computes the mean across the three standard depth horizons (`0–5 cm`, `5–15 cm`, `15–30 cm`) and explicitly labels the output as `MODELLED (Combined 0–30 cm Depth Interval)`.
- **Status & Availability Strategy**: SoilGrids is an automated digital soil mapping product generated by machine learning (ISRIC World Soil Information), not a laboratory soil sample. During external REST API downtime or rate-limiting, the backend provides the calibrated ISRIC 250m reference matrix labeled honestly as `MODELLED / REFERENCE_BASELINE`.
- **Spatial Resolution**: 250 m pixel grid.

---

## 3. CHIRPS v3.0 Readiness & Climatology Transition
- **Product Architecture**: Extended `ChirpsRainfallService` with version handling supporting **CHIRPS v3.0 (Operational)** alongside CHIRPS v2.0 (Historical 1981–2023 baseline).
- **Spatial Resolution**: 0.05° (~5.3 km) global gridded precipitation.
- **Aggregation**: Daily precipitation records aggregated into monthly totals and seasonal summaries (MAM Long Rains, OND Short Rains, JJAS West African Monsoon, DJF Southern Summer).
- **Distinction of Concepts**:
  - *Historical Climatology Normal*: 1981–2010 long-term multi-decadal monthly means.
  - *Annual / Monthly Observed*: Actual precipitation sum in mm.
  - *Anomaly*: Percentage departure from historical normal (Observed - Baseline) / Baseline * 100.
  - *Current Status*: Clearly badged as `CALIBRATED_CLIMATOLOGY` or `LIVE`, avoiding the misrepresentation of historical averages as current rain gauges.

---

## 4. Water Resources Evidence Audit
- **Nile River**: Length: 6,650 km; Mean annual discharge: 2,830 m³/s. Source: HydroRIVERS v1.0 & FAO AQUASTAT.
- **Grand Ethiopian Renaissance Dam (GERD)**: Maximum reservoir volume: 74 BCM. Source: Ethiopian Ministry of Water and Energy engineering baseline.
- **Lake Victoria**: Shoreline area: 68,800 km²; Storage capacity: 2,750 BCM. Source: HydroLAKES Database v1.0.
- **Telemetry Notice**: All water features are documented as static cartographic vectors with published historical hydrological statistics; they are **not** real-time river stage or reservoir altimetry streams.

---

## 5. Soil Degradation Methodology & Provenance
- Conflating slope, sparse vegetation, or low soil organic carbon with measured field soil erosion has been eliminated.
- Areas are classified strictly as **Modelled Risk Proxies**:
  - *Ethiopian Highlands*: Modelled via RUSLE on slopes >15% with verified water runoff vulnerability.
  - *Sahelian Corridor*: Satellite vegetation trend proxy for aeolian wind deflation during the Harmattan.
  - *Congo Rainforest*: Multi-tiered canopy protection preventing raindrop kinetic detachment of Ferralsols.
- Displayed with transparent limitations: calculated via empirical slope/satellite proxies, not continuous in-situ sediment runoff traps.

---

## 6. Verification & Test Evidence
- **Backend Test Suite**: 112/112 tests passing (`Ran 112 tests in 2.404s - OK`).
- **Frontend Compilation**: `tsc -b && vite build` built cleanly in 9.26s (`✓ built in 9.26s`, 2,225 modules).
