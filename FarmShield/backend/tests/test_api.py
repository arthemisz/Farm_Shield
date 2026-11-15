import unittest
from app import create_app
from models import db, Farm

class ApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")

    def test_get_farms(self):
        res = self.client.get("/api/farms")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(len(data["data"]), 3)

    def test_get_crops(self):
        res = self.client.get("/api/crops")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(len(data["data"]), 19)

    def test_get_countries(self):
        res = self.client.get("/api/countries")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(len(data["data"]), 54)

    def test_rotation_recommendation(self):
        payload = {
            "latitude": 8.75,
            "longitude": 38.98,
            "currentCrop": "teff",
            "proposedCrops": ["faba_bean"]
        }
        res = self.client.post("/api/rotation/recommend", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("overallScore", data["data"])

if __name__ == "__main__":
    unittest.main()
