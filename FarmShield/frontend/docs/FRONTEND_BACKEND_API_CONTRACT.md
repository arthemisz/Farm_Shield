# FarmShield — Frontend/Backend API Contract

## Overview

This document specifies the REST API contract between the FarmShield frontend and future backend services (Phase 2), decoupling client state from the data source and enabling real-time integrations with NASA POWER, ISRIC SoilGrids, and localized agronomic engines.

---

## Base Configuration

- **Default Base URL**: `/api/v1`
- **Data Exchange Format**: JSON (`application/json`)
- **Authentication**: Bearer JWT token header (`Authorization: Bearer <token>`)

---

## Core Endpoints

### 1. Country Registry

#### `GET /api/v1/countries`
Returns list of supported countries and their operational status.

**Response (200 OK):**
```json
[
  {
    "code": "ET",
    "name": "Ethiopia",
    "flag": "🇪🇹",
    "currency": "ETB",
    "defaultLanguage": "am",
    "supportedLanguages": ["am", "en"],
    "supportStatus": "mvp"
  },
  {
    "code": "KE",
    "name": "Kenya",
    "flag": "🇰🇪",
    "currency": "KES",
    "defaultLanguage": "sw",
    "supportedLanguages": ["sw", "en"],
    "supportStatus": "planned"
  }
]
```

#### `GET /api/v1/countries/:code`
Returns comprehensive country profile, including administrative division schema and bounding envelope.

---

### 2. Farms Management

#### `GET /api/v1/farms`
Retrieve all registered farm parcels for the authenticated user/organization. Query parameter `countryCode` allows filtering.

#### `POST /api/v1/farms`
Create a new farm parcel.

**Request Body:**
```json
{
  "name": "Bishan Daba Farm",
  "countryCode": "ET",
  "adminLevel1": "Oromia",
  "adminLevel2": "West Shewa",
  "adminLevel3": "Ambo",
  "latitude": 8.9806,
  "longitude": 37.8525,
  "size": 4.5,
  "sizeUnit": "hectares",
  "soilType": "Vertisol",
  "waterAvailability": "Rainfed",
  "currentCrop": "Teff"
}
```

#### `PUT /api/v1/farms/:id`
Update existing farm parcel data.

#### `DELETE /api/v1/farms/:id`
Remove a farm parcel.

---

### 3. Climate Intelligence

#### `GET /api/v1/climate/point`
Query agroclimatology time-series from satellite and reanalysis feeds (e.g., NASA POWER).

**Query Parameters:**
- `lat` (float, required): Latitude
- `lon` (float, required): Longitude
- `year` (int, optional): Selected year (defaults to current)
- `countryCode` (string, optional): Context code

**Response (200 OK):**
```json
{
  "provenance": {
    "provider": "NASA POWER Agroclimatology",
    "source": "NASA Langley Research Center",
    "retrievalDate": "2026-11-14",
    "spatialResolution": "0.5° x 0.5°",
    "measurementType": "satellite_model",
    "isDemoData": false
  },
  "summary": {
    "annualRainfallMm": 940,
    "avgTempC": 19.5,
    "minTempC": 11.2,
    "maxTempC": 26.8,
    "droughtRiskScore": "Moderate"
  },
  "monthlyData": [ ... ]
}
```

---

### 4. Soil Information

#### `GET /api/v1/soil/point`
Query digital soil mapping feeds (e.g., ISRIC SoilGrids).

**Query Parameters:**
- `lat` (float, required)
- `lon` (float, required)

---

### 5. Crop Rotation Recommendation Engine

#### `POST /api/v1/recommendations/evaluate`
Evaluate suitability and agronomic balance of a proposed rotation sequence.

**Request Body:**
```json
{
  "farmId": "farm-1",
  "currentCrop": "Wheat",
  "proposedSequence": ["Faba Bean"],
  "countryCode": "ET"
}
```

**Response (200 OK):** Returns a full `RotationEvaluation` payload with breakdown scores for climate, soil, water, diversity, and nitrogen fixation along with data provenance and risk highlights.

