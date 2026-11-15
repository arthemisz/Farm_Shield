import unittest
from unittest.mock import patch, MagicMock
from services.openet_service import OpenETService, CONUS_BOUNDS


class TestOpenETService(unittest.TestCase):
    def setUp(self):
        self.service_no_key = OpenETService(api_key="")
        self.service_with_key = OpenETService(api_key="test_mock_openet_key_12345")

    def test_missing_api_key_configuration(self):
        """Service identifies missing API key properly."""
        self.assertFalse(self.service_no_key.is_configured())
        self.assertTrue(self.service_with_key.is_configured())

    def test_coordinate_validation(self):
        """Service properly rejects non-numeric or out-of-range coordinates."""
        valid, _ = OpenETService.validate_coordinates(8.7523, 38.9841)
        self.assertTrue(valid)

        invalid_lat, err = OpenETService.validate_coordinates(95.0, 38.9841)
        self.assertFalse(invalid_lat)
        self.assertIn("Latitude", err)

        invalid_lon, err = OpenETService.validate_coordinates(8.7523, 200.0)
        self.assertFalse(invalid_lon)
        self.assertIn("Longitude", err)

    def test_african_locations_strictly_out_of_coverage(self):
        """All 6 requested African locations return OUT_OF_COVERAGE and UNAVAILABLE."""
        african_coords = [
            ("Bishoftu, Ethiopia", 8.7523, 38.9841),
            ("Arsi, Ethiopia", 7.8500, 39.1000),
            ("Nairobi, Kenya", -1.2921, 36.8219),
            ("Ibadan, Nigeria", 7.3775, 3.9470),
            ("Accra, Ghana", 5.6037, -0.1870),
            ("Johannesburg, South Africa", -26.2041, 28.0473),
        ]
        for name, lat, lon in african_coords:
            res = self.service_with_key.get_point_evapotranspiration(lat, lon)
            self.assertFalse(res["success"], f"Failed for {name}")
            self.assertEqual(res["status"], "OUT_OF_COVERAGE")
            self.assertEqual(res["provenanceStatus"], "UNAVAILABLE")
            self.assertIn("Conterminous United States", res["error"])
            self.assertIsNone(res["data"])

    def test_conus_location_detects_missing_key(self):
        """In CONUS, missing key returns CONFIGURATION_REQUIRED."""
        # California Central Valley coordinates
        res = self.service_no_key.get_point_evapotranspiration(36.7468, -119.7726)
        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "CONFIGURATION_REQUIRED")
        self.assertEqual(res["provenanceStatus"], "UNAVAILABLE")

    @patch("requests.post")
    def test_conus_successful_retrieval(self, mock_post):
        """In CONUS with key, valid API response preserves units and returns LIVE status."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"time": "2023-01-01", "et": 24.5},
            {"time": "2023-02-01", "et": 32.1}
        ]
        mock_post.return_value = mock_response

        res = self.service_with_key.get_point_evapotranspiration(36.7468, -119.7726)
        self.assertTrue(res["success"])
        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["provenanceStatus"], "LIVE")
        self.assertEqual(res["units"], "mm")
        self.assertEqual(len(res["data"]), 2)

    @patch("requests.post")
    def test_api_authentication_failure(self, mock_post):
        """401/403 status returns AUTHENTICATION_FAILED with UNAVAILABLE."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_post.return_value = mock_response

        res = self.service_with_key.get_point_evapotranspiration(36.7468, -119.7726)
        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "AUTHENTICATION_FAILED")
        self.assertEqual(res["provenanceStatus"], "UNAVAILABLE")

    @patch("requests.post")
    def test_api_timeout_handling(self, mock_post):
        """Timeout exception is cleanly caught and reported as TIMEOUT."""
        import requests
        mock_post.side_effect = requests.exceptions.Timeout("Connection timed out")

        res = self.service_with_key.get_point_evapotranspiration(36.7468, -119.7726)
        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "TIMEOUT")
        self.assertEqual(res["provenanceStatus"], "UNAVAILABLE")


if __name__ == "__main__":
    unittest.main()

