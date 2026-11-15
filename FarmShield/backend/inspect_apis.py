import requests
import json

def inspect_planetary_computer():
    print("=== INSPECTING PLANETARY COMPUTER STAC API ===")
    url = "https://planetarycomputer.microsoft.com/api/stac/v1/collections"
    try:
        r = requests.get(url, timeout=15)
        if r.status_code == 200:
            data = r.json()
            collections = data.get("collections", [])
            print(f"Total collections found: {len(collections)}")
            col_ids = [c["id"] for c in collections]
            
            # Target collections to check
            targets = ["sentinel-2-l2a", "esa-worldcover", "modis-13Q1-061", "modis-13A1-061", "modis-14A1-061", "modis-15A2H-061", "era5-pds", "gpm-imerg-hhr", "gpm-imerg-gis"]
            
            print("\nMatching targets in Planetary Computer:")
            for c in collections:
                cid = c["id"]
                title = c.get("title", "")
                if any(t in cid.lower() for t in ["sentinel-2", "worldcover", "modis-13", "modis-15", "gpm", "era5", "imerg", "soil"]):
                    extent = c.get("extent", {})
                    spatial = extent.get("spatial", {}).get("bbox", [])
                    temporal = extent.get("temporal", {}).get("interval", [])
                    print(f"- ID: {cid}")
                    print(f"  Title: {title}")
                    print(f"  Spatial bbox: {spatial[:1] if spatial else 'Global'}")
                    print(f"  Temporal: {temporal[:1] if temporal else 'N/A'}")
                    # check item_assets or summarises if available
                    item_assets = c.get("item_assets", {})
                    if item_assets:
                        print(f"  Item assets sample: {list(item_assets.keys())[:8]}")
            
            # Specifically check sentinel-2-l2a
            s2 = requests.get("https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a", timeout=10)
            if s2.status_code == 200:
                s2_data = s2.json()
                print("\nSentinel-2 L2A Details:")
                print("Title:", s2_data.get("title"))
                print("Item Assets:", list(s2_data.get("item_assets", {}).keys()))
            
            # Specifically check esa-worldcover
            ewc = requests.get("https://planetarycomputer.microsoft.com/api/stac/v1/collections/esa-worldcover", timeout=10)
            if ewc.status_code == 200:
                ewc_data = ewc.json()
                print("\nESA WorldCover Details:")
                print("Title:", ewc_data.get("title"))
                print("Item Assets:", list(ewc_data.get("item_assets", {}).keys()))
        else:
            print(f"Failed to fetch collections: {r.status_code}")
    except Exception as e:
        print(f"Error fetching STAC: {e}")

def inspect_nasa_power():
    print("\n=== INSPECTING NASA POWER API ===")
    # Query monthly climatology/time series for point (e.g. Addis Ababa: 9.02, 38.74)
    url = "https://power.larc.nasa.gov/api/temporal/monthly/point"
    params = {
        "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN",
        "community": "AG",
        "longitude": 38.74,
        "latitude": 9.02,
        "format": "JSON",
        "start": 2023,
        "end": 2024
    }
    try:
        r = requests.get(url, params=params, timeout=15)
        print("NASA POWER Status:", r.status_code)
        if r.status_code == 200:
            res = r.json()
            params_returned = list(res.get("properties", {}).get("parameter", {}).keys())
            print("Parameters returned:", params_returned)
            header = res.get("header", {})
            print("Title:", header.get("title"))
        else:
            print("Response:", r.text[:200])
    except Exception as e:
        print(f"Error checking NASA POWER: {e}")

def inspect_soilgrids():
    print("\n=== INSPECTING ISRIC SOILGRIDS API ===")
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    params = {
        "lon": 38.74,
        "lat": 9.02,
        "property": ["phh2o", "soc", "sand", "silt", "clay", "cec"],
        "depth": ["0-5cm", "5-15cm", "15-30cm"],
        "value": ["mean"]
    }
    try:
        r = requests.get(url, params=params, timeout=15)
        print("SoilGrids Status:", r.status_code)
        if r.status_code == 200:
            res = r.json()
            layers = res.get("properties", {}).get("layers", [])
            print("Layers returned:", [l.get("name") for l in layers])
        else:
            print("SoilGrids Response:", r.status_code, r.text[:200])
    except Exception as e:
        print(f"Error checking SoilGrids: {e}")

if __name__ == "__main__":
    inspect_planetary_computer()
    inspect_nasa_power()
    inspect_soilgrids()

