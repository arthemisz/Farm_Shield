import unittest
from services.historical_climate_service import historical_climate_service

class TestHistoricalClimateService(unittest.TestCase):
    def test_historical_comparison_structure(self):
        """Validates that historical comparison returns required multi-year aggregations and provenance."""
        res = historical_climate_service.get_historical_comparison(
            lat=8.7523,
            lon=38.9841,
            selected_year=2024,
            selected_month=7,
            num_comparison_years=5,
            country_code="ET"
        )
        self.assertIn("location", res)
        self.assertIn("baselineSummary", res)
        self.assertIn("annualComparison", res)
        self.assertIn("sameMonthComparison", res)
        self.assertIn("seasonalComparison", res)
        self.assertIn("factualExplanation", res)
        self.assertIn("provenance", res)

        # Verify annual count: selected year + 5 comparison years = 6
        self.assertEqual(len(res["annualComparison"]), 6)
        self.assertEqual(len(res["sameMonthComparison"]), 6)

        # Verify seasonal keys for Ethiopia (Kiremt/Meher, Belg, Bega)
        seasonal = res["seasonalComparison"]
        self.assertIn("primary", seasonal)
        self.assertIn("secondary", seasonal)
        self.assertIn("Kiremt", seasonal["primary"]["seasonName"])

        # Check provenance details
        prov = res["provenance"]
        self.assertIn("nasaPower", prov)
        self.assertIn("chirps", prov)
        self.assertEqual(prov["nasaPower"]["units"]["temperature"], "Degrees Celsius (°C)")
        self.assertEqual(prov["chirps"]["units"]["rainfall"], "Millimeters (mm) accumulated total")

    def test_invalid_coordinates(self):
        """Verifies coordinates validation."""
        res = historical_climate_service.get_historical_comparison(
            lat=999.0,
            lon=38.0
        )
        self.assertIn("error", res)

if __name__ == "__main__":
    unittest.main()

