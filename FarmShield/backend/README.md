# FarmShield Backend

International Agricultural Intelligence and Climate-Resilient Crop Rotation Decision-Support API.

Built for the **NASA Space Apps Challenge 2026** (Challenge: *Field Shift: Adapting Farms with NASA Data*).

---

## 🌍 Overview

FarmShield connects smallholders and agricultural extension advisors with global open-access Earth Observation datasets and digital soil mapping:
- **NASA POWER API**: Global solar radiation, precipitation, and temperature climatology.
- **ISRIC SoilGrids 2.0**: Global 250m machine-learning derived edaphic properties (pH, Organic Carbon, texture fractions, CEC).
- **Microsoft Planetary Computer STAC**: Copernicus Sentinel-2 L2A multispectral imagery (NDVI tracking) and ESA WorldCover 10m land use.

The platform provides an explainable 5-pillar crop rotation advisory engine that balances:
1. Climate Suitability (30%)
2. Soil Chemistry & Physical Suitability (25%)
3. Water & Irrigation Requirements (20%)
4. Crop Diversity & Pest Cycle Disruption (15%)
5. Biological Nitrogen Fixation (10%)

---

## 🚀 Setup & Execution

### 1. Requirements
- Python 3.10+
- Virtual environment (`venv`)

### 2. Installation
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Running the Server
```bash
python app.py
```
The API server starts at `http://localhost:5000` with CORS enabled for `http://localhost:5173`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck and service metadata |
| `GET` | `/api/farms` | List registered farms (supports `?country_code=ET`) |
| `POST` | `/api/farms` | Register new farm with coordinates, soil type, and size |
| `GET` | `/api/farms/<id>` | Farm detailed profile |
| `PUT` | `/api/farms/<id>` | Update farm parameters |
| `DELETE` | `/api/farms/<id>` | Remove farm |
| `GET` | `/api/climate` | Monthly climatology (`?lat=9.02&lon=38.74&year=2024`) |
| `GET` | `/api/soil` | Standard depth-resolved soil properties (`?lat=9.02&lon=38.74`) |
| `GET` | `/api/vegetation` | Sentinel-2 NDVI multispectral analysis (`?lat=...&lon=...`) |
| `GET` | `/api/crops` | Crop database (supports `?country_code=ET` & `?q=teff`) |
| `POST` | `/api/rotation/recommend`| Run 5-factor crop rotation recommendation engine |
| `GET` | `/api/countries` | Country support configurations & administrative levels |
| `GET` | `/api/datasets` | Active dataset provenance registry |

---

## 🧪 Testing

Run all unit tests and international coordinate integration tests:
```bash
./venv/bin/python3 -m unittest discover tests
```

