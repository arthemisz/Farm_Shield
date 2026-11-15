import requests

def test_stac_search():
    url = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
    payload = {
        "collections": ["sentinel-2-l2a"],
        "intersects": {
            "type": "Point",
            "coordinates": [38.74, 9.02]
        },
        "query": {
            "eo:cloud_cover": {"lt": 20}
        },
        "limit": 3,
        "sortby": [{"field": "datetime", "direction": "desc"}]
    }
    r = requests.post(url, json=payload, timeout=15)
    print("STAC search status:", r.status_code)
    if r.status_code == 200:
        data = r.json()
        features = data.get("features", [])
        print(f"Found {len(features)} scenes")
        if features:
            f0 = features[0]
            print("Scene ID:", f0["id"])
            print("Datetime:", f0["properties"].get("datetime"))
            print("Cloud cover %:", f0["properties"].get("eo:cloud_cover"))
            print("B4 asset href:", f0["assets"].get("B04", {}).get("href", "")[:60] + "...")
            print("B8 asset href:", f0["assets"].get("B08", {}).get("href", "")[:60] + "...")
            print("Thumbnail preview:", f0["assets"].get("preview", {}).get("href", ""))

if __name__ == "__main__":
    test_stac_search()

