import unittest
from app import create_app
from config import Config
from models import db

class Phase40EndpointsTestCase(unittest.TestCase):
    def setUp(self):
        class TestConfig(Config):
            TESTING = True
            SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_countries_directory(self):
        res = self.client.get("/api/countries")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["total"], 54)
        
        # Test pilot status check
        pilot_countries = [c for c in data["data"] if c.get("operationalStatus") == "PILOT_OPERATIONAL"]
        self.assertEqual(len(pilot_countries), 5)
        pilot_codes = {c["isoCode"] for c in pilot_countries}
        self.assertEqual(pilot_codes, {"ET", "KE", "NG", "GH", "ZA"})

    def test_country_search_and_filter(self):
        # Filter by region
        res = self.client.get("/api/countries?region=Eastern%20Africa")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertTrue(all(c["region"] == "Eastern Africa" for c in data["data"]))

        # Filter by query
        res = self.client.get("/api/countries?q=kenya")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["isoCode"], "KE")

    def test_pilot_country_detail(self):
        res = self.client.get("/api/countries/ET")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        c = data["data"]
        self.assertEqual(c["operationalStatus"], "PILOT_OPERATIONAL")
        self.assertIn("agriculturalRegions", c)
        self.assertIn("soilCharacteristics", c)
        self.assertIn("agroclimaticZones", c)
        self.assertIn("plantingSeasons", c)

    def test_directory_only_country_detail(self):
        res = self.client.get("/api/countries/TD")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["operationalStatus"], "DIRECTORY_ONLY")

    def test_country_data_availability(self):
        res = self.client.get("/api/countries/ET/data-availability")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)
        self.assertIn("datasets", data["data"])

    def test_ai_assistant_status_and_chat(self):
        res = self.client.get("/api/ai-assistant/status")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("provider", data)

        res = self.client.post("/api/ai-assistant/chat", json={
            "message": "What is the primary planting season in Kenya?",
            "countryCode": "KE"
        })
        self.assertEqual(res.status_code, 200)
        chat_data = res.get_json()
        self.assertTrue(chat_data["success"])
        self.assertIn("response", chat_data)
        self.assertIn("citations", chat_data)

    def test_imports_list_and_upload(self):
        res = self.client.get("/api/imports")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)

        # Invalid upload test (missing fields)
        res = self.client.post("/api/imports/upload", json={})
        self.assertEqual(res.status_code, 400)

        # Valid upload test
        payload = {
            "countryCode": "ET",
            "datasetType": "crop_calendar",
            "fileContent": "cropId,cropName,plantingWindow,harvestWindow,agroecologicalZone,sourceCitation\nteff,Teff,July-August,November-December,Mid-Highlands,EIAR 2024",
            "filename": "test_calendar.csv",
            "sourceName": "EIAR 2024 Test Import"
        }
        res = self.client.post("/api/imports/upload", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn(data["importRecord"]["status"], ["APPROVED", "STAGED"])

if __name__ == "__main__":
    unittest.main()

    def test_africa_map_endpoints(self):
        res = self.client.get("/api/map/geojson")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["featureCount"], 54)
        self.assertEqual(len(data["data"]["features"]), 54)

        # Single country boundary test
        res_et = self.client.get("/api/map/country/ET")
        self.assertEqual(res_et.status_code, 200)
        data_et = res_et.get_json()
        self.assertTrue(data_et["success"])
        self.assertEqual(data_et["country"]["isoCode"], "ET")
        self.assertEqual(data_et["country"]["name"], "Ethiopia")
        self.assertIn("geometry", data_et)

    def test_unified_ai_assistant_capabilities(self):
        # Test Capability A: Assistant
        res_a = self.client.post("/api/ai-assistant/chat", json={
            "message": "What does my rainfall data (CHIRPS) mean?",
            "capability": "assistant",
            "countryCode": "ET"
        })
        self.assertEqual(res_a.status_code, 200)
        data_a = res_a.get_json()
        self.assertTrue(data_a["success"])
        self.assertEqual(data_a["capability"], "assistant")
        self.assertIn("Precipitation", data_a["topic"])

        # Test Capability B: Crop Advisor
        res_b = self.client.post("/api/ai-assistant/chat", json={
            "message": "Which crops may suit my farm?",
            "capability": "advisor",
            "countryCode": "KE"
        })
        self.assertEqual(res_b.status_code, 200)
        data_b = res_b.get_json()
        self.assertTrue(data_b["success"])
        self.assertEqual(data_b["capability"], "advisor")
        self.assertIn("Crop", data_b["topic"])
