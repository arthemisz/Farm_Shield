"""
Legacy SPI audit tests — updated for new _calculate_spi() signature.
_calculate_spi() now returns (spi_value, method_label, data_quality_label).
Tests marked [UNIT-MOCK]: all precipitation values are synthetic test fixtures.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.drought_service import drought_service


class SpiScientificAuditTestCase(unittest.TestCase):
    """
    [UNIT-MOCK] Formal scientific validation unit tests for the SPI implementation.
    These tests use fabricated data and are NOT live satellite or climate data tests.

    WMO-1095 reference:
    1. Normal rainfall conditions.
    2. Severe rainfall deficit.
    3. Extremely wet conditions.
    4. Zero precipitation edge case.
    5. Missing observations / Insufficient data rejection.
    """

    def test_normal_rainfall(self):
        """[UNIT-MOCK] 3-month rainfall matching baseline exactly → SPI near 0, Near Normal."""
        # observed == baseline over last 3 months
        observed = [100.0] * 12
        baseline = [100.0] * 12
        spi, method, quality = drought_service._calculate_spi(observed, baseline, window=3)
        self.assertAlmostEqual(spi, 0.0, places=1)
        classification = drought_service._classify_wmo_spi(spi)
        self.assertEqual(classification["category"], "Near Normal")

    def test_severe_rainfall_deficit(self):
        """[UNIT-MOCK] Last 3 months ~17% of baseline → SPI strongly negative (Drought)."""
        # Deficit must be in the LAST window months (SPI uses obs[-3:])
        observed = [100.0] * 9 + [15.0, 20.0, 15.0]
        baseline = [100.0] * 12
        spi, method, quality = drought_service._calculate_spi(observed, baseline, window=3)
        self.assertLess(spi, -1.0)
        classification = drought_service._classify_wmo_spi(spi)
        self.assertIn(classification["severity"], ["Mild Drought", "Severe Drought", "Extreme Drought"])

    def test_extremely_wet_conditions(self):
        """[UNIT-MOCK] Last 3 months 2.5x above baseline → SPI positive (Wet)."""
        observed = [100.0] * 9 + [250.0, 250.0, 250.0]
        baseline = [100.0] * 12
        spi, method, quality = drought_service._calculate_spi(observed, baseline, window=3)
        self.assertGreater(spi, 1.0)
        classification = drought_service._classify_wmo_spi(spi)
        self.assertIn(classification["category"], ["Moderately Wet", "Very Wet", "Extremely Wet"])

    def test_zero_precipitation_edge_case(self):
        """[UNIT-MOCK] Completely dry last 3 months against wet baseline → strong negative SPI."""
        observed = [0.0] * 12
        baseline = [80.0, 120.0, 100.0] * 4  # 12 values
        spi, method, quality = drought_service._calculate_spi(observed, baseline, window=3)
        self.assertLess(spi, -1.0)
        classification = drought_service._classify_wmo_spi(spi)
        self.assertIn(
            classification["severity"],
            ["Mild Drought", "Severe Drought", "Extreme Drought"]
        )

    def test_insufficient_data_rejection(self):
        """[UNIT-MOCK] Empty observations → quality label is INSUFFICIENT_DATA."""
        spi, method, quality = drought_service._calculate_spi([], [100.0] * 12, window=3)
        self.assertEqual(quality, "INSUFFICIENT_DATA")

    def test_drought_assessment_response_has_required_keys(self):
        """[UNIT-MOCK] get_drought_assessment() must return meteorologicalDrought with spiValue."""
        res = drought_service.get_drought_assessment(9.02, 38.74)
        self.assertIn("meteorologicalDrought", res)
        self.assertIn("spiValue", res["meteorologicalDrought"])
        self.assertIn("spiDataQuality", res["meteorologicalDrought"])

    def test_spi_data_quality_label_present(self):
        """[UNIT-MOCK] New spiDataQuality field must be present in response."""
        res = drought_service.get_drought_assessment(9.02, 38.74)
        quality = res["meteorologicalDrought"]["spiDataQuality"]
        # Quality must be one of the defined labels
        self.assertIn(quality, [
            "GAMMA_FITTED", "LINEAR_APPROXIMATION", "INSUFFICIENT_HISTORY",
            "INSUFFICIENT_DATA"
        ])


if __name__ == "__main__":
    unittest.main()
