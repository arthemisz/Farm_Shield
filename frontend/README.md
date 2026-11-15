# FarmShield (Frontend)

> **NASA-Powered Climate-Resilient Crop Rotation Decision Support System**  
> *Smarter Farming. Stronger Harvests. A Resilient Future.*  
> **NASA Space Apps Challenge 2026** — *Challenge 07/14: Field Shift: Adapting Farms with NASA Data*

---

## Overview

**FarmShield** empowers farmers and agricultural advisors to make resilient crop rotation decisions by synthesizing:
- **NASA agroclimatic data** (temperature envelopes, precipitation distribution, historical drought trends)
- **Soil characteristics** (drainage, pH, texture, organic matter)
- **Crop physiological tolerances** and botanical synergies
- **Regional water availability & crop diversity**

The system starts with **Ethiopia** as its initial fully-supported agricultural ecosystem (featuring Teff, Wheat, Maize, and Faba Bean), and is architected from the foundation for pan-African and global expansion (Kenya, Uganda, Tanzania, Rwanda).

---

## Visual Identity & Design

- **Forest Green** (`#14532D`, `#16A34A`): Growth, agriculture, sustainability
- **Warm Orange** (`#F97316`, `#EA580C`): Solar energy, vitality, accents, active states
- **Deep Black & Charcoal** (`#171717`, `#262626`): High contrast readability, executive styling
- **Neutral Light Grey** (`#F5F5F4`): Crisp dashboard cards and background

---

## Key Features

1. **Dashboard**: High-level agroclimatic KPIs, seasonal alerts, active farm overviews, and rotation recommendations.
2. **My Farms**: Multi-country farm registry supporting dynamic administrative hierarchies (e.g. Region/Zone/Woreda in Ethiopia, County/Sub-county/Ward in Kenya).
3. **Climate Intelligence**: Monthly temperature & rainfall charts, 10-year historical trend tracking, and simulated NASA POWER reanalysis badges.
4. **Soil Information**: Digital soil mapping attributes (pH, texture class, organic carbon, drainage rating).
5. **Crop Database**: Detailed profiles for core crops including optimal agroecological zones, botanical traits, nitrogen fixation values, and local language designations.
6. **Crop Rotation Planner**: Multi-factor sequence evaluator analyzing climate suitability, soil match, water balance, botanical diversity, and nitrogen replenishment.
7. **Interactive Map**: Leaflet-based geospatial visualization of farm boundaries, coordinates, and agroclimatic clusters.
8. **Reports & Exports**: Comprehensive farm advisory dossier generation with print and PDF-ready formatting.
9. **Settings & Localization**: Unit conversion (ha/acres, °C/°F, mm/inches), multi-language switching (`en`, `am`, `sw`, `fr`, `ar`), and country configuration selection.

---

## International Expansion Architecture

Documentation for internationalization and extension modules is available in [`docs/`](./docs):
- [International Architecture](./docs/INTERNATIONAL_ARCHITECTURE.md)
- [Country Configuration Guide](./docs/COUNTRY_CONFIGURATION_GUIDE.md)
- [Location & Boundary System](./docs/LOCATION_SYSTEM.md)
- [International Crop Database](./docs/INTERNATIONAL_CROP_DATABASE.md)
- [Data Provider Architecture](./docs/DATA_PROVIDER_ARCHITECTURE.md)
- [Recommendation Engine](./docs/RECOMMENDATION_ENGINE.md)
- [Frontend/Backend API Contract](./docs/FRONTEND_BACKEND_API_CONTRACT.md)
- [Internationalization (i18n)](./docs/INTERNATIONALIZATION.md)

---

## Tech Stack

- **React 18** & **TypeScript**
- **Vite** (Build tool)
- **Tailwind CSS** (Custom theme)
- **React Router v6**
- **Lucide React** (Icons)
- **Chart.js** & **react-chartjs-2**
- **React Leaflet** & **Leaflet**
- **i18next** & **react-i18next**

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### Development
```bash
npm run dev
```
The application will launch at `http://localhost:5173/`.

### Build
```bash
npm run build
```
Creates a minified production bundle in the `dist/` directory.

---

## Data Notice

> ⚠️ **Demonstration & Prototype Status**  
> All NASA climate metrics, soil profiles, and rotation scoring heuristics presented in this client are demonstration models designed for the NASA Space Apps Challenge prototype. They do not substitute for on-site agronomic tests or consultation with local agricultural extension workers.
