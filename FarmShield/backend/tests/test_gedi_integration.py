"""
Regression tests for NASA GEDI L4A and L4B integration.

Verifies:
1. GEDI dataset records are seeded correctly with correct DOIs and status.
2. GEDI L4A and L4B environmental observations are stored with correct metadata.
3. /api/datasets/gedi/farm/<farm_id> endpoint returns correct structure.
4. /api/datasets/database-summary reflects GEDI observation counts.
5. Rejected sources (USGS, OpenET, USDA NAL) are correctly classified.
6. Scientific honesty: quality flags, provenance labels, footprint notices present.
"""

import unittest
import json
from app import create_app
from config import Config
from models import db


def _make_app():
    class TestConfig(Config):
        TESTING = True
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    return create_app(TestConfig)


def _seed_app(flask_app):
    with flask_app.app_context():
        db.create_all()
        from models import Farm
        if not Farm.query.first():
            db.session.add_all([
                Farm(id="farm-1", name="Bishoftu Demonstration Farm",
                     country_code="ET", latitude=8.75, longitude=38.98,
                     soil_type="Vertisol"),
                Farm(id="farm-2", name="Kulumsa Research Station",
                     country_code="ET", latitude=8.01, longitude=39.44,
                     soil_type="Cambisol"),
            ])
            db.session.commit()
        from services.scientific_data_ingestion_service import (
            seed_scientific_datasets, ingest_verified_ground_observations
        )
        seed_scientific_datasets()
        ingest_verified_ground_observations()


class TestGEDIDatasetSeeding(unittest.TestCase):
    """Tests that GEDI dataset records are correctly registered in the database."""

    @classmethod
    def setUpClass(cls):
        cls.flask_app = _make_app()
        _seed_app(cls.flask_app)

    def setUp(self):
        self.ctx = self.flask_app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_gedi_l4a_dataset_record_exists(self):
        from models import DatasetRecord
        rec = db.session.get(DatasetRecord, "nasa-gedi-l4a")
        self.assertIsNotNone(rec, "GEDI L4A dataset record must exist in DB")
        self.assertEqual(rec.doi, "10.3334/ORNLDAAC/2056")
        self.assertEqual(rec.status, "CACHED")
        self.assertEqual(rec.integration_status, "VERIFIED")
        self.assertIn("51.6", rec.geographic_coverage)

    def test_gedi_l4b_dataset_record_exists(self):
        from models import DatasetRecord
        rec = db.session.get(DatasetRecord, "nasa-gedi-l4b")
        self.assertIsNotNone(rec, "GEDI L4B dataset record must exist in DB")
        self.assertEqual(rec.doi, "10.3334/ORNLDAAC/2299")
        self.assertEqual(rec.status, "CACHED")
        self.assertEqual(rec.integration_status, "VERIFIED")
        self.assertIn("1km", rec.spatial_resolution)

    def test_gedi_l4a_variables_include_quality_flags(self):
        from models import DatasetRecord
        rec = db.session.get(DatasetRecord, "nasa-gedi-l4a")
        variables = json.loads(rec.variables)
        self.assertIn("agbd", variables)
        self.assertIn("agbd_se", variables)
        self.assertIn("l4_quality_flag", variables)
        self.assertIn("degrade_flag", variables)

    def test_gedi_l4b_variables_include_mu_se_cnt(self):
        from models import DatasetRecord
        rec = db.session.get(DatasetRecord, "nasa-gedi-l4b")
        variables = json.loads(rec.variables)
        self.assertIn("MU", variables)
        self.assertIn("SE", variables)
        self.assertIn("CNT", variables)

    def test_gedi_l4a_notes_describe_footprint_nature(self):
        from models import DatasetRecord
        rec = db.session.get(DatasetRecord, "nasa-gedi-l4a")
        # Notes explicitly state "not continuous raster" as a negative qualifier
        self.assertIn("footprint", rec.notes.lower())
        self.assertIn("not continuous raster", rec.notes.lower())

    def test_gedi_l4b_notes_distinguish_from_l4a(self):
        from models import DatasetRecord
        rec = db.session.get(DatasetRecord, "nasa-gedi-l4b")
        self.assertIn("L4A", rec.notes)
        self.assertIn("1km", rec.notes)


class TestRejectedSourceClassification(unittest.TestCase):
    """Tests that formally rejected data sources are correctly classified in the DB."""

    @classmethod
    def setUpClass(cls):
        cls.flask_app = _make_app()
        _seed_app(cls.flask_app)

    def setUp(self):
        self.ctx = self.flask_app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_usgs_water_data_unavailable_for_africa(self):
        from models import DatasetRecord
        rec = db.session.get(DatasetRecord, "usgs-water-data")
        self.assertIsNotNone(rec)
        self.assertEqual(rec.status, "UNAVAILABLE_FOR_AFRICA")
        self.assertEqual(rec.integration_status, "RESTRICTED_GEO")
        self.assertIn("United States", rec.geographic_coverage)

    def test_openet_unavailable_for_africa(self):
        from models import DatasetRecord
        rec = db.session.get(DatasetRecord, "openet-et")
        self.assertIsNotNone(rec)
        self.assertEqual(rec.status, "UNAVAILABLE_FOR_AFRICA")
        self.assertEqual(rec.integration_status, "RESTRICTED_GEO")
        # Critical: confirm no API key is exposed anywhere in the notes
        self.assertNotIn("sk-", rec.notes)
        self.assertNotIn("Bearer ", rec.notes)

    def test_usda_nal_dmp_not_a_data_source(self):
        from models import DatasetRecord
        rec = db.session.get(DatasetRecord, "usda-nal-dmp")
        self.assertIsNotNone(rec)
        self.assertEqual(rec.status, "NOT_A_DATA_SOURCE")
        self.assertEqual(rec.integration_status, "GOVERNANCE_REFERENCE")

    def test_no_rejected_source_observations_in_db(self):
        from models import EnvironmentalObservation
        for ds_id, label in [
            ("usgs-water-data", "USGS"),
            ("openet-et", "OpenET"),
            ("usda-nal-dmp", "USDA NAL"),
        ]:
            count = EnvironmentalObservation.query.filter_by(dataset_id=ds_id).count()
            self.assertEqual(count, 0, f"{label} must have zero observations in DB")


class TestGEDIObservations(unittest.TestCase):
    """Tests that GEDI observations are correctly stored with provenance metadata."""

    @classmethod
    def setUpClass(cls):
        cls.flask_app = _make_app()
        _seed_app(cls.flask_app)

    def setUp(self):
        self.ctx = self.flask_app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_gedi_l4a_observations_exist(self):
        from models import EnvironmentalObservation
        count = EnvironmentalObservation.query.filter_by(dataset_id="nasa-gedi-l4a").count()
        self.assertGreater(count, 0, "At least one GEDI L4A observation must be stored")

    def test_gedi_l4b_observations_exist(self):
        from models import EnvironmentalObservation
        count = EnvironmentalObservation.query.filter_by(dataset_id="nasa-gedi-l4b").count()
        self.assertGreater(count, 0, "At least one GEDI L4B observation must be stored")

    def test_gedi_l4a_agbd_has_valid_provenance(self):
        from models import EnvironmentalObservation
        obs = EnvironmentalObservation.query.filter_by(
            dataset_id="nasa-gedi-l4a", variable_name="agbd"
        ).first()
        self.assertIsNotNone(obs)
        self.assertEqual(obs.provenance, "LITERATURE_REFERENCE")
        self.assertEqual(obs.processing_level, "L4A")
        self.assertIn("l4_quality_flag", obs.quality_flag)
        self.assertEqual(obs.unit, "Mg/ha")

    def test_gedi_l4a_agbd_in_realistic_cropland_range(self):
        """AGBD for African cropland must be plausible: 10–300 Mg/ha."""
        from models import EnvironmentalObservation
        obs_list = EnvironmentalObservation.query.filter_by(
            dataset_id="nasa-gedi-l4a", variable_name="agbd"
        ).all()
        for obs in obs_list:
            self.assertGreater(obs.value, 10.0,
                               f"AGBD {obs.value} Mg/ha below minimum cropland value")
            self.assertLess(obs.value, 300.0,
                            f"AGBD {obs.value} Mg/ha exceeds maximum African forest value")

    def test_gedi_l4a_se_smaller_than_agbd(self):
        """Standard error (agbd_se) must be smaller than the mean AGBD."""
        from models import EnvironmentalObservation
        se_obs = EnvironmentalObservation.query.filter_by(
            dataset_id="nasa-gedi-l4a", variable_name="agbd_se"
        ).first()
        agbd_obs = EnvironmentalObservation.query.filter_by(
            dataset_id="nasa-gedi-l4a", variable_name="agbd"
        ).first()
        if se_obs and agbd_obs:
            self.assertLess(se_obs.value, agbd_obs.value,
                            "AGBD standard error must be less than mean AGBD")

    def test_gedi_l4a_metadata_includes_footprint_notice(self):
        from models import EnvironmentalObservation
        obs = EnvironmentalObservation.query.filter_by(
            dataset_id="nasa-gedi-l4a", variable_name="agbd"
        ).first()
        meta = json.loads(obs.metadata_json or "{}")
        self.assertIn("footprint", str(meta).lower())

    def test_gedi_l4b_mu_has_correct_processing_level(self):
        from models import EnvironmentalObservation
        obs = EnvironmentalObservation.query.filter_by(
            dataset_id="nasa-gedi-l4b", variable_name="MU"
        ).first()
        self.assertIsNotNone(obs)
        self.assertEqual(obs.processing_level, "L4B")
        self.assertIn("1km", obs.metadata_json)

    def test_gedi_l4b_doi_in_metadata(self):
        from models import EnvironmentalObservation
        obs = EnvironmentalObservation.query.filter_by(
            dataset_id="nasa-gedi-l4b", variable_name="MU"
        ).first()
        meta = json.loads(obs.metadata_json or "{}")
        self.assertIn("10.3334/ORNLDAAC/2299", meta.get("doi", ""))


class TestGEDIAPIEndpoint(unittest.TestCase):
    """Integration tests for the /api/datasets/gedi/farm/<farm_id> endpoint."""

    @classmethod
    def setUpClass(cls):
        cls.flask_app = _make_app()
        _seed_app(cls.flask_app)

    def setUp(self):
        self.client = self.flask_app.test_client()

    def test_gedi_endpoint_returns_200_for_valid_farm(self):
        r = self.client.get("/api/datasets/gedi/farm/farm-1")
        self.assertEqual(r.status_code, 200)

    def test_gedi_endpoint_returns_404_for_invalid_farm(self):
        r = self.client.get("/api/datasets/gedi/farm/farm-nonexistent-9999")
        self.assertEqual(r.status_code, 404)

    def test_gedi_response_has_l4a_and_l4b_with_correct_dois(self):
        r = self.client.get("/api/datasets/gedi/farm/farm-1")
        data = r.get_json()
        self.assertIn("l4a", data)
        self.assertIn("l4b", data)
        self.assertEqual(data["l4a"]["doi"], "10.3334/ORNLDAAC/2056")
        self.assertEqual(data["l4b"]["doi"], "10.3334/ORNLDAAC/2299")
        self.assertIn("product", data["l4a"])
        self.assertIn("gridResolution", data["l4b"])

    def test_gedi_coverage_notice_confirms_orbital_range(self):
        r = self.client.get("/api/datasets/gedi/farm/farm-1")
        data = r.get_json()
        coverage = data.get("gediCoverage", {})
        self.assertTrue(coverage.get("withinOrbitalRange"),
                        "Ethiopian farms (8–10°N) must be within GEDI 51.6°N orbital range")
        self.assertIn("notice", coverage)
        self.assertIn("footprint", coverage["notice"].lower())

    def test_gedi_response_has_scientific_limitations_mentioning_yield(self):
        r = self.client.get("/api/datasets/gedi/farm/farm-1")
        data = r.get_json()
        limitations = data.get("scientificLimitations", [])
        self.assertGreater(len(limitations), 0)
        self.assertTrue(
            any("yield" in lim.lower() for lim in limitations),
            "Limitations must explicitly state GEDI cannot measure crop yield"
        )

    def test_gedi_response_lists_all_three_rejected_sources(self):
        r = self.client.get("/api/datasets/gedi/farm/farm-1")
        data = r.get_json()
        rejected = data.get("rejectedSources", {})
        self.assertIn("usgs-water-data", rejected)
        self.assertIn("openet-et", rejected)
        self.assertIn("usda-nal-dmp", rejected)

    def test_all_l4a_observations_have_cached_provenance(self):
        r = self.client.get("/api/datasets/gedi/farm/farm-1")
        data = r.get_json()
        for obs in data.get("l4a", {}).get("observations", []):
            self.assertEqual(obs.get("provenance"), "LITERATURE_REFERENCE")

    def test_database_summary_shows_gedi_observation_counts(self):
        r = self.client.get("/api/datasets/database-summary")
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        datasets = data.get("datasets", {})
        self.assertIn("nasa-gedi-l4a", datasets)
        self.assertIn("nasa-gedi-l4b", datasets)
        self.assertGreater(datasets["nasa-gedi-l4a"]["observationCount"], 0)
        self.assertGreater(datasets["nasa-gedi-l4b"]["observationCount"], 0)

    def test_datasets_list_endpoint_includes_gedi(self):
        r = self.client.get("/api/datasets")
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        ids = [d["id"] for d in data.get("data", [])]
        self.assertIn("nasa-gedi-l4a", ids)
        self.assertIn("nasa-gedi-l4b", ids)


if __name__ == "__main__":
    unittest.main()
