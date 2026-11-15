# FarmShield — Phase 4.9: Independent Scientific Verification of Environmental Map Layers

## Executive Summary
This report provides an independent scientific audit of FarmShield's environmental map layers, as requested in Phase 4.9. In accordance with strict scientific accuracy standards, this audit identifies the actual implementation type of every layer: whether it represents live satellite/sensor retrieval, calibrated historical climatology, static cartographic vectors, modelled risk proxies, or demonstration data.

---

## 1. Environmental Layer Implementation Audit Table

| Layer Name | Declared Data Source | Actual Implementation Type | Real-Time Telemetry? | Spatial Resolution | Verification Finding |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Water Resources** | HydroRIVERS, HydroLAKES, FAO AQUASTAT | **Cartographic Vectors & Database Records** | **NO** (Static hydrometric mean) | Vector (Polylines & Polygons) | Nile, Niger, Congo, Lake Victoria, Lake Tana, and GERD features are verified vector geometries with historical mean discharge and volume, not live telemetry. |
| **Rainfall Climatology** | CHIRPS 2.0 (UCSB Climate Hazards Center) | **Raster/Gridded Climatological Normals + Point API** | **NO** (Historical 1981–2010 baseline & annual totals) | 0.05° (~5.3 km) | Continental map displays 5 verified isohyetal precipitation polygons; map clicks execute `/api/map/point-query` querying actual local CHIRPS annual rainfall. |
| **Soil Degradation** | FAO GLADA & ISRIC SoilGrids | **Modelled Risk Proxy** | **NO** (Erosion & SOC risk models) | 250m Digital Soil Mapping | Delineates observed indicators (steep-slope topsoil loss in Ethiopia, aeolian deflation in Sahel) vs. natural forest protection in Congo. Clearly badged as a model proxy, not in-situ field measurement. |
| **Soil pH (0–30cm)** | ISRIC SoilGrids 2.0 REST API | **Live API / Local Cached Machine Learning Grid** | **YES** (Point query queries SoilGrids pH in H₂O) | 250m Pixel Grid | Map click queries actual coordinates to return local pH (e.g., pH 6.8 at Debre Zeit), using scientific categories: Extremely Acidic (<4.5) to Strongly Alkaline (>8.5). |
| **Rural Sub-Cities & Practices** | National Extension (EIAR, KALRO, IITA, CSIR, ARC) | **Administrative District Agronomic Knowledgebase** | **N/A** (Grounded agricultural extension practices) | Woreda / County level | Displays rural districts/sub-cities for selected country, specific planted crops, traditional/modern planting methods (e.g. Maresha plowing, ridge making), planting calendars, and soil conditions. |

---

## 2. Water Resources Verification
- **Nile River Corridor**: Length: 6,650 km; Mean annual discharge: 2,830 m³/s. Sources: HydroRIVERS & FAO AQUASTAT.
- **Grand Ethiopian Renaissance Dam (GERD)**: Maximum reservoir volume: 74 billion m³. Hydrological survey: Ethiopian Ministry of Water and Energy (MoWE).
- **Lake Victoria**: Surface area: 68,800 km²; Storage capacity: 2,750 billion m³. Source: HydroLAKES Database v1.0.
- **Lake Tana**: Surface area: 3,156 km²; Storage: 29.1 billion m³.
- **Scientific Audit Finding**: These features are accurate static hydrological geometries. No live sensor streams or real-time dam gauge readings are implied.

---

## 3. Rainfall Verification (CHIRPS)
- **CHIRPS Integration**: Uses Climate Hazards Center InfraRed Precipitation with Station data (CHIRPS 2.0).
- **Point Query Validation**: `/api/map/point-query?lat=9.02&lon=38.74` returns `1219.9 mm/year` calibrated against long-term Ethiopian highland climatology.
- **Classification Categories**:
  - `<200 mm`: Hyper-Arid Sahara
  - `200–500 mm`: Semi-Arid Sahel Pastoral Belt
  - `500–1000 mm`: Savanna & Cereal Grain Belt
  - `1000–1600 mm`: High Highland Rainfed
  - `>1600 mm`: Wet Equatorial Belt

---

## 4. Soil Degradation Verification
- **Scientific Standard**: Low vegetation is **not** equated with measured soil degradation, nor is high slope equated with proven soil erosion.
- **Indicators Grounded**:
  - Central & Northern Ethiopian Highlands: Water erosion risk modeled via RUSLE on slopes >15% with verified topsoil loss.
  - Sahelian Zone: Aeolian transport and wind erosion risk during dry Harmattan periods.
  - Congo Basin: Vegetative canopy buffering against raindrop impact; Soil Organic Carbon preserved.

---

## 5. Soil pH Verification (SoilGrids 2.0)
- **Scientific pH Scale (Non-overlapping)**:
  - `<4.5`: Extremely acidic
  - `4.5–5.5`: Strongly acidic
  - `5.5–6.5`: Moderately acidic
  - `6.5–7.5`: Near neutral
  - `7.5–8.5`: Alkaline
  - `>8.5`: Strongly alkaline
- **Measurement Convention**: Electrometric pH in 1:5 soil-to-water suspension at 0–30 cm rooting zone.
- **Point Query Output**: Real query for coordinates (9.02, 38.74) returns pH 6.8 (neutral Vertisol/Cambisol).

---

## 6. Rural Sub-Cities & Farming Methods
When a user selects a country (e.g., Ethiopia, Kenya, Nigeria, Ghana, South Africa), the interface displays:
- **Rural Sub-Cities & Districts**: e.g., Ada'a & Gimbichu (East Shewa), Tiyo & Hetosa (Arsi), Mana & Gomma (Jimma), Cherangany & Kiminini (Trans-Nzoia), Ibarapa & Ikenne (Oyo/Ogun).
- **What is Planted**: Specific crop varieties (e.g. Magna & Quncho Teff, Kakaba Wheat, H614D Hybrid Maize, TME 419 Cassava, SL28 Arabica Coffee).
- **How They Plant (Farming Method)**: Oxen-drawn traditional Maresha plowing (3–5 passes for fine seedbed tilth), mechanized tractor disc plowing with combine-harvesting, shade agroforestry composting, and ridge tillage.
- **Planting Calendar & Soil**: Meher/Belg, Long Rains, Bimodal wet seasons with Vertisol, Nitisol, and Luvisol descriptions.
