import unittest
from app import create_app

class AfricanExpansionTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_all_54_sovereign_african_countries(self):
        res = self.client.get("/api/countries")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        countries = data["data"]
        self.assertEqual(len(countries), 54, "Must contain all 54 African sovereign nations")
        
        # Verify regions distribution
        regions = set(c.get("region") for c in countries)
        expected_regions = {"North Africa", "West Africa", "Central Africa", "East Africa", "Southern Africa"}
        self.assertTrue(expected_regions.issubset(regions))

        # Check essential fields for every country
        for c in countries:
            self.assertTrue(len(c.get("isoCode", "")) == 2)
            self.assertIn("administrativeLevels", c)
            self.assertGreater(len(c["administrativeLevels"]), 0)
            self.assertIn("currency", c)
            self.assertIn("measurementUnits", c)
            self.assertIn("supportStatus", c)
            self.assertIn("agriculturalSources", c)

    def test_country_filtering_by_region(self):
        res_west = self.client.get("/api/countries?region=West%20Africa")
        self.assertEqual(res_west.status_code, 200)
        self.assertEqual(len(res_west.get_json()["data"]), 16)

        res_north = self.client.get("/api/countries?region=North%20Africa")
        self.assertEqual(res_north.status_code, 200)
        self.assertEqual(len(res_north.get_json()["data"]), 6)

    def test_crop_catalog_expansion(self):
        res = self.client.get("/api/crops")
        self.assertEqual(res.status_code, 200)
        crops = res.get_json()["data"]
        self.assertGreaterEqual(len(crops), 19)

        # Check required crops
        expected_crop_ids = [
            "sorghum", "millet", "cassava", "rice", "common_bean", 
            "cowpea", "groundnut", "soybean", "yam", "sweet_potato", 
            "banana", "plantain", "cocoa", "coffee", "teff", "barley", "wheat", "maize"
        ]
        crop_id_set = set(c["id"] for c in crops)
        for expected in expected_crop_ids:
            self.assertIn(expected, crop_id_set, f"Crop {expected} must be in the expanded catalog")

        # Verify crop profile fields
        for c in crops:
            self.assertIn("scientificName", c)
            self.assertIn("waterRequirementsMm", c)
            self.assertIn("suitableTemperatureCelsius", c)
            self.assertIn("growingDurationDays", c)
            self.assertIn("rotationCompatibility", c)
            self.assertIn("nitrogenFixation", c)
            self.assertIn("references", c)
            self.assertIn("validationStatus", c)

    def test_crop_filtering_by_country_and_region(self):
        # Nigeria crops (Cassava, Yam, Cowpea, Cocoa, etc.)
        res_ng = self.client.get("/api/crops?country_code=NG")
        self.assertEqual(res_ng.status_code, 200)
        ng_crop_ids = set(c["id"] for c in res_ng.get_json()["data"])
        self.assertIn("yam", ng_crop_ids)
        self.assertIn("cassava", ng_crop_ids)
        self.assertIn("cowpea", ng_crop_ids)

        # West Africa region filter
        res_wa = self.client.get("/api/crops?region=West%20Africa")
        self.assertEqual(res_wa.status_code, 200)
        wa_crop_ids = set(c["id"] for c in res_wa.get_json()["data"])
        self.assertIn("cocoa", wa_crop_ids)
        self.assertIn("plantain", wa_crop_ids)

    def test_rotation_recommendations_african_contexts(self):
        # 1. Nigerian Yam belt: yam followed by cowpea
        payload_ng = {
            "latitude": 7.37,
            "longitude": 3.94,
            "countryCode": "NG",
            "currentCrop": "yam",
            "proposedCrops": ["cowpea"]
        }
        res_ng = self.client.post("/api/rotation/recommend", json=payload_ng)
        self.assertEqual(res_ng.status_code, 200)
        data_ng = res_ng.get_json()["data"]
        self.assertGreater(data_ng["overallScore"], 65)
        self.assertTrue(any("nitrogen" in h.lower() for h in data_ng["positiveHighlights"]))

        # 2. Senegalese Groundnut Basin: millet followed by groundnut
        payload_sn = {
            "latitude": 14.15,
            "longitude": -16.07,
            "countryCode": "SN",
            "currentCrop": "millet",
            "proposedCrops": ["groundnut"]
        }
        res_sn = self.client.post("/api/rotation/recommend", json=payload_sn)
        self.assertEqual(res_sn.status_code, 200)
        data_sn = res_sn.get_json()["data"]
        self.assertGreater(data_sn["overallScore"], 65)

        # 3. Ghanaian Cocoa Belt: cocoa agroforestry companion plantain
        payload_gh = {
            "latitude": 6.68,
            "longitude": -1.62,
            "countryCode": "GH",
            "currentCrop": "cocoa",
            "proposedCrops": ["plantain"]
        }
        res_gh = self.client.post("/api/rotation/recommend", json=payload_gh)
        self.assertEqual(res_gh.status_code, 200)
        data_gh = res_gh.get_json()["data"]
        self.assertIn("overallScore", data_gh)

if __name__ == "__main__":
    unittest.main()

