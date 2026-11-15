# FarmShield — User Agricultural Data Import Guide
**Version:** 4.0.0  
**Domain:** Agricultural Intelligence & Decision-Support System  
**System Target:** Africa-Wide Support (54 Sovereign States, Initial Operational Focus on Pilot States)

---

## 1. Executive Overview

FarmShield operates on real, publicly accessible agricultural, remote sensing, and climatic datasets. While core coverage across the 5 pilot countries (Ethiopia, Kenya, Nigeria, Ghana, South Africa) is pre-integrated through CHIRPS, NASA POWER, SoilGrids 2.0, Sentinel-2 COG streaming, and FAOSTAT, **extension officers, agronomic institutions, and farmers can supply localized, proprietary, or regional datasets** for any of the 54 African countries.

All submitted datasets undergo **schema verification, bounding coordinate sanity checks, provenance logging, and non-destructive staging** before inclusion in agricultural recommendation workflows.

---

## 2. Supported Dataset Categories & Schemas

### 2.1 National Crop Calendar (`crop_calendar`)
Extension calendars specify verified planting, weeding, and harvest windows for agroecological zones.

* **File Format:** CSV or JSON
* **Required Header Fields (CSV):**
  ```csv
  cropId,cropName,plantingWindow,harvestWindow,agroecologicalZone,sourceCitation
  ```
* **Example Row:**
  ```csv
  teff,Teff,July-August,November-December,Mid-Highlands (1800-2400m),EIAR National Extension Guidelines 2024
  maize,Maize,April-May,September-October,Rift Valley Moist High-Rainfall,KALRO Crop Advisory Bulletin
  ```

### 2.2 Soil Profile Samples (`soil_profile`)
Soil laboratory analyses or local extension surveys.
* **File Format:** CSV or JSON
* **Required Header Fields (CSV):**
  ```csv
  sampleId,latitude,longitude,ph,clayPct,sandPct,organicCarbonGkg,sourceCitation
  ```
* **Validation Criteria:**
  * `latitude`: Between -35.0 and 38.0
  * `longitude`: Between -26.0 and 52.0
  * `ph`: 3.0 to 11.0
  * `clayPct + sandPct`: <= 100%

### 2.3 Rainfall Observations (`rainfall`)
Local rain gauge records (daily or decadal).
* **File Format:** CSV or JSON
* **Required Header Fields (CSV):**
  ```csv
  stationId,latitude,longitude,date,precipitationMm,sourceCitation
  ```

### 2.4 Crop Yield Benchmarks (`crop_yield`)
Subnational historical yields for economic risk modeling.
* **File Format:** CSV or JSON
* **Required Header Fields (CSV):**
  ```csv
  cropId,year,region,yieldKgPerHa,areaHarvestedHa,sourceCitation
  ```

---

## 3. Data Import Workflow

```
[User CSV / JSON File]
          │
          ▼
[POST /api/imports/upload] ──> [Schema & Geo-Spatial Validation]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
                 [Valid Data]                               [Invalid Data]
                       │                                           │
         [Staged in data/user_imports/]                    [HTTP 400 Bad Request]
         [Appended to registry.json]                       [Validation Errors Listed]
         [Available in Country Explorer]
```

---

## 4. REST API Endpoints

### 4.1 Upload & Stage a Dataset
* **URL:** `POST /api/imports/upload`
* **Content-Type:** `application/json`
* **Payload Example:**
```json
{
  "countryCode": "KE",
  "datasetType": "crop_calendar",
  "fileContent": "cropId,cropName,plantingWindow,harvestWindow,agroecologicalZone,sourceCitation\nsorghum,Sorghum,March-April,July-August,Eastern Semi-Arid,KALRO 2024",
  "filename": "kalro_semiarid_crops.csv",
  "title": "KALRO Eastern Semi-Arid Extension Calendar",
  "sourceName": "Kenya Agricultural and Livestock Research Organization (KALRO)",
  "sourceUrl": "https://www.kalro.org",
  "license": "Open Access / Government Extension"
}
```

* **Successful Response (200 OK):**
```json
{
  "success": true,
  "message": "Dataset uploaded and staged successfully.",
  "importRecord": {
    "id": "import_KE_20261114_173400_1",
    "filename": "kalro_semiarid_crops.csv",
    "countryCode": "KE",
    "datasetType": "crop_calendar",
    "title": "KALRO Eastern Semi-Arid Extension Calendar",
    "sourceName": "Kenya Agricultural and Livestock Research Organization (KALRO)",
    "status": "APPROVED",
    "recordCount": 1,
    "importedAt": "2026-11-14T17:34:00.123456+00:00"
  }
}
```

### 4.2 List Staged Imports
* **URL:** `GET /api/imports?country=KE`
* **Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "import_KE_20261114_173400_1",
      "countryCode": "KE",
      "title": "KALRO Eastern Semi-Arid Extension Calendar",
      "datasetType": "crop_calendar",
      "recordCount": 1,
      "status": "APPROVED",
      "importedAt": "2026-11-14T17:34:00.123456+00:00"
    }
  ]
}
```

---

## 5. Frontend User Interface

The FarmShield web application includes a dedicated **Data Import** view accessible via the sidebar navigation (`/data-import`):
1. Select target country from all 54 African Sovereign States.
2. Choose dataset type (`crop_calendar`, `soil_profile`, `rainfall`, `crop_yield`).
3. Paste CSV content or upload file directly.
4. Provide verifiable source citations.
5. Submit for automated parsing and validation.
6. Verify status in the real-time **Staged Imports Registry**.
