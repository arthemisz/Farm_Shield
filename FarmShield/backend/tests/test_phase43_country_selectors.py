import unittest
import json
import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import app

class Phase43CountrySelectorTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()

    def test_all_54_countries_endpoint(self):
        """Verify GET /api/countries returns exactly 54 African countries."""
        resp = self.client.get("/api/countries")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertTrue(data.get("success"))
        countries = data.get("data", [])
        self.assertEqual(len(countries), 54, f"Expected 54 countries, got {len(countries)}")

    def test_pilot_countries_status(self):
        """Verify the 5 pilot countries have operationalStatus == PILOT_OPERATIONAL."""
        resp = self.client.get("/api/countries")
        data = json.loads(resp.data)
        countries = data.get("data", [])
        pilot_codes = {"ET", "KE", "NG", "GH", "ZA"}
        found_pilots = set()
        for c in countries:
            iso = c.get("isoAlpha2", c.get("isoCode", ""))
            if iso in pilot_codes:
                found_pilots.add(iso)
                self.assertEqual(
                    c.get("operationalStatus"),
                    "PILOT_OPERATIONAL",
                    f"Country {iso} should be PILOT_OPERATIONAL, got {c.get('operationalStatus')}"
                )
        self.assertEqual(found_pilots, pilot_codes, f"Missing pilot countries: {pilot_codes - found_pilots}")

    def test_country_image_registry_endpoint(self):
        """Verify GET /api/countries/<country_code>/images returns valid metadata for pilots and directory countries."""
        for code in ["ET", "KE", "NG", "GH", "ZA", "DZ", "SN"]:
            resp = self.client.get(f"/api/countries/{code}/images")
            self.assertEqual(resp.status_code, 200, f"Failed for country {code}")
            data = json.loads(resp.data)
            self.assertTrue(data.get("success"))
            img_data = data.get("data", {})
            self.assertEqual(img_data.get("isoCode"), code)
            self.assertTrue("countryImage" in img_data)
            self.assertTrue("flagImage" in img_data)
            self.assertTrue("agricultureSubject" in img_data)
            self.assertTrue("sourceAttribution" in img_data)

    def test_geo_json_continent_endpoint(self):
        """Verify Africa GeoJSON endpoint responds with 54 features."""
        resp = self.client.get("/api/map/geojson")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        features = data.get("data", {}).get("features", [])
        self.assertEqual(len(features), 54, f"Expected 54 GeoJSON features, got {len(features)}")

if __name__ == "__main__":
    unittest.main()
