"""
Drought Monitoring Service — SPI-3 and SPI-6 with Gamma Distribution Fitting
===============================================================================
Implements transparent, rainfall-based drought indicators following:
  World Meteorological Organization. (2012). Standardized Precipitation Index
  User Guide (WMO-No. 1095). Geneva: WMO.

SPI Methodology (McKee et al. 1993 / WMO-1095):
  1. Accumulate monthly precipitation over the target window (3 or 6 months).
  2. For each ending calendar month separately, fit a Gamma probability
     distribution to the historical accumulation series.
  3. Handle zero-precipitation months using the mixed (Zuo et al.) approach:
       q  = P(X = 0) estimated from observed zero-count fraction
       G(x) = Gamma CDF for x > 0
       H(x) = q + (1 - q) * G(x)   (probability of non-exceedance)
  4. Transform H(x) through the standard normal inverse CDF → SPI value.

Limitations disclosed explicitly in every response:
  - Baseline is REGIONAL_CLIMATOLOGY_NORMALS, not per-pixel CHIRPS climatology.
    True WMO-compliant SPI requires >= 30 years of pixel-level observations.
  - When only 12 months of regional baseline data are available, the Gamma
    fit is performed on that single annual cycle (n=1 per ending month), which
    is scientifically insufficient for a full distribution fit. In that case,
    the service falls back to a linear proportional anomaly clearly labelled
    APPROXIMATION, and sets spiDataQuality = "INSUFFICIENT_HISTORY".
  - This system uses one baseline year, not the 30-year minimum recommended
    by WMO. SPI values must be interpreted as directional rainfall anomaly
    indicators, not statistically calibrated SPI.
"""

import math
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

try:
    from scipy import stats as _scipy_stats
    _SCIPY_AVAILABLE = True
except ImportError:
    _SCIPY_AVAILABLE = False

from services.chirps_service import chirps_service
from utils.geo import validate_coordinates


# ---------------------------------------------------------------------------
# Minimum number of historical accumulation samples required per calendar month
# for a Gamma distribution fit to be meaningful. WMO recommends >= 30 years.
# Our regional normals provide n=1, so we always fall into APPROXIMATION mode
# unless a future data connector provides a multi-year historical series.
# ---------------------------------------------------------------------------
MIN_HISTORICAL_SAMPLES = 5


class DroughtMonitoringService:
    """
    Transparent Rainfall-Based Drought Indicator Service.

    Implements:
      1. Standardized Precipitation Index (SPI-3 and SPI-6) using Gamma
         distribution fitting where sufficient data exists, or a clearly
         labelled linear proportional anomaly where it does not.
      2. Rainfall Anomaly Index.
      3. Consecutive dry month estimation.
      4. Explicit distinction between meteorological drought (SPI) and
         agricultural soil-moisture drought.
    """

    def get_drought_assessment(
        self,
        lat: float,
        lon: float,
        year: Optional[int] = None,
        region: str = "East Africa",
    ) -> Dict[str, Any]:
        valid, err = validate_coordinates(lat, lon)
        if not valid:
            return {"error": err, "status": "INVALID_COORDINATES"}

        rainfall_data = chirps_service.get_rainfall_analysis(lat, lon, year, region)
        monthly_data = rainfall_data.get("monthlyData", [])

        if not monthly_data:
            return {
                "status": "INSUFFICIENT_DATA",
                "message": (
                    "Insufficient precipitation history to compute "
                    "Standardized Precipitation Index."
                ),
            }

        observed_totals = [m["observedRainfallMm"] for m in monthly_data]
        baseline_normals = [m["baselineNormalMm"] for m in monthly_data]

        # Compute SPI with the Gamma method (or linear approximation fallback)
        spi_3, spi_3_method, spi_3_quality = self._calculate_spi(
            observed_totals, baseline_normals, window=3
        )
        spi_6, spi_6_method, spi_6_quality = self._calculate_spi(
            observed_totals, baseline_normals, window=6
        )

        # Consecutive dry months (months < 25 mm)
        max_cdd = 0
        cur_cdd = 0
        for val in observed_totals:
            if val < 25.0:
                cur_cdd += 1
                max_cdd = max(max_cdd, cur_cdd)
            else:
                cur_cdd = 0

        meteo_class = self._classify_wmo_spi(spi_3)

        # Agricultural drought risk
        agri_risk = "Low"
        agri_notes = "Rainfall in preceding 90-day window is within normal agronomical requirements."
        if spi_3 <= -1.5 or max_cdd >= 2:
            agri_risk = "Severe"
            agri_notes = (
                "Critical root-zone moisture deficit likely during active growth stages. "
                "Supplemental irrigation advised."
            )
        elif spi_3 <= -1.0 or max_cdd == 1:
            agri_risk = "Moderate"
            agri_notes = (
                "Mild to moderate moisture stress. Consider moisture retention mulching "
                "and drought-hardy crop choices."
            )

        # Determine overall methodology label
        scipy_used = _SCIPY_AVAILABLE and "GAMMA" in spi_3_method
        methodology_note = (
            "Gamma distribution fitted per ending calendar month using scipy.stats.gamma. "
            if scipy_used else
            "Linear proportional anomaly (sigma approximation). "
            "Gamma distribution not fitted due to insufficient historical data depth (n < 5 per month). "
        ) + (
            "IMPORTANT: Baseline is a single-year regional normal, not a 30-year per-pixel CHIRPS "
            "climatology. SPI values indicate rainfall direction and magnitude relative to the regional "
            "normal but are NOT statistically calibrated SPI in the full McKee et al. (1993) sense."
        )

        return {
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "region": region,
            "assessmentYear": rainfall_data.get("year"),
            "meteorologicalDrought": {
                "indexName": "Standardized Precipitation Index (SPI-3)",
                "timescale": "3-Month Cumulative (Short-term soil moisture)",
                "spiValue": spi_3,
                "spiDataQuality": spi_3_quality,
                "spiMethod": spi_3_method,
                "wmoClassification": meteo_class["category"],
                "severityLevel": meteo_class["severity"],
                "description": meteo_class["description"],
                "secondaryIndex": {
                    "indexName": "SPI-6 (Seasonal/Medium-term)",
                    "spiValue": spi_6,
                    "spiDataQuality": spi_6_quality,
                    "spiMethod": spi_6_method,
                    "wmoClassification": self._classify_wmo_spi(spi_6)["category"],
                },
            },
            "agriculturalDrought": {
                "riskLevel": agri_risk,
                "maxConsecutiveDryMonths": max_cdd,
                "interpretation": agri_notes,
                "advisoryRecommendation": (
                    "Select drought-tolerant crop varieties (e.g., Sorghum, Pearl Millet, Cowpea) "
                    "if planning plantings under negative SPI conditions."
                ),
            },
            "distinctionStatement": (
                "IMPORTANT: Meteorological drought describes atmospheric precipitation deficiency (SPI). "
                "Agricultural drought incorporates soil water retention, plant evapotranspiration demand, "
                "and crop growth stages. An SPI deficiency does not automatically guarantee total crop "
                "failure if soil holds residual moisture or irrigation is available."
            ),
            "methodology": {
                "wmoStandardReference": "World Meteorological Organization (WMO-No. 1095, 2012)",
                "baselinePeriod": "Regional 1981-2010 CHIRPS climatological normal (5-zone average)",
                "baselineLimitation": (
                    "Single-year regional normal. WMO requires >= 30 years of pixel-level data "
                    "for a fully calibrated SPI. Upgrade path: integrate per-pixel CHIRPS "
                    "monthly raster climatology (available from CHC UCSB)."
                ),
                "spiFormula": "SPI = Phi^-1( H(x) ) where H(x) = q + (1-q)*G(x), G ~ Gamma(alpha, beta)",
                "scipyAvailable": _SCIPY_AVAILABLE,
                "methodologyNote": methodology_note,
                "thresholds": {
                    ">= 2.0": "Extremely wet",
                    "1.5 to 1.99": "Very wet",
                    "1.0 to 1.49": "Moderately wet",
                    "-0.99 to 0.99": "Near normal",
                    "-1.0 to -1.49": "Moderately dry (Mild Drought)",
                    "-1.5 to -1.99": "Severely dry (Severe Drought)",
                    "<= -2.0": "Extremely dry (Extreme Drought)",
                },
            },
            "provenance": {
                "primaryInput": "CHIRPS 2.0 Precipitation Baseline (regional normals)",
                "provider": "Climate Hazards Center UCSB & WMO Drought Monitoring Guidelines",
                "status": rainfall_data.get("provenance", {}).get("status", "LIVE"),
                "isDemoData": rainfall_data.get("provenance", {}).get("isDemoData", False),
                "calculationTimestamp": datetime.now(timezone.utc).isoformat(),
            },
        }

    # ------------------------------------------------------------------
    # SPI Computation
    # ------------------------------------------------------------------

    def _calculate_spi(
        self,
        observed_monthly: List[float],
        baseline_monthly: List[float],
        window: int = 3,
    ) -> Tuple[float, str, str]:
        """
        Calculate SPI for the most recent `window`-month accumulation.

        Returns: (spi_value, method_label, data_quality_label)

        Method selection:
          1. GAMMA_SCIPY — if scipy is available AND we have >= MIN_HISTORICAL_SAMPLES
             accumulation values per ending calendar month. Because our baseline
             is a single-year regional normal, we simulate the historical distribution
             by treating each of the 12 baseline months as one sample. For the
             ending month of the current window, we have exactly 1 historical value.
             This is ALWAYS below MIN_HISTORICAL_SAMPLES=5, so we always fall through.
          2. LINEAR_APPROXIMATION — when historical depth < MIN_HISTORICAL_SAMPLES.
             Uses sigma derived from the spread of the baseline window values
             (std dev of the 12-month normals scaled to the window). Clearly labelled.
        """
        if len(observed_monthly) < window or len(baseline_monthly) < window:
            return 0.0, "INSUFFICIENT_DATA", "INSUFFICIENT_DATA"

        obs_window = observed_monthly[-window:]
        base_window = baseline_monthly[-window:]

        obs_sum = sum(obs_window)
        base_sum = sum(base_window)

        # Attempt proper Gamma-distribution SPI if scipy and enough history
        # For this implementation, we have n=1 historical sample per ending month
        # (single-year regional baseline), which is always < MIN_HISTORICAL_SAMPLES.
        # We provide the Gamma path anyway, ready to activate when a multi-year
        # historical series is passed in through chirps_service.
        historical_accumulations = self._build_historical_accumulations(
            baseline_monthly, window
        )

        if _SCIPY_AVAILABLE and len(historical_accumulations) >= MIN_HISTORICAL_SAMPLES:
            spi, method = self._spi_gamma(obs_sum, historical_accumulations)
            quality = "GAMMA_FITTED" if method == "GAMMA_SCIPY" else "LINEAR_APPROXIMATION"
            return round(spi, 2), method, quality

        # Fallback: linear proportional anomaly
        spi, method = self._spi_linear_approximation(obs_sum, base_window, baseline_monthly)
        return round(spi, 2), method, "INSUFFICIENT_HISTORY"

    def _build_historical_accumulations(
        self, baseline_monthly: List[float], window: int
    ) -> List[float]:
        """
        Build the list of historical rolling accumulations for the ending month.
        With a single-year baseline, this yields exactly one value.
        A proper implementation would receive multiple years of monthly data.
        """
        if len(baseline_monthly) < window:
            return []
        # Single year: only one accumulation window available
        return [sum(baseline_monthly[-window:])]

    def _spi_gamma(
        self, obs_sum: float, historical_accumulations: List[float]
    ) -> Tuple[float, str]:
        """
        Fit a Gamma distribution to historical accumulations and compute SPI.
        Handles zero-precipitation months using the mixed distribution approach
        (Thom 1958 / WMO-1095 Section 2.3).

        Returns (spi_value, method_label).
        """
        try:
            from scipy import stats

            n = len(historical_accumulations)
            zeros = [v for v in historical_accumulations if v == 0.0]
            nonzero = [v for v in historical_accumulations if v > 0.0]

            q = len(zeros) / n  # zero-precipitation probability

            if len(nonzero) < 2:
                # Cannot fit Gamma distribution with fewer than 2 non-zero samples
                return self._spi_linear_approximation_from_sum(
                    obs_sum, historical_accumulations
                ) + ("LINEAR_APPROXIMATION_FEW_NONZERO",)

            # Fit Gamma distribution to non-zero values
            # scipy.stats.gamma uses (a=shape, loc=0, scale=1/rate)
            alpha, loc, beta = stats.gamma.fit(nonzero, floc=0)

            # Cumulative probability H(x) with zero-inflation
            if obs_sum == 0.0:
                h = q
            else:
                g_cdf = stats.gamma.cdf(obs_sum, a=alpha, loc=loc, scale=beta)
                h = q + (1.0 - q) * g_cdf

            # Clamp to avoid norm.ppf(-inf) or ppf(+inf)
            h = max(0.0001, min(0.9999, h))
            spi = float(stats.norm.ppf(h))
            return spi, "GAMMA_SCIPY"

        except Exception as e:
            # Gamma fit failed; fall back
            return (
                self._spi_linear_approximation_from_sum(obs_sum, historical_accumulations),
                f"LINEAR_APPROXIMATION_GAMMA_FAILED:{type(e).__name__}",
            )

    def _spi_linear_approximation(
        self,
        obs_sum: float,
        base_window: List[float],
        full_baseline: List[float],
    ) -> Tuple[float, str]:
        """
        Linear proportional anomaly (sigma approximation).
        sigma is estimated as the standard deviation of the 12-month regional
        baseline values, scaled to the accumulation window length.
        This is NOT true SPI but provides a directionally meaningful indicator.
        Clearly labelled as an approximation in all responses.
        """
        base_sum = sum(base_window)

        # Estimate sigma from spread of full 12-month baseline
        mean_12 = sum(full_baseline) / len(full_baseline) if full_baseline else base_sum
        variance_12 = (
            sum((v - mean_12) ** 2 for v in full_baseline) / len(full_baseline)
            if len(full_baseline) > 1 else 0.0
        )
        sigma_monthly = math.sqrt(variance_12)

        # Scale sigma to window and enforce minimum floor
        sigma = max(15.0, sigma_monthly * math.sqrt(len(base_window)))

        spi = (obs_sum - base_sum) / sigma
        return spi, "LINEAR_APPROXIMATION"

    def _spi_linear_approximation_from_sum(
        self, obs_sum: float, historical_accumulations: List[float]
    ) -> float:
        base_sum = (
            sum(historical_accumulations) / len(historical_accumulations)
            if historical_accumulations else obs_sum
        )
        sigma = max(15.0, base_sum * 0.30)
        return (obs_sum - base_sum) / sigma

    def _classify_wmo_spi(self, spi: float) -> Dict[str, str]:
        """Classify drought using WMO-No. 1095 standard SPI thresholds."""
        if spi >= 2.0:
            return {"category": "Extremely Wet", "severity": "None", "description": "Abundant water surplus."}
        elif spi >= 1.5:
            return {"category": "Very Wet", "severity": "None", "description": "Significant positive rainfall anomaly."}
        elif spi >= 1.0:
            return {"category": "Moderately Wet", "severity": "None", "description": "Above-average moisture conditions."}
        elif spi > -1.0:
            return {"category": "Near Normal", "severity": "Normal", "description": "Rainfall within typical historical variance."}
        elif spi > -1.5:
            return {"category": "Moderately Dry", "severity": "Mild Drought", "description": "Moderate precipitation shortfall; monitor shallow-root crops."}
        elif spi > -2.0:
            return {"category": "Severely Dry", "severity": "Severe Drought", "description": "Substantial rainfall deficit; soil water deficit expected."}
        else:
            return {"category": "Extremely Dry", "severity": "Extreme Drought", "description": "Critical moisture deficit across entire cropping calendar."}


drought_service = DroughtMonitoringService()
