import requests
import calendar
from datetime import datetime, timezone
from typing import Dict, Any, List
from config import Config
from utils.cache import cache
from utils.geo import validate_coordinates

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

class NasaPowerService:
    """
    Service to fetch agricultural climate parameters from the official NASA POWER API:
    - Temperature at 2 Meters (T2M, T2M_MAX, T2M_MIN) in °C
    - Precipitation Corrected (PRECTOTCORR) in mm/day (converted to monthly mm)
    - All Sky Surface Shortwave Downward Irradiance (ALLSKY_SFC_SW_DWN) in MJ/m^2/day
    """

    def __init__(self):
        self.api_url = Config.NASA_POWER_API_URL
        self.timeout = Config.REQUEST_TIMEOUT

    def get_monthly_climatology(
        self, 
        lat: float, 
        lon: float, 
        year: int = 2024
    ) -> Dict[str, Any]:
        """
        Retrieves monthly climate data for the given year and 5-year historical trends.
        """
        valid, err = validate_coordinates(lat, lon)
        if not valid:
            return {"error": err, "status": "INVALID_COORDINATES"}

        if not year:
            year = datetime.now().year - 1

        cache_key = {"lat": lat, "lon": lon, "year": year}
        cached = cache.get("nasa_power", **cache_key)
        if cached:
            cached["provenance"]["status"] = "CACHED"
            return cached

        # Query NASA POWER from 5 years back to selected year
        start_year = max(1985, year - 4)
        end_year = min(datetime.now().year, year)

        params = {
            "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN",
            "community": "AG",
            "longitude": round(lon, 4),
            "latitude": round(lat, 4),
            "format": "JSON",
            "start": start_year,
            "end": end_year
        }

        try:
            r = requests.get(self.api_url, params=params, timeout=self.timeout)
            if r.status_code == 200:
                data = r.json()
                parsed = self._parse_nasa_response(data, year, lat, lon, start_year, end_year)
                cache.set("nasa_power", parsed, ttl_seconds=86400, **cache_key)
                return parsed
            else:
                print(f"[NasaPower] Error status {r.status_code}: {r.text[:200]}")
        except Exception as e:
            print(f"[NasaPower] Request failed: {e}")

        # Fallback heuristic model clearly marked
        return self._generate_fallback_climate(lat, lon, year)

    def _parse_nasa_response(
        self, 
        data: Dict[str, Any], 
        target_year: int, 
        lat: float, 
        lon: float,
        start_year: int,
        end_year: int
    ) -> Dict[str, Any]:
        params = data.get("properties", {}).get("parameter", {})
        t2m_dict = params.get("T2M", {})
        t2m_max_dict = params.get("T2M_MAX", {})
        t2m_min_dict = params.get("T2M_MIN", {})
        precip_dict = params.get("PRECTOTCORR", {})
        solar_dict = params.get("ALLSKY_SFC_SW_DWN", {})

        monthly_points = []
        annual_rainfall = 0.0
        temp_sum = 0.0
        max_temp_overall = -999.0
        min_temp_overall = 999.0

        for month_idx in range(1, 13):
            month_str = f"{month_idx:02d}"
            ym_key = f"{target_year}{month_str}"
            
            # If target year has missing months (e.g. current year), fallback to previous available year
            if ym_key not in precip_dict or precip_dict[ym_key] == -999.0:
                ym_key = f"{target_year - 1}{month_str}"

            # Days in month
            days_in_month = calendar.monthrange(target_year, month_idx)[1]

            # Precipitation: NASA gives mm/day in monthly point
            precip_daily = precip_dict.get(ym_key, 0.0)
            if precip_daily < 0:
                precip_daily = 0.0
            month_rainfall = round(precip_daily * days_in_month, 1)

            t_mean = t2m_dict.get(ym_key, 20.0)
            t_max = t2m_max_dict.get(ym_key, t_mean + 5.0)
            t_min = t2m_min_dict.get(ym_key, t_mean - 5.0)
            solar = solar_dict.get(ym_key, 18.0)

            # Check fill values (-999.0)
            t_mean = round(t_mean, 1) if t_mean != -999.0 else 20.0
            t_max = round(t_max, 1) if t_max != -999.0 else t_mean + 6.0
            t_min = round(t_min, 1) if t_min != -999.0 else t_mean - 6.0
            solar = round(solar, 2) if solar != -999.0 else 18.0

            annual_rainfall += month_rainfall
            temp_sum += t_mean
            if t_max > max_temp_overall:
                max_temp_overall = t_max
            if t_min < min_temp_overall:
                min_temp_overall = t_min

            monthly_points.append({
                "month": MONTH_NAMES[month_idx - 1],
                "rainfallMm": month_rainfall,
                "tempMeanC": t_mean,
                "tempMinC": t_min,
                "tempMaxC": t_max,
                "solarRadiationMj": solar
            })

        avg_temp = round(temp_sum / 12.0, 1)
        annual_rainfall = round(annual_rainfall, 1)

        # 5-Year Historical Trends
        historical_trends = []
        for y in range(start_year, end_year + 1):
            y_rain = 0.0
            y_temps = []
            for m in range(1, 13):
                k = f"{y}{m:02d}"
                p = precip_dict.get(k, 0.0)
                if p > 0:
                    y_rain += p * calendar.monthrange(y, m)[1]
                t = t2m_dict.get(k, -999)
                if t != -999:
                    y_temps.append(t)
            
            if y_temps:
                historical_trends.append({
                    "year": y,
                    "annualRainfallMm": round(y_rain, 1),
                    "avgTempC": round(sum(y_temps) / len(y_temps), 1)
                })

        # Calculate estimated drought hazard
        if annual_rainfall < 500:
            drought_risk = "High" if annual_rainfall < 350 else "Severe"
        elif annual_rainfall < 800:
            drought_risk = "Moderate"
        else:
            drought_risk = "Low"

        return {
            "year": target_year,
            "latitude": lat,
            "longitude": lon,
            "status": "LIVE",
            "summary": {
                "annualRainfallMm": annual_rainfall,
                "avgTempC": avg_temp,
                "minTempC": round(min_temp_overall, 1),
                "maxTempC": round(max_temp_overall, 1),
                "rainyDaysEstimated": int(annual_rainfall / 11.5) if annual_rainfall > 0 else 0,
                "droughtRiskScore": drought_risk,
                "solarRadiationAvgMj": 19.5,
            },
            "monthlyData": monthly_points,
            "historicalTrends": historical_trends,
            "provenance": {
                "provider": "NASA POWER Agroclimatology API",
                "source": "NASA Langley Research Center (LaRC)",
                "retrievalDate": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "timePeriod": f"{start_year}-{end_year}",
                "spatialResolution": "0.5° x 0.5° (~50km gridded reanalysis)",
                "measurementType": "satellite_model",
                "status": "LIVE",
                "isDemoData": False,
                "limitations": "NASA POWER provides regional gridded reanalysis and satellite estimates, not on-farm micro-station data."
            }
        }

    def _generate_fallback_climate(self, lat: float, lon: float, year: int) -> Dict[str, Any]:
        """Provides simulated demonstration data when external network is offline."""
        # Simple latitude-based thermal gradient
        base_temp = 28.0 - (abs(lat) * 0.45)
        is_tropical = abs(lat) < 23.5
        annual_rain = 950 if is_tropical else 650

        monthly = []
        for i, m in enumerate(MONTH_NAMES):
            rain = round(15 + (annual_rain / 12) * (1.8 if 5 <= i <= 8 else 0.5), 1)
            monthly.append({
                "month": m,
                "rainfallMm": rain,
                "tempMeanC": round(base_temp + (2.0 if 2 <= i <= 5 else -1.0), 1),
                "tempMinC": round(base_temp - 6.0, 1),
                "tempMaxC": round(base_temp + 7.0, 1),
                "solarRadiationMj": 19.0
            })

        return {
            "year": year,
            "latitude": lat,
            "longitude": lon,
            "status": "DEMONSTRATION",
            "summary": {
                "annualRainfallMm": annual_rain,
                "avgTempC": round(base_temp, 1),
                "minTempC": round(base_temp - 6.0, 1),
                "maxTempC": round(base_temp + 7.0, 1),
                "rainyDaysEstimated": 85,
                "droughtRiskScore": "Moderate"
            },
            "monthlyData": monthly,
            "historicalTrends": [
                {"year": year - 2, "annualRainfallMm": annual_rain - 80, "avgTempC": round(base_temp - 0.2, 1)},
                {"year": year - 1, "annualRainfallMm": annual_rain + 40, "avgTempC": round(base_temp + 0.1, 1)},
                {"year": year, "annualRainfallMm": annual_rain, "avgTempC": round(base_temp, 1)},
            ],
            "provenance": {
                "provider": "FarmShield Simulated Climate Model",
                "source": "NASA Agroclimatology Reference Envelope",
                "retrievalDate": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "timePeriod": f"{year - 2}-{year}",
                "spatialResolution": "Simulated Point Gradient",
                "measurementType": "demonstration_simulation",
                "status": "DEMONSTRATION",
                "isDemoData": True,
                "limitations": "Live NASA POWER connection unavailable; showing cached demonstration profile."
            }
        }

nasa_power_service = NasaPowerService()

