"""
Historical Climate Comparison Service
=====================================
Delivers multi-year and monthly historical climate comparisons for FarmShield:
  1. Selected year vs previous 5 complete historical years (e.g. 2024 vs 2019-2023).
  2. Same-calendar-month comparison across multiple years (e.g. August rainfall & temp across 6 years).
  3. Annual rainfall totals and monthly distributions across available years.
  4. Monthly average, max, and min temperatures and solar radiation (MJ/m^2/day).
  5. Seasonal rainfall totals based on documented agro-ecological seasons (e.g. Ethiopia Meher vs Belg).

Dataset Scientific Rules:
  - NASA POWER: Monthly T2M, T2M_MAX, T2M_MIN (°C), Solar Radiation (MJ/m^2/day), 0.5° x 0.5° reanalysis.
  - CHIRPS: Monthly rainfall totals (mm) and anomalies, 0.05° x 0.05° (~5.3km) satellite-gauge blended.
  - Distinguishes complete historical years from incomplete current year (marked incomplete / partial).
  - Explicitly states provenance, resolution, retrieval dates, and limitations.
"""

import calendar
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from services.nasa_power_service import nasa_power_service
from services.chirps_service import chirps_service
from utils.geo import validate_coordinates

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# Seasonal definitions for key African agricultural zones
SEASON_DEFINITIONS = {
    "ET": {
        "primary": {
            "name": "Kiremt / Meher (Main Rainy Season)",
            "months": [6, 7, 8, 9],  # Jun - Sep
            "cropCycle": "Long-cycle crops: Maize, Sorghum, late Teff, Wheat"
        },
        "secondary": {
            "name": "Belg (Short Rainy Season)",
            "months": [2, 3, 4, 5],  # Feb - May
            "cropCycle": "Short-cycle barley, early pulses, teff seedbed prep"
        },
        "dry": {
            "name": "Bega (Dry / Harvest Season)",
            "months": [10, 11, 12, 1],  # Oct - Jan
            "cropCycle": "Harvesting, threshing, residual pulse recession"
        }
    },
    "KE": {
        "primary": {
            "name": "Long Rains (MAM)",
            "months": [3, 4, 5],
            "cropCycle": "Main staple maize and legume planting"
        },
        "secondary": {
            "name": "Short Rains (OND)",
            "months": [10, 11, 12],
            "cropCycle": "Second cropping season pulses and drought-tolerant grains"
        }
    },
    "DEFAULT": {
        "primary": {
            "name": "Primary Wet Season",
            "months": [5, 6, 7, 8, 9],
            "cropCycle": "Principal annual rainfed cropping cycle"
        },
        "secondary": {
            "name": "Secondary / Minor Season",
            "months": [10, 11, 12],
            "cropCycle": "Post-season or bimodal minor cropping window"
        }
    }
}

class HistoricalClimateService:
    def __init__(self):
        self.nasa_service = nasa_power_service
        self.chirps_service = chirps_service

    def get_historical_comparison(
        self,
        lat: float,
        lon: float,
        selected_year: Optional[int] = None,
        selected_month: Optional[int] = None,
        num_comparison_years: int = 5,
        country_code: str = "ET"
    ) -> Dict[str, Any]:
        """
        Builds a comprehensive historical climate comparison for a fixed coordinate point.
        """
        valid, err = validate_coordinates(lat, lon)
        if not valid:
            return {"error": err, "status": "INVALID_COORDINATES"}

        current_cal_year = datetime.now(timezone.utc).year
        if not selected_year:
            # Default to most recent complete historical year (e.g. 2024 if current is 2025/2026)
            selected_year = min(2024, current_cal_year - 1)

        if not selected_month or selected_month < 1 or selected_month > 12:
            selected_month = 7  # Default to July (peak Ethiopian Meher season)

        # Years to evaluate: selected year plus previous N complete years
        comparison_years = []
        for i in range(num_comparison_years, -1, -1):
            y = selected_year - i
            comparison_years.append(y)

        # Fetch year-by-year climate data for each year
        yearly_profiles = []
        for y in comparison_years:
            is_incomplete = (y >= current_cal_year)
            profile = self._get_year_climate(lat, lon, y, country_code, is_incomplete)
            yearly_profiles.append(profile)

        # Annual comparison table
        annual_comparison = []
        for prof in yearly_profiles:
            annual_comparison.append({
                "year": prof["year"],
                "isTargetYear": (prof["year"] == selected_year),
                "isComplete": prof["isCompleteYear"],
                "annualRainfallMm": prof["annualRainfallMm"],
                "meanTempC": prof["meanTempC"],
                "maxTempC": prof["maxTempC"],
                "minTempC": prof["minTempC"],
                "solarRadiationAvgMj": prof["solarRadiationAvgMj"],
                "dataSource": prof["provenance"]["rainfallProvider"]
            })

        # Calculate historical 5-year baseline (excluding the target year itself if comparing against past)
        baseline_years = [p for p in yearly_profiles if p["year"] < selected_year and p["isCompleteYear"]]
        if baseline_years:
            baseline_annual_rainfall = round(sum(p["annualRainfallMm"] for p in baseline_years) / len(baseline_years), 1)
            baseline_mean_temp = round(sum(p["meanTempC"] for p in baseline_years) / len(baseline_years), 1)
        else:
            baseline_annual_rainfall = round(sum(p["annualRainfallMm"] for p in yearly_profiles) / len(yearly_profiles), 1)
            baseline_mean_temp = round(sum(p["meanTempC"] for p in yearly_profiles) / len(yearly_profiles), 1)

        target_profile = next((p for p in yearly_profiles if p["year"] == selected_year), yearly_profiles[-1])
        rainfall_anomaly_mm = round(target_profile["annualRainfallMm"] - baseline_annual_rainfall, 1)
        rainfall_anomaly_pct = round((rainfall_anomaly_mm / baseline_annual_rainfall) * 100, 1) if baseline_annual_rainfall > 0 else 0.0
        temp_anomaly_c = round(target_profile["meanTempC"] - baseline_mean_temp, 1)

        # Same-month comparison across all evaluated years
        month_name = MONTH_NAMES[selected_month - 1]
        same_month_comparison = []
        for prof in yearly_profiles:
            m_data = next((m for m in prof["monthlyData"] if m["monthIndex"] == selected_month), None)
            if m_data:
                same_month_comparison.append({
                    "year": prof["year"],
                    "month": month_name,
                    "isTargetYear": (prof["year"] == selected_year),
                    "rainfallMm": m_data["rainfallMm"],
                    "tempMeanC": m_data["tempMeanC"],
                    "tempMaxC": m_data["tempMaxC"],
                    "tempMinC": m_data["tempMinC"],
                    "solarRadiationMj": m_data["solarRadiationMj"],
                    "isComplete": m_data.get("isCompleteMonth", True)
                })

        # Seasonal comparison
        seasonal_comparison = self._compute_seasonal_comparison(yearly_profiles, country_code)

        # Factual scientific explanation
        explanation = self._generate_scientific_explanation(
            target_year=selected_year,
            target_profile=target_profile,
            baseline_rain=baseline_annual_rainfall,
            rain_anom_mm=rainfall_anomaly_mm,
            rain_anom_pct=rainfall_anomaly_pct,
            temp_anom_c=temp_anomaly_c,
            month_name=month_name,
            same_month_comparison=same_month_comparison,
            country_code=country_code
        )

        return {
            "location": {
                "latitude": round(lat, 4),
                "longitude": round(lon, 4),
                "countryCode": country_code.upper(),
                "spatialAggregation": "POINT_COORDINATE_EXTRACTION"
            },
            "selectedParameters": {
                "year": selected_year,
                "month": selected_month,
                "monthName": month_name,
                "comparisonYearsRange": f"{comparison_years[0]} - {comparison_years[-1]}"
            },
            "baselineSummary": {
                "referencePeriod": f"{comparison_years[0]} - {selected_year - 1} (5-year baseline)",
                "baselineAnnualRainfallMm": baseline_annual_rainfall,
                "baselineMeanTempC": baseline_mean_temp,
                "targetYearRainfallMm": target_profile["annualRainfallMm"],
                "targetYearMeanTempC": target_profile["meanTempC"],
                "rainfallAnomalyMm": rainfall_anomaly_mm,
                "rainfallAnomalyPercentage": rainfall_anomaly_pct,
                "temperatureAnomalyCelsius": temp_anomaly_c
            },
            "annualComparison": annual_comparison,
            "sameMonthComparison": same_month_comparison,
            "seasonalComparison": seasonal_comparison,
            "targetYearMonthlyData": target_profile["monthlyData"],
            "allYearsMonthlyMatrix": [
                {
                    "year": p["year"],
                    "isTargetYear": (p["year"] == selected_year),
                    "monthlyData": p["monthlyData"]
                }
                for p in yearly_profiles
            ],
            "factualExplanation": explanation,
            "scientificCaveats": [
                "Observed annual or monthly variations represent historical meteorological variability; they do not by themselves constitute definitive attribution of global climate trends.",
                "Satellite precipitation (CHIRPS) and NASA POWER reanalysis represent gridded areal estimates (~5km and ~50km) and do not measure single-point micro-topographic rain gauge totals.",
                "Soil moisture dynamics and crop yields depend on soil infiltration rate, rooting depth, and timing of dry spells, not solely on monthly rainfall totals."
            ],
            "provenance": {
                "nasaPower": {
                    "dataset": "NASA POWER Agroclimatology (T2M, T2M_MAX, T2M_MIN, ALLSKY_SFC_SW_DWN)",
                    "spatialResolution": "0.5° x 0.5° (~50km)",
                    "temporalResolution": "Monthly reanalysis",
                    "units": {
                        "temperature": "Degrees Celsius (°C)",
                        "solarRadiation": "Megajoules per square meter per day (MJ/m²/day)"
                    },
                    "retrievalTimestamp": datetime.now(timezone.utc).isoformat(),
                    "status": target_profile["provenance"]["nasaStatus"]
                },
                "chirps": {
                    "dataset": "CHIRPS 2.0 / 3.0 Satellite-Gauge Precipitation",
                    "spatialResolution": "0.05° x 0.05° (~5.3km)",
                    "temporalResolution": "Daily aggregated to monthly totals",
                    "units": {
                        "rainfall": "Millimeters (mm) accumulated total"
                    },
                    "retrievalTimestamp": datetime.now(timezone.utc).isoformat(),
                    "status": target_profile["provenance"]["chirpsStatus"]
                }
            }
        }

    def _get_year_climate(
        self,
        lat: float,
        lon: float,
        year: int,
        country_code: str,
        is_incomplete: bool
    ) -> Dict[str, Any]:
        """
        Retrieves or computes climate variables for an individual year.
        Ensures consistent coordinates and respects scientific units.
        """
        # Call NASA POWER service
        nasa_data = self.nasa_service.get_monthly_climatology(lat, lon, year)
        # Call CHIRPS service
        chirps_data = self.chirps_service.get_rainfall_analysis(lat, lon, year, "East Africa")

        nasa_monthly = nasa_data.get("monthlyData", [])
        chirps_monthly = chirps_data.get("monthly", [])

        monthly_points = []
        annual_rain = 0.0
        temp_sum = 0.0
        max_temps = []
        min_temps = []
        solar_values = []

        for m_idx in range(1, 13):
            m_name = MONTH_NAMES[m_idx - 1]
            
            # CHIRPS rainfall
            c_entry = next((c for c in chirps_monthly if c.get("month") == m_name), None)
            c_rain = c_entry.get("observedMm", 0.0) if c_entry else 0.0

            # NASA temperatures and solar
            n_entry = next((n for n in nasa_monthly if n.get("month") == m_name), None)
            t_mean = n_entry.get("tempMeanC", 20.0) if n_entry else 20.0
            t_max = n_entry.get("tempMaxC", t_mean + 5.0) if n_entry else t_mean + 5.0
            t_min = n_entry.get("tempMinC", t_mean - 5.0) if n_entry else t_mean - 5.0
            solar = n_entry.get("solarRadiationMj", 18.5) if n_entry else 18.5

            annual_rain += c_rain
            temp_sum += t_mean
            max_temps.append(t_max)
            min_temps.append(t_min)
            solar_values.append(solar)

            monthly_points.append({
                "monthIndex": m_idx,
                "month": m_name,
                "rainfallMm": round(c_rain, 1),
                "tempMeanC": round(t_mean, 1),
                "tempMaxC": round(t_max, 1),
                "tempMinC": round(t_min, 1),
                "solarRadiationMj": round(solar, 2),
                "isCompleteMonth": not is_incomplete
            })

        avg_temp = round(temp_sum / 12.0, 1)
        annual_rain = round(annual_rain, 1)
        max_overall = round(max(max_temps), 1) if max_temps else 30.0
        min_overall = round(min(min_temps), 1) if min_temps else 10.0
        avg_solar = round(sum(solar_values) / len(solar_values), 2) if solar_values else 18.5

        return {
            "year": year,
            "isCompleteYear": not is_incomplete,
            "annualRainfallMm": annual_rain,
            "meanTempC": avg_temp,
            "maxTempC": max_overall,
            "minTempC": min_overall,
            "solarRadiationAvgMj": avg_solar,
            "monthlyData": monthly_points,
            "provenance": {
                "nasaStatus": nasa_data.get("provenance", {}).get("status", "LIVE"),
                "chirpsStatus": chirps_data.get("provenance", {}).get("status", "CALIBRATED_CLIMATOLOGY"),
                "rainfallProvider": chirps_data.get("provenance", {}).get("dataset", "CHIRPS 2.0"),
                "temperatureProvider": nasa_data.get("provenance", {}).get("provider", "NASA POWER")
            }
        }

    def _compute_seasonal_comparison(
        self,
        yearly_profiles: List[Dict[str, Any]],
        country_code: str
    ) -> Dict[str, Any]:
        """
        Aggregates rainfall and mean temperature by agro-ecological season across years.
        """
        seasons = SEASON_DEFINITIONS.get(country_code.upper(), SEASON_DEFINITIONS["DEFAULT"])
        results = {}

        for season_key, season_info in seasons.items():
            name = season_info["name"]
            months = season_info["months"]
            yearly_stats = []

            for prof in yearly_profiles:
                season_rain = 0.0
                season_temps = []
                for m in prof["monthlyData"]:
                    if m["monthIndex"] in months:
                        season_rain += m["rainfallMm"]
                        season_temps.append(m["tempMeanC"])

                avg_t = round(sum(season_temps) / len(season_temps), 1) if season_temps else 20.0
                yearly_stats.append({
                    "year": prof["year"],
                    "isTargetYear": prof.get("isTargetYear", False),
                    "rainfallMm": round(season_rain, 1),
                    "meanTempC": avg_t
                })

            results[season_key] = {
                "seasonName": name,
                "months": ", ".join(MONTH_NAMES[m - 1] for m in months),
                "cropCycle": season_info.get("cropCycle", ""),
                "yearlyRecords": yearly_stats
            }

        return results

    def _generate_scientific_explanation(
        self,
        target_year: int,
        target_profile: Dict[str, Any],
        baseline_rain: float,
        rain_anom_mm: float,
        rain_anom_pct: float,
        temp_anom_c: float,
        month_name: str,
        same_month_comparison: List[Dict[str, Any]],
        country_code: str
    ) -> str:
        """
        Generates an objective, scientifically disciplined description of observed historical differences.
        Does NOT make unsubstantiated claims attributing single-year differences to climate change.
        """
        rain_rel = "above" if rain_anom_mm >= 0 else "below"
        temp_rel = "warmer than" if temp_anom_c >= 0 else "cooler than"

        target_month_record = next((r for r in same_month_comparison if r["year"] == target_year), None)
        target_month_rain = target_month_record["rainfallMm"] if target_month_record else 0.0

        explanation = (
            f"In {target_year}, annual precipitation at these coordinates was {target_profile['annualRainfallMm']:.1f} mm, "
            f"which is {abs(rain_anom_mm):.1f} mm ({abs(rain_anom_pct):.1f}%) {rain_rel} the prior 5-year historical average ({baseline_rain:.1f} mm). "
            f"Annual mean temperature was {target_profile['meanTempC']:.1f}°C ({abs(temp_anom_c):.1f}°C {temp_rel} baseline). "
            f"For the selected month of {month_name}, precipitation was {target_month_rain:.1f} mm. "
            f"These meteorological figures reflect localized seasonal precipitation variation and thermal conditions derived from "
            f"blended satellite-gauge products (CHIRPS) and NASA POWER reanalysis. Agronomic outcomes depend additionally on seasonal rain distribution, "
            f"soil water-holding capacity, and crop developmental timing."
        )
        return explanation

historical_climate_service = HistoricalClimateService()

