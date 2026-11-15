import unittest
from app import create_app

class InternationalGeoTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_global_coordinates(self):
        # Test international agricultural sites
        test_locations = [
            {"name": "Addis Ababa, Ethiopia", "lat": 9.02, "lon": 38.74, "cc": "ET"},
            {"name": "Nairobi, Kenya", "lat": -1.28, "lon": 36.82, "cc": "KE"},
            {"name": "Iowa Corn Belt, USA", "lat": 41.88, "lon": -93.09, "cc": "US"},
            {"name": "Mato Grosso, Brazil", "lat": -12.64, "lon": -55.42, "cc": "BR"},
            {"name": "Punjab, India", "lat": 30.90, "lon": 75.85, "cc": "IN"}
        ]

        for loc in test_locations:
            with self.subTest(location=loc["name"]):
                res = self.client.get(f"/api/climate?lat={loc['lat']}&lon={loc['lon']}")
                self.assertEqual(res.status_code, 200)
                data = res.get_json()
                self.assertTrue(data["success"])
                self.assertIn("monthlyData", data["data"])

                res_soil = self.client.get(f"/api/soil?lat={loc['lat']}&lon={loc['lon']}")
                self.assertEqual(res_soil.status_code, 200)
                soil_data = res_soil.get_json()
                self.assertTrue(soil_data["success"])
                self.assertIn("soilType", soil_data["data"])

if __name__ == "__main__":
    unittest.main()

