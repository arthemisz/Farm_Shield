import unittest
import json
import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import app

class SmapSoilMoistureTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()

    def test_smap_moisture_endpoint(self):
        """Verify GET /api/soil/moisture calculates volumetric moisture and pedotransfer limits."""
        resp = self.client.get("/api/soil/moisture?lat=9.02&lon=38.74&crop=Teff")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertTrue(data.get("success"))
        res = data.get("data", {})
        
        # Verify SMAP parameters
        smap = res.get("smapObservations", {})
        self.assertIn("surfaceMoisture_0_5cm", smap)
        self.assertIn("rootZoneMoisture_0_100cm", smap)
        self.assertGreater(smap["surfaceMoisture_0_5cm"], 0)
        self.assertGreater(smap["rootZoneMoisture_0_100cm"], 0)

        # Verify Hydraulic limits
        hyd = res.get("hydraulicLimits", {})
        self.assertIn("permanentWiltingPointVolumetric", hyd)
        self.assertIn("fieldCapacityVolumetric", hyd)
        self.assertIn("totalAvailableWaterCapacity", hyd)
        self.assertGreater(hyd["fieldCapacityVolumetric"], hyd["permanentWiltingPointVolumetric"])

        # Verify Agronomic stress assessment
        status = res.get("agronomicMoistureStatus", {})
        self.assertIn("stressLevel", status)
        self.assertIn("irrigationDeficitMm", status)
        self.assertIn("actionRecommended", status)

        # Verify Provenance
        prov = res.get("provenance", {})
        self.assertIn("NASA", prov.get("dataSource", ""))
        self.assertIn("USDA", prov.get("repositoryStandard", ""))

    def test_country_divisions_endpoint(self):
        """Verify GET /api/countries/<code>/divisions returns valid city and sub-city breakdowns."""
        for code in ["ET", "KE", "NG", "GH", "ZA", "EG", "MA"]:
            resp = self.client.get(f"/api/countries/{code}/divisions")
            self.assertEqual(resp.status_code, 200, f"Failed for {code}")
            data = json.loads(resp.data)
            self.assertTrue(data.get("success"))
            div_data = data.get("data", {})
            self.assertIn("cities", div_data)
            self.assertGreater(len(div_data["cities"]), 0)

if __name__ == "__main__":
    unittest.main()

