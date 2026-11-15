import unittest
from app import create_app
from models import db, Farm

class AfricanIntelligenceEndpointsTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

        # Ensure demo farm exists for tests
        with self.app.app_context():
            farm = Farm.query.get("farm-test-et")
            if not farm:
                farm = Farm(
                    id="farm-test-et",
                    name="Ethiopia Oromia Test Plot",
                    country_code="ET",
                    latitude=8.75,
                    longitude=38.98,
                    size=5.0
                )
                db.session.add(farm)
                db.session.commit()

    def test_farm_rainfall_endpoint(self):
        res = self.client.get("/api/farms/farm-test-et/rainfall")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("annual", data["data"])
        self.assertIn("monthlyData", data["data"])
        self.assertEqual(len(data["data"]["monthlyData"]), 12)
        self.assertIn("provenance", data["data"])
        self.assertEqual(data["data"]["provenance"]["dataset"], "CHIRPS 2.0 (Climate Hazards Center InfraRed Precipitation with Station data)")

    def test_farm_drought_endpoint(self):
        res = self.client.get("/api/farms/farm-test-et/drought")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("meteorologicalDrought", data["data"])
        self.assertIn("agriculturalDrought", data["data"])
        self.assertIn("spiValue", data["data"]["meteorologicalDrought"])
        self.assertIn("wmoClassification", data["data"]["meteorologicalDrought"])
        self.assertIn("distinctionStatement", data["data"])

    def test_farm_vegetation_endpoint(self):
        res = self.client.get("/api/farms/farm-test-et/vegetation")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("currentNdviIndex", data["data"])
        self.assertIn("aggregation", data["data"])
        self.assertIn("scientificDisclaimer", data["data"])
        self.assertIn("satelliteObservation", data["data"])

    def test_farm_seasonal_climate_endpoint(self):
        res = self.client.get("/api/farms/farm-test-et/climate/seasonal")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("seasonalPrecipitation", data["data"])
        self.assertIn("provenance", data["data"])

    def test_six_african_countries_intelligence_coverage(self):
        # 6 Representative African countries: ET, KE, NG, GH, SN, ZA
        test_profiles = [
            {"name": "Ethiopia (Highland Vertisol)", "lat": 8.75, "lon": 38.98, "region": "East Africa"},
            {"name": "Kenya (Rift Valley)", "lat": 0.02, "lon": 37.90, "region": "East Africa"},
            {"name": "Nigeria (Savanna/Forest)", "lat": 9.08, "lon": 8.67, "region": "West Africa"},
            {"name": "Ghana (Coastal/Forest)", "lat": 7.94, "lon": -1.02, "region": "West Africa"},
            {"name": "Senegal (Sahelian)", "lat": 14.49, "lon": -14.45, "region": "West Africa"},
            {"name": "South Africa (Highveld/Cape)", "lat": -30.55, "lon": 22.93, "region": "Southern Africa"}
        ]
        
        from services.chirps_service import chirps_service
        from services.drought_service import drought_service
        from services.vegetation_service import vegetation_service

        for profile in test_profiles:
            with self.subTest(country=profile["name"]):
                # 1. Rainfall
                rain = chirps_service.get_rainfall_analysis(profile["lat"], profile["lon"], 2024, profile["region"])
                self.assertIn("annual", rain)
                self.assertGreater(rain["annual"]["totalRainfallMm"], 0)

                # 2. Drought
                drought = drought_service.get_drought_assessment(profile["lat"], profile["lon"], 2024, profile["region"])
                self.assertIn("meteorologicalDrought", drought)
                self.assertIn("spiValue", drought["meteorologicalDrought"])

                # 3. Vegetation
                veg = vegetation_service.get_vegetation_analysis(profile["lat"], profile["lon"])
                self.assertIn("currentNdviIndex", veg)
                # Phase 3.6: currentNdviIndex is None when no pixels are available (PARTIAL/UNAVAILABLE)
                # It must NOT be a synthetic value; either a real float in [-1,1] or None
                self.assertIn("provenance", veg)
                self.assertIn("status", veg["provenance"])
                self.assertIn("isDemoData", veg)
                ndvi = veg["currentNdviIndex"]
                if ndvi is not None:
                    self.assertGreaterEqual(ndvi, -1.0)
                    self.assertLessEqual(ndvi, 1.0)
                # Validate status is one of the allowed provenance values
                self.assertIn(veg["provenance"]["status"],
                              ["LIVE", "PARTIAL", "UNAVAILABLE", "DEMONSTRATION", "CACHED"])

if __name__ == "__main__":
    unittest.main()

