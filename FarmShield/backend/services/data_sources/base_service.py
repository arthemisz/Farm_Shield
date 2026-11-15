"""
Base Data Source Adapter
=========================
Defines the standard interface, caching, retry, timeout, rate-limiting,
and response structure for all external agricultural and geospatial providers:
- CHIRPS (Precipitation)
- NASA POWER (Meteorology & Climatology)
- ISRIC SoilGrids 2.0 (Soil Physical & Chemical Properties)
- Copernicus Sentinel-2 Level-2A (Optical Satellite Imagery)
- FAOSTAT (National Agricultural Production & Yield Statistics)
- Regional Crop Calendars & Agronomic Extension Knowledge
"""

import time
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import requests

from config import Config
from utils.cache import cache

logger = logging.getLogger("FarmShield.DataSources")

# Permitted provenance status codes across FarmShield
STATUS_LIVE = "LIVE"
STATUS_CACHED = "CACHED"
STATUS_PARTIAL = "PARTIAL"
STATUS_DEMONSTRATION = "DEMONSTRATION"
STATUS_UNAVAILABLE = "UNAVAILABLE"

class BaseDataSource:
    """Abstract base class for all FarmShield external data provider adapters."""

    def __init__(self, source_id: str, source_name: str, provider: str, default_ttl_hours: int = 24):
        self.source_id = source_id
        self.source_name = source_name
        self.provider = provider
        self.timeout = Config.REQUEST_TIMEOUT
        self.default_ttl_seconds = default_ttl_hours * 3600

    def make_request(
        self,
        url: str,
        method: str = "GET",
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        max_retries: int = 2,
        backoff_factor: float = 1.0,
        stream: bool = False
    ) -> Optional[requests.Response]:
        """
        Executes an HTTP request with exponential backoff retries,
        rate-limit handling (429), timeout guards, and clean error logging.
        """
        req_headers = {
            "User-Agent": "FarmShield-AgriIntelligence/1.0 (Africa-First Agricultural Platform)"
        }
        if headers:
            req_headers.update(headers)

        for attempt in range(max_retries + 1):
            try:
                if method.upper() == "POST":
                    r = requests.post(url, json=json_data, params=params, headers=req_headers, timeout=self.timeout, stream=stream)
                else:
                    r = requests.get(url, params=params, headers=req_headers, timeout=self.timeout, stream=stream)

                if r.status_code == 200 or (stream and r.status_code == 206):
                    return r
                elif r.status_code == 429:
                    # Rate limited: wait with exponential backoff
                    wait_time = backoff_factor * (2 ** attempt)
                    logger.warning(f"[{self.source_id}] Rate-limited (429) on {url}. Backing off {wait_time}s.")
                    time.sleep(wait_time)
                elif r.status_code in [500, 502, 503, 504]:
                    wait_time = backoff_factor * (2 ** attempt)
                    logger.warning(f"[{self.source_id}] Server error ({r.status_code}) on {url}. Retrying in {wait_time}s.")
                    time.sleep(wait_time)
                else:
                    logger.info(f"[{self.source_id}] HTTP {r.status_code} for {url}: {r.text[:120]}")
                    return r
            except requests.exceptions.Timeout:
                logger.warning(f"[{self.source_id}] Timeout connecting to {url} (attempt {attempt + 1}/{max_retries + 1})")
                if attempt < max_retries:
                    time.sleep(backoff_factor * (attempt + 1))
            except requests.exceptions.RequestException as e:
                logger.warning(f"[{self.source_id}] Connection error for {url}: {e}")
                if attempt < max_retries:
                    time.sleep(backoff_factor * (attempt + 1))
            except Exception as e:
                logger.error(f"[{self.source_id}] Unexpected error during request to {url}: {e}")
                break

        return None

    def build_provenance(
        self,
        dataset: str,
        status: str,
        is_demo: bool = False,
        observation_start: Optional[str] = None,
        observation_end: Optional[str] = None,
        spatial_resolution: Optional[str] = None,
        temporal_resolution: Optional[str] = None,
        units: Optional[str] = None,
        missing_data: Optional[str] = None,
        limitations: Optional[str] = None,
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """Constructs standardized provenance metadata required across all datasets."""
        return {
            "source": self.source_name,
            "provider": self.provider,
            "dataset": dataset,
            "status": status,
            "isDemoData": is_demo,
            "retrievalTimestamp": datetime.now(timezone.utc).isoformat(),
            "observationStart": observation_start,
            "observationEnd": observation_end,
            "spatialResolution": spatial_resolution,
            "temporalResolution": temporal_resolution,
            "units": units,
            "missingData": missing_data,
            "limitations": limitations,
            "error": error
        }

