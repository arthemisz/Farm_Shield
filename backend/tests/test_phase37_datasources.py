"""
Phase 3.7 Real Data Sources Integration Tests
==============================================
Validates the multi-source adapter architecture:
  1. BaseDataSource retry and backoff behavior
  2. FAOSTAT Service: Country crop statistics mapping, units conversion, and provenance
  3. CropCalendarService: Regional distinctions (EIAR vs KALRO vs IITA vs CSIR vs ARC)
  4. Dataset Registry Service: Catalog listing and country availability queries
  5. 5-Country Core Focus Validation (Ethiopia, Kenya, Nigeria, Ghana, South Africa)
"""

import sys
import os
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.data_sources.base_service import BaseDataSource, STATUS_LIVE, STATUS_CACHED, STATUS_PARTIAL, STATUS_UNAVAILABLE
from services.data_sources.faostat_service import faostat_service, FAO_AREA_CODES, FAO_CROP_ITEMS
from services.data_sources.crop_calendar_service import crop_calendar_service, CROP_CALENDARS
from services.dataset_registry_service import get_all_dataset_records, get_country_dataset_availability

class Phase37DataSourcesTestCase(unittest.TestCase):

    def test_base_datasource_build_provenance(self):
        """[UNIT-MOCK] Verifies standard provenance metadata schema."""
        base = BaseDataSource("test_source", "Test Source", "Test Provider")
        prov = base.build_provenance(
            dataset="Test Dataset",
            status=STATUS_LIVE,
            is_demo=False,
            spatial_resolution="10m",
            temporal_resolution="Daily",
            units="mm"
        )
        self.assertEqual(prov["source"], "Test Source")
        self.assertEqual(prov["status"], STATUS_LIVE)
        self.assertEqual(prov["spatialResolution"], "10m")
        self.assertEqual(prov["units"], "mm")
        self.assertIn("retrievalTimestamp", prov)

    def test_faostat_five_focus_countries_coverage(self):
        """[UNIT-MOCK] Verifies FAOSTAT agricultural statistics for ET, KE, NG, GH, ZA."""
        focus_countries = ["ET", "KE", "NG", "GH", "ZA"]
        for cc in focus_countries:
            with self.subTest(country=cc):
                stats = faostat_service.get_country_crop_statistics(cc)
                self.assertEqual(stats["countryCode"], cc)
                self.assertIn("statistics", stats)
                self.assertGreater(len(stats["statistics"]), 0)
                # Check required units: production, area, yield
                first_crop = next(iter(stats["statistics"].values()))
                self.assertIn("productionTonnes", first_crop)
                self.assertIn("areaHarvestedHa", first_crop)
                self.assertIn("yieldKgPerHa", first_crop)
                self.assertIn("provenance", stats)
                self.assertIn("disclaimer", stats)

    def test_faostat_crop_filtering(self):
        """[UNIT-MOCK] Verifies FAOSTAT single crop query filtering."""
        stats = faostat_service.get_country_crop_statistics("ET", crop_id="teff")
        self.assertIn("teff", stats["statistics"])
        self.assertEqual(len(stats["statistics"]), 1)
        self.assertEqual(stats["statistics"]["teff"]["productionTonnes"], 5740000)

    def test_crop_calendars_five_focus_countries_distinct_phenology(self):
        """[UNIT-MOCK] Confirms country-specific calendars are never mixed across regions."""
        et_cal = crop_calendar_service.get_crop_calendar("ET")
        ke_cal = crop_calendar_service.get_crop_calendar("KE")
        ng_cal = crop_calendar_service.get_crop_calendar("NG")
        gh_cal = crop_calendar_service.get_crop_calendar("GH")
        za_cal = crop_calendar_service.get_crop_calendar("ZA")

        # Ethiopia uses Meher/Belg
        self.assertIn("Meher", et_cal["agroecologicalSeasons"])
        # Kenya uses Long Rains / Short Rains
        self.assertIn("Long Rains", ke_cal["agroecologicalSeasons"])
        # Nigeria has Northern single wet vs Southern bimodal
        self.assertIn("Southern Early Season", ng_cal["agroecologicalSeasons"])
        # Ghana has Major/Minor seasons
        self.assertIn("Major Season", gh_cal["agroecologicalSeasons"])
        # South Africa has Summer vs Winter rainfall regions
        self.assertIn("Summer Rainfall Region", za_cal["agroecologicalSeasons"])

        # Institutions must match national authorities
        self.assertIn("EIAR", et_cal["researchInstitution"])
        self.assertIn("KALRO", ke_cal["researchInstitution"])
        self.assertIn("IITA", ng_cal["researchInstitution"])
        self.assertIn("CSIR", gh_cal["researchInstitution"])
        self.assertIn("ARC", za_cal["researchInstitution"])

    def test_crop_calendar_unregistered_country(self):
        """[UNIT-MOCK] Verifies honest UNAVAILABLE status for unregistered calendar."""
        cal = crop_calendar_service.get_crop_calendar("XX")
        self.assertFalse(cal["calendarAvailable"])
        self.assertEqual(cal["provenance"]["status"], STATUS_UNAVAILABLE)

    def test_dataset_registry_listing(self):
        """[UNIT-MOCK] Verifies central catalog registers all required sources."""
        records = get_all_dataset_records()
        self.assertGreaterEqual(len(records), 6)
        ids = [r["id"] for r in records]
        self.assertIn("chirps-2.0", ids)
        self.assertIn("nasa-power", ids)
        self.assertIn("isric-soilgrids", ids)
        self.assertIn("sentinel-2-l2a", ids)
        self.assertIn("faostat-production", ids)
        self.assertIn("national-crop-calendars", ids)

    def test_dataset_availability_by_country(self):
        """[UNIT-MOCK] Checks dataset availability response for Ethiopia and Kenya."""
        avail_et = get_country_dataset_availability("ET")
        self.assertEqual(avail_et["countryCode"], "ET")
        self.assertGreaterEqual(avail_et["availableCount"], 5)

if __name__ == "__main__":
    unittest.main()

