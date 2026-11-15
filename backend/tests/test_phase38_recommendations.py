"""
Phase 3.8 Recommendation Engine & Data Quality Unit Tests
==========================================================
Tests:
  1. FarmDataQualityService: completeness, freshness, resolution, and readiness level
  2. ExplainableRecommendationEngine: multi-factor suitability scoring
  3. Five-Country Robustness: ET, KE, NG, GH, ZA agricultural profiles
  4. Incomplete data resilience: missing rainfall, missing soil, unsupported crops
  5. Explainable rotation planning: botanical family break & legume nitrogen benefit
"""

import sys
import os
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.farm_data_quality_service import farm_data_quality_service
from services.explainable_recommendation_engine import explainable_recommendation_engine

class Phase38RecommendationTestCase(unittest.TestCase):

    def test_data_quality_evaluation_high_fidelity(self):
        """[UNIT-MOCK] Evaluates complete telemetry resulting in HIGH_FIDELITY_OBSERVATIONAL."""
        res = farm_data_quality_service.evaluate_farm_data_quality(
            climate_data={"provenance": {"status": "LIVE"}},
            soil_data={"provenance": {"status": "LIVE"}},
            rainfall_data={"provenance": {"status": "LIVE"}},
            vegetation_data={"currentNdviIndex": 0.65, "provenance": {"status": "LIVE"}},
            drought_data={"provenance": {"status": "LIVE"}, "meteorologicalDrought": {"spiDataQuality": "GAMMA_FITTED"}},
            crop_calendar_data={"calendarAvailable": True, "provenance": {"status": "LIVE"}},
            faostat_data={"provenance": {"status": "LIVE"}}
        )
        self.assertEqual(res["readinessLevel"], "HIGH_FIDELITY_OBSERVATIONAL")
        self.assertTrue(res["summaryMetrics"]["hasRealSatelliteNdvi"])
        self.assertEqual(len(res["missingDomains"]), 0)

    def test_data_quality_missing_domains_flagged(self):
        """[UNIT-MOCK] Flags missing soil and rainfall as incomplete without arbitrary score."""
        res = farm_data_quality_service.evaluate_farm_data_quality(
            climate_data={"provenance": {"status": "LIVE"}},
            soil_data={"provenance": {"status": "UNAVAILABLE"}},
            rainfall_data={"provenance": {"status": "UNAVAILABLE"}},
            vegetation_data={"currentNdviIndex": None, "provenance": {"status": "PARTIAL"}},
            drought_data={"provenance": {"status": "LIVE"}},
            crop_calendar_data={"calendarAvailable": True, "provenance": {"status": "LIVE"}},
            faostat_data={"provenance": {"status": "LIVE"}}
        )
        self.assertIn("Precipitation & Rainfall Anomalies", res["missingDomains"])
        self.assertIn("Soil Edaphic Baseline", res["missingDomains"])
        self.assertFalse(res["summaryMetrics"]["hasRealSatelliteNdvi"])

    def test_recommendation_engine_five_countries(self):
        """[UNIT-MOCK] Validates explainable recommendations across ET, KE, NG, GH, ZA."""
        test_farms = [
            {"countryCode": "ET", "latitude": 8.75, "longitude": 38.98, "name": "Bishoftu Farm", "currentCrop": "teff"},
            {"countryCode": "KE", "latitude": -0.30, "longitude": 36.06, "name": "Nakuru Farm", "currentCrop": "maize"},
            {"countryCode": "NG", "latitude": 7.37, "longitude": 3.94, "name": "Ibadan Farm", "currentCrop": "cassava"},
            {"countryCode": "GH", "latitude": 6.69, "longitude": -1.62, "name": "Kumasi Farm", "currentCrop": "cocoa"},
            {"countryCode": "ZA", "latitude": -26.71, "longitude": 27.10, "name": "Potchefstroom Farm", "currentCrop": "maize"}
        ]

        for farm in test_farms:
            with self.subTest(country=farm["countryCode"]):
                recs = explainable_recommendation_engine.get_crop_recommendations(farm, top_k=3)
                self.assertIn("recommendations", recs)
                self.assertGreater(len(recs["recommendations"]), 0)
                first_rec = recs["recommendations"][0]
                self.assertIn("cropId", first_rec)
                self.assertIn("overallScore", first_rec)
                self.assertIn("confidenceLevel", first_rec)
                self.assertIn("suggestedPlantingWindow", first_rec)
                self.assertIn("supportingObservations", first_rec)
                self.assertIn("identifiedRisks", first_rec)
                self.assertIn("environmentalProfile", recs)

    def test_rotation_engine_legume_nitrogen_break(self):
        """[UNIT-MOCK] Validates legume break benefit over repetitive monoculture."""
        farm_data = {"countryCode": "ET", "latitude": 8.75, "longitude": 38.98}
        
        # Legume rotation: Teff -> Common Bean
        legume_rot = explainable_recommendation_engine.evaluate_crop_rotation(farm_data, "teff", ["common_bean"])
        self.assertGreaterEqual(legume_rot["factors"]["nutrientManagement"], 80)
        self.assertIn("Highly Recommended", legume_rot["overallAssessment"])
        
        # Monoculture repetition: Teff -> Teff
        mono_rot = explainable_recommendation_engine.evaluate_crop_rotation(farm_data, "teff", ["teff"])
        self.assertLess(mono_rot["overallScore"], legume_rot["overallScore"])
        self.assertTrue(any("Continuous cultivation" in r or "same botanical family" in r for r in mono_rot["potentialRisks"]))

    def test_incomplete_data_graceful_handling(self):
        """[UNIT-MOCK] Verifies engine does not crash and flags missing data when services offline."""
        farm_data = {"countryCode": "ET", "latitude": 9.0, "longitude": 38.7}
        with patch.object(explainable_recommendation_engine.nasa_service, "get_monthly_climatology", return_value={"provenance": {"status": "UNAVAILABLE"}, "summary": {}}):
            with patch.object(explainable_recommendation_engine.soil_service, "get_soil_properties", return_value={"provenance": {"status": "UNAVAILABLE"}}):
                recs = explainable_recommendation_engine.get_crop_recommendations(farm_data)
                self.assertIn("recommendations", recs)
                self.assertGreater(len(recs["missingInformation"]), 0)

if __name__ == "__main__":
    unittest.main()

