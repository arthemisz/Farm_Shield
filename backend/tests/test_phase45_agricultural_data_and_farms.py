import unittest
import json
from app import app
from models import db, Farm, FarmPlot

class TestPhase45AgriculturalDataAndFarms(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_get_all_54_countries(self):
        """Verify all 54 sovereign African countries exist with valid profiles."""
        res = self.client.get('/api/countries')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 54)
        for country in data['data']:
            self.assertIn('isoCode', country)
            self.assertIn('name', country)
            self.assertIn('flag', country)
            self.assertIn('capital', country)
            self.assertIn('region', country)
            self.assertIn(country.get('operationalStatus'), [
                'PILOT_OPERATIONAL', 'PARTIALLY_OPERATIONAL', 'DIRECTORY_ONLY', 'DATA_PENDING'
            ])

    def test_country_agriculture_endpoint(self):
        """Verify /api/countries/{code}/agriculture returns verified statistics and structure."""
        for code in ['ET', 'KE', 'NG', 'GH', 'ZA']:
            res = self.client.get(f'/api/countries/{code}/agriculture')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertTrue(data['success'])
            self.assertIn('country', data['data'])
            self.assertIn('agriculturalStatistics', data['data'])
            self.assertIn('waterProductivity', data['data'])
            self.assertIn('datasetAvailability', data['data'])

    def test_agricultural_layers_endpoint(self):
        """Verify /api/map/agricultural-layers lists all standard, satellite, terrain, and farm layers."""
        res = self.client.get('/api/map/agricultural-layers')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        layer_ids = [l['id'] for l in data['data']]
        self.assertIn('standard', layer_ids)
        self.assertIn('satellite', layer_ids)
        self.assertIn('terrain', layer_ids)
        self.assertIn('farm_boundaries', layer_ids)
        self.assertIn('soil_moisture_smap', layer_ids)
        self.assertIn('water_productivity_wapor', layer_ids)

    def test_farm_creation_with_polygon_and_crop_provenance(self):
        """Verify farm boundary polygon and crop provenance persist cleanly."""
        payload = {
            "name": "Arsi Precision Test Plot",
            "countryCode": "ET",
            "country": "Ethiopia",
            "adminLevel1": "Oromia",
            "adminLevel2": "Arsi",
            "latitude": 7.89,
            "longitude": 39.12,
            "size": 14.5,
            "currentCrop": "Malt Barley",
            "plantingDate": "2024-06-20",
            "growingSeason": "Meher 2024",
            "cropProvenance": "FIELD_VERIFIED",
            "boundaryGeoJson": {
                "type": "Polygon",
                "coordinates": [[[39.11, 7.88], [39.13, 7.88], [39.13, 7.90], [39.11, 7.90], [39.11, 7.88]]]
            }
        }
        res = self.client.post('/api/farms', json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        farm_id = data['data']['id']
        self.assertEqual(data['data']['cropProvenance'], 'FIELD_VERIFIED')
        self.assertIsNotNone(data['data']['boundaryGeoJson'])

        # Now test sub-plots API
        plot_payload = {
            "name": "Barley Plot A",
            "cropName": "Malt Barley",
            "areaHectares": 8.0,
            "plantingDate": "2024-06-20",
            "cropProvenance": "FIELD_VERIFIED"
        }
        p_res = self.client.post(f'/api/farms/{farm_id}/plots', json=plot_payload)
        self.assertEqual(p_res.status_code, 201)
        plot_data = p_res.get_json()
        self.assertEqual(plot_data['data']['cropName'], 'Malt Barley')

        # Clean up
        self.client.delete(f'/api/farms/{farm_id}')

    def test_unauthorized_farm_modification_guard(self):
        """Verify authorization guard protects private farm records."""
        # Create a farm owned by user-alpha
        payload = {
            "name": "Private Secured Farm",
            "countryCode": "KE",
            "latitude": -1.28,
            "longitude": 36.82,
            "size": 5.0,
            "ownerId": "user-alpha"
        }
        res = self.client.post('/api/farms', json=payload)
        self.assertEqual(res.status_code, 201)
        farm_id = res.get_json()['data']['id']

        # Attempt to modify as user-beta
        update_res = self.client.put(
            f'/api/farms/{farm_id}',
            json={"name": "Hacked Farm Name", "requestUserId": "user-beta"}
        )
        self.assertEqual(update_res.status_code, 403)

        # Cleanup
        self.client.delete(f'/api/farms/{farm_id}')

if __name__ == '__main__':
    unittest.main()

