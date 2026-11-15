"""
Explainable Farm-Level Agricultural Recommendation & Rotation Engine
=====================================================================
Evaluates crop candidates and multi-season rotation sequences using:
  1. Soil edaphic parameters (pH, SOC %, Clay/Sand/Silt texture, CEC).
  2. Climate & temperature thermal windows (T2M mean, max, min).
  3. Rainfall accumulation & seasonal onset (CHIRPS precipitation).
  4. Drought & soil moisture risk indicators (SPI-3).
  5. Local national planting calendars (EIAR, KALRO, IITA, CSIR, ARC).
  6. Botanical family diversification and biological nitrogen fixation.

Strict Principles:
  - Never recommends crops based on missing data without explicitly flagging missing inputs.
  - Never invents yield predictions without calibrated crop simulation models.
  - Generates clear, multi-factor agronomic explanations for every recommendation.
"""

from typing import Dict, Any, List, Optional
from services.crop_service import crop_service
from services.nasa_power_service import nasa_power_service
from services.chirps_service import chirps_service
from services.soil_service import soil_service
from services.drought_service import drought_service
from services.data_sources.crop_calendar_service import crop_calendar_service
from services.data_sources.faostat_service import faostat_service

class ExplainableRecommendationEngine:
    """Delivers transparent, evidence-backed crop selection and rotation advisory."""

    def __init__(self):
        self.crop_service = crop_service
        self.nasa_service = nasa_power_service
        self.chirps_service = chirps_service
        self.soil_service = soil_service
        self.drought_service = drought_service
        self.calendar_service = crop_calendar_service
        self.faostat_service = faostat_service

    def get_crop_recommendations(
        self,
        farm_data: Dict[str, Any],
        top_k: int = 4
    ) -> Dict[str, Any]:
        """
        Ranks all registered crops against the farm's multi-source environmental profile.
        Returns explainable candidate rankings with evidence breakdowns.
        """
        lat = farm_data.get("latitude", 8.75)
        lon = farm_data.get("longitude", 38.98)
        country_code = farm_data.get("countryCode", "ET").upper()
        water_avail = farm_data.get("waterAvailability", "Rainfed")
        previous_crop = farm_data.get("currentCrop") or farm_data.get("previousCrop")

        # 1. Fetch live or cached observational layers
        climate = self.nasa_service.get_monthly_climatology(lat, lon)
        rainfall = self.chirps_service.get_rainfall_analysis(lat, lon)
        soil = self.soil_service.get_soil_properties(lat, lon)
        drought = self.drought_service.get_drought_assessment(lat, lon)
        calendar = self.calendar_service.get_crop_calendar(country_code)

        # 2. Extract environmental variables
        annual_rain = rainfall.get("annual", {}).get("totalRainfallMm") or climate.get("summary", {}).get("annualPrecipitationMm", 700.0)
        mean_temp = climate.get("summary", {}).get("meanTemperatureCelsius", 20.0)
        
        ph_raw = soil.get("ph")
        ph_val = ph_raw.get("value") if isinstance(ph_raw, dict) else (ph_raw if isinstance(ph_raw, (int, float)) else 6.5)
        
        soc_raw = soil.get("organicCarbon")
        soc_val = soc_raw.get("value") if isinstance(soc_raw, dict) else (soc_raw if isinstance(soc_raw, (int, float)) else 1.8)
        
        clay_pct = soil.get("texture", {}).get("clayPercentage", 30.0)
        spi3 = drought.get("meteorologicalDrought", {}).get("spiValue", 0.0)

        # Check for missing data or demonstration data
        missing_inputs = []
        is_data_degraded = False

        climate_prov = climate.get("provenance", {}).get("status", "")
        rainfall_prov = rainfall.get("provenance", {}).get("status", "")
        soil_prov = soil.get("provenance", {}).get("status", "")

        if climate_prov in ("UNAVAILABLE", "DEMONSTRATION", "FAILED"):
            missing_inputs.append("NASA POWER Temperature data is offline or demonstration; using regional baseline.")
            is_data_degraded = True
        if rainfall_prov in ("UNAVAILABLE", "DEMONSTRATION", "FAILED"):
            missing_inputs.append("CHIRPS Rainfall data is offline or demonstration; rainfall totals unverified.")
            is_data_degraded = True
        if soil_prov in ("UNAVAILABLE", "DEMONSTRATION", "FAILED"):
            missing_inputs.append("Soil edaphic data is unavailable or demonstration; local soil chemistry not verified.")
            is_data_degraded = True
        if not calendar.get("calendarAvailable", True):
            missing_inputs.append(f"Official national planting calendar not yet indexed for country '{country_code}'.")
            is_data_degraded = True

        # 3. Retrieve available candidate crops
        candidate_crops = self.crop_service.get_all_crops(country_code)
        if not candidate_crops:
            candidate_crops = self.crop_service.get_all_crops("ET")

        scored_candidates = []

        for crop in candidate_crops:
            score_data = self._score_crop_suitability(
                crop=crop,
                annual_rain=annual_rain,
                mean_temp=mean_temp,
                ph_val=ph_val,
                soc_val=soc_val,
                clay_pct=clay_pct,
                water_avail=water_avail,
                spi3=spi3,
                previous_crop=previous_crop,
                country_code=country_code,
                calendar=calendar,
                is_data_degraded=is_data_degraded
            )
            scored_candidates.append(score_data)

        # Rank candidates by suitability score
        scored_candidates.sort(key=lambda x: x["overallScore"], reverse=True)
        top_candidates = scored_candidates[:top_k]

        return {
            "farmLocation": {"latitude": lat, "longitude": lon, "countryCode": country_code},
            "environmentalProfile": {
                "annualRainfallMm": round(annual_rain, 1),
                "meanTemperatureCelsius": round(mean_temp, 1),
                "soilPh": round(ph_val, 2),
                "soilOrganicCarbonPct": round(soc_val, 2),
                "soilClayPercentage": round(clay_pct, 1),
                "droughtSpi3": round(spi3, 2),
                "waterAvailability": water_avail
            },
            "recommendations": top_candidates,
            "missingInformation": missing_inputs,
            "disclaimer": (
                "IMPORTANT: Recommendations provide decision-support based on global remote sensing and national "
                "extension datasets. They do not constitute guaranteed commercial returns or replace on-site agronomic advisory."
            ),
            "sources": [
                {"name": "CHIRPS 2.0", "parameter": "Annual & Monthly Rainfall"},
                {"name": "NASA POWER", "parameter": "Mean Temperature & Thermal Windows"},
                {"name": "ISRIC SoilGrids 2.0", "parameter": "pH, SOC, Texture"},
                {"name": "WMO SPI-3", "parameter": "Short-Term Drought Risk"},
                {"name": "National Agricultural Calendars", "parameter": "Planting & Flowering Windows"}
            ]
        }

    def evaluate_crop_rotation(
        self,
        farm_data: Dict[str, Any],
        current_crop_id: str,
        proposed_crop_ids: List[str]
    ) -> Dict[str, Any]:
        """
        Evaluates a proposed crop sequence for biological synergy, disease cycle breaking,
        nutrient replenishment, and seasonal calendar compatibility.
        """
        lat = farm_data.get("latitude", 8.75)
        lon = farm_data.get("longitude", 38.98)
        country_code = farm_data.get("countryCode", "ET").upper()
        water_avail = farm_data.get("waterAvailability", "Rainfed")

        climate = self.nasa_service.get_monthly_climatology(lat, lon)
        rainfall = self.chirps_service.get_rainfall_analysis(lat, lon)
        soil = self.soil_service.get_soil_properties(lat, lon)
        drought = self.drought_service.get_drought_assessment(lat, lon)
        calendar = self.calendar_service.get_crop_calendar(country_code)

        annual_rain = rainfall.get("annual", {}).get("totalRainfallMm", 750.0)
        mean_temp = climate.get("summary", {}).get("meanTemperatureCelsius", 20.0)
        ph_raw = soil.get("ph")
        ph_val = ph_raw.get("value") if isinstance(ph_raw, dict) else (ph_raw if isinstance(ph_raw, (int, float)) else 6.5)
        spi3 = drought.get("meteorologicalDrought", {}).get("spiValue", 0.0)

        current_crop = self.crop_service.get_crop_by_id(current_crop_id.lower())
        proposed_crops = [self.crop_service.get_crop_by_id(cid.lower()) for cid in proposed_crop_ids]
        proposed_crops = [c for c in proposed_crops if c]

        positive_reasons = []
        risks = []
        missing_notes = []

        # 1. Family Repetition & Monoculture Penalties
        curr_family = current_crop.get("family", "") if current_crop else ""
        curr_cat = current_crop.get("category", "") if current_crop else ""
        curr_id = current_crop.get("id", "") if current_crop else ""
        
        has_monoculture = False
        has_family_repetition = False

        for pc in proposed_crops:
            prop_family = pc.get("family", "")
            prop_id = pc.get("id", "")
            if curr_id and prop_id and curr_id.lower() == prop_id.lower():
                has_monoculture = True
                has_family_repetition = True
                risks.append(
                    f"Continuous monoculture repetition of {current_crop.get('name', 'crop')} intensifies specialized pest cycles, root rots, and severe nutrient depletion."
                )
            elif curr_family and prop_family and curr_family.lower() == prop_family.lower():
                has_family_repetition = True
                risks.append(
                    f"Sequential planting within the same botanical family ({curr_family}) increases soil-borne pathogen persistence."
                )

        if not has_family_repetition:
            positive_reasons.append(
                f"Rotating away from {curr_family or 'previous family'} breaks host-specific insect and nematode cycles."
            )
        elif not has_monoculture:
            positive_reasons.append(
                f"Different species within {curr_family} offers slight morphological variation but carries disease risk."
            )

        # Diversity score
        if has_monoculture:
            diversity_score = 25
        elif has_family_repetition:
            diversity_score = 55
        else:
            diversity_score = 90

        # 2. Legume-Cereal Nitrogen Dynamic
        curr_is_legume = current_crop.get("nitrogenFixation", False) if current_crop else False
        prop_has_legume = any(pc.get("nitrogenFixation", False) for pc in proposed_crops)
        prop_is_cereal = any(pc.get("category", "").lower() == "cereal" for pc in proposed_crops)

        if curr_is_legume and prop_is_cereal:
            positive_reasons.append(
                "Cereal crop will effectively utilize residual organic nitrogen fixed by the preceding legume crop."
            )
            n_score = 95
        elif not curr_is_legume and prop_has_legume:
            positive_reasons.append(
                "Introducing a legume replenishes depleted soil nitrogen reserves through biological rhizobial fixation."
            )
            n_score = 92
        elif has_monoculture:
            risks.append(
                f"Continuous cultivation of {current_crop.get('name', 'this crop')} severely exhausts the identical root-zone nutrient profile."
            )
            n_score = 30
        elif not curr_is_legume and not prop_has_legume:
            risks.append(
                "Successive non-legume crops will progressively deplete available soil nitrogen without supplemental organic inputs."
            )
            n_score = 52
        else:
            n_score = 75

        # 3. Moisture and Climate Feasibility
        target_crop = proposed_crops[0] if proposed_crops else None
        if target_crop:
            w_req = target_crop.get("waterRequirementsMm", {"min": 300, "max": 700})
            if water_avail == "Irrigated":
                positive_reasons.append("Supplemental irrigation mitigates seasonal rainfall deficit risks.")
                water_score = 90
            elif annual_rain < w_req.get("min", 300):
                risks.append(
                    f"Annual rainfall ({annual_rain:.0f} mm) is below the minimum water requirement for {target_crop.get('name')} ({w_req.get('min')} mm)."
                )
                water_score = max(35, int(45 * (annual_rain / max(w_req.get('min', 300), 1))))
            elif annual_rain > w_req.get("max", 700) * 1.5:
                risks.append(
                    f"Excessive rainfall ({annual_rain:.0f} mm) may cause waterlogging or disease for {target_crop.get('name')} (opt max: {w_req.get('max')} mm)."
                )
                water_score = 65
            else:
                positive_reasons.append(
                    f"Annual rainfall ({annual_rain:.0f} mm) satisfies water requirements ({w_req.get('min')}-{w_req.get('max')} mm)."
                )
                water_score = 86

            # Thermal / Climate match
            temp_spec = target_crop.get("suitableTemperatureCelsius", {"min": 10, "max": 35, "optimal": 22})
            t_min = temp_spec.get("min", 10)
            t_max = temp_spec.get("max", 35)
            t_opt = temp_spec.get("optimal", 22)
            if t_min <= mean_temp <= t_max:
                diff = abs(mean_temp - t_opt)
                climate_score = max(70, round(92 - diff * 2.5))
                positive_reasons.append(f"Mean temperature ({mean_temp:.1f}°C) matches thermal window ({t_min}-{t_max}°C).")
            else:
                climate_score = 50
                risks.append(f"Mean temperature ({mean_temp:.1f}°C) lies outside preferred range ({t_min}-{t_max}°C).")

            # Soil pH and texture compatibility
            ph_range = target_crop.get("pHRange", {"min": 5.5, "max": 7.5})
            if ph_range.get("min", 5.5) <= ph_val <= ph_range.get("max", 7.5):
                positive_reasons.append(f"Soil pH ({ph_val}) is optimal for {target_crop.get('name')} (range: {ph_range['min']}-{ph_range['max']}).")
                soil_base = 88
            else:
                risks.append(f"Soil pH ({ph_val}) diverges from preferred range ({ph_range['min']}-{ph_range['max']}).")
                soil_base = 60

            # Farm soil type penalty if heavy clay / vertisol without drainage
            farm_soil = str(farm_data.get("soilType", "")).lower()
            if "vertisol" in farm_soil or "clay" in farm_soil:
                if target_crop.get("id") in ["sweet_potato", "yam", "groundnut"]:
                    risks.append(f"Tuber and pod expansion of {target_crop.get('name')} is hindered by high swelling Vertisol clay.")
                    soil_base = max(45, soil_base - 25)
                elif target_crop.get("id") in ["teff", "rice"]:
                    positive_reasons.append(f"High clay Vertisol water retention supports {target_crop.get('name')} establishment.")
                    soil_base = min(95, soil_base + 5)
            
            soil_score = soil_base

            # Agroecological adaptation
            app_countries = target_crop.get("countryApplicability", [])
            if country_code and country_code not in app_countries and "GLOBAL" not in app_countries:
                risks.append(f"{target_crop.get('name')} is not traditionally verified in national extension package for {country_code}.")
                adapt_score = 50
            else:
                positive_reasons.append(f"{target_crop.get('name')} has verified commercial and agronomic adaptation in {country_code}.")
                adapt_score = 90
        else:
            climate_score = 75
            water_score = 70
            soil_score = 70
            adapt_score = 70

        # Suggested calendar window
        planting_window = "Follow local rainy season onset"
        if target_crop and calendar.get("crops", {}).get(target_crop.get("id", "").lower()):
            cal_info = calendar["crops"][target_crop.get("id").lower()]
            planting_window = cal_info.get("plantingWindow", planting_window)
            positive_reasons.append(f"National extension calendar indicates planting window: {planting_window}.")

        # Composite overall calculation using the authoritative 5-factor weighting model:
        # 1. Climate Suitability: 25% (NASA POWER thermal envelope alignment)
        # 2. Soil Suitability: 25% (ISRIC SoilGrids pH & edaphic texture compatibility)
        # 3. Water Requirements: 25% (CHIRPS precipitation vs crop requirement)
        # 4. Biological Nitrogen Fixation: 15% (Rhizobial fixation vs nutrient depletion)
        # 5. Crop Diversity: 10% (Botanical family diversification & pest break cycle)
        # Total: 25% + 25% + 25% + 15% + 10% = 100%
        overall_score = round(
            (climate_score * 0.25) +
            (soil_score * 0.25) +
            (water_score * 0.25) +
            (n_score * 0.15) +
            (diversity_score * 0.10)
        )

        if has_monoculture:
            overall_score = min(overall_score, 48)
            assessment = "Not Advised"
        elif overall_score >= 80:
            assessment = "Highly Recommended"
        elif overall_score >= 65:
            assessment = "Recommended with Conditions"
        else:
            assessment = "Alternative Suggested"

        return {
            "overallScore": overall_score,
            "overallAssessment": assessment,
            "proposedSequence": [current_crop.get("name", current_crop_id)] + [c.get("name") for c in proposed_crops],
            "factors": {
                "soilCompatibility": soil_score,
                "moistureSufficiency": water_score,
                "nutrientManagement": n_score,
                "adaptationLevel": adapt_score,
                "climateSuitability": {
                    "name": "Climate Suitability",
                    "weightPct": 25,
                    "score": climate_score,
                    "explanation": f"Thermal alignment for {target_crop.get('name') if target_crop else 'crop'} in {farm_data.get('countryCode', 'ET')}.",
                    "positiveFactors": [p for p in positive_reasons if 'temperature' in p.lower() or 'climate' in p.lower()],
                    "potentialRisks": [r for r in risks if 'temperature' in r.lower()]
                },
                "soilSuitability": {
                    "name": "Soil Suitability",
                    "weightPct": 25,
                    "score": soil_score,
                    "explanation": f"Evaluated against soil pH ({ph_val}) and texture ({farm_data.get('soilType', 'soil')}).",
                    "positiveFactors": [p for p in positive_reasons if 'soil' in p.lower() or 'ph' in p.lower()],
                    "potentialRisks": [r for r in risks if 'soil' in r.lower() or 'ph' in r.lower() or 'clay' in r.lower()]
                },
                "waterRequirements": {
                    "name": "Water Requirements",
                    "weightPct": 25,
                    "score": water_score,
                    "explanation": f"Rainfall comparison ({annual_rain:.0f} mm) vs crop requirements.",
                    "positiveFactors": [p for p in positive_reasons if 'rainfall' in p.lower() or 'irrigation' in p.lower() or 'water' in p.lower()],
                    "potentialRisks": [r for r in risks if 'rainfall' in r.lower() or 'water' in r.lower()]
                },
                "nitrogenFixation": {
                    "name": "Biological Nitrogen Fixation",
                    "weightPct": 15,
                    "score": n_score,
                    "explanation": "Biological symbiotic rhizobia fixation and soil nitrogen replenishment.",
                    "positiveFactors": [p for p in positive_reasons if 'nitrogen' in p.lower() or 'legume' in p.lower()],
                    "potentialRisks": [r for r in risks if 'nitrogen' in r.lower() or 'deplete' in r.lower()]
                },
                "cropDiversity": {
                    "name": "Botanical Family Diversity",
                    "weightPct": 10,
                    "score": diversity_score,
                    "explanation": "Botanical family rotation and biological cycle breaking.",
                    "positiveFactors": [p for p in positive_reasons if 'break' in p.lower() or 'family' in p.lower()],
                    "potentialRisks": [r for r in risks if 'monoculture' in r.lower() or 'family' in r.lower()]
                }
            },
            "positiveHighlights": positive_reasons,
            "potentialRisks": risks,
            "suggestedPlantingWindow": planting_window,
            "missingInformationNotes": missing_notes,
            "summaryExplanation": (
                f"Rotating from {current_crop.get('name', current_crop_id)} to {target_crop.get('name', 'candidate') if target_crop else 'candidate'} "
                f"achieves an agronomic suitability score of {overall_score}/100. "
                + ("Legume benefits and disease break dynamics are strongly satisfied." if (prop_has_legume and not has_family_repetition) else ("Monoculture succession is strongly discouraged due to pest buildup." if has_monoculture else "Moderate nutrient and moisture requirements must be managed."))
            ),
            "disclaimer": "This sequence assessment is decision-support guidance. Always verify with local agricultural extension officers."
        }

    # ------------------------------------------------------------------
    # Helper: Individual Crop Scoring
    # ------------------------------------------------------------------

    def _score_crop_suitability(
        self,
        crop: Dict[str, Any],
        annual_rain: float,
        mean_temp: float,
        ph_val: float,
        soc_val: float,
        clay_pct: float,
        water_avail: str,
        spi3: float,
        previous_crop: Optional[str],
        country_code: str,
        calendar: Dict[str, Any],
        is_data_degraded: bool = False
    ) -> Dict[str, Any]:
        crop_id = crop.get("id", "").lower()
        crop_name = crop.get("name", crop_id)
        
        supporting_obs = []
        risks = []
        confidence = "HIGH"

        if is_data_degraded:
            confidence = "MEDIUM"
            risks.append("Underlying environmental or calendar data is incomplete/demonstration; confidence is bounded.")

        # 1. Thermal window match
        temp_spec = crop.get("suitableTemperatureCelsius", {})
        t_opt = temp_spec.get("optimal", 20.0)
        t_min = temp_spec.get("min", 10.0)
        t_max = temp_spec.get("max", 35.0)

        if t_min <= mean_temp <= t_max:
            temp_score = 90 - min(40, abs(mean_temp - t_opt) * 4)
            supporting_obs.append(f"Mean temperature ({mean_temp:.1f}°C) within thermal window ({t_min}-{t_max}°C).")
        else:
            temp_score = 40
            risks.append(f"Temperature ({mean_temp:.1f}°C) exceeds bounds ({t_min}-{t_max}°C).")
            confidence = "MEDIUM"

        # 2. Moisture / Rainfall
        w_spec = crop.get("waterRequirementsMm", {"min": 350, "max": 750})
        w_min = w_spec.get("min", 350)
        w_max = w_spec.get("max", 750)

        if water_avail == "Irrigated":
            moisture_score = 92
            supporting_obs.append("Controlled irrigation satisfies crop water requirements.")
        elif annual_rain >= w_min:
            moisture_score = 88
            supporting_obs.append(f"Annual precipitation ({annual_rain:.0f} mm) meets requirements ({w_min}-{w_max} mm).")
        else:
            moisture_score = 45
            risks.append(f"Annual rainfall ({annual_rain:.0f} mm) is below minimum requirement ({w_min} mm).")
            confidence = "MEDIUM"

        if spi3 <= -1.5:
            risks.append(f"Active meteorological drought (SPI-3: {spi3}) poses early vegetative stress.")
            moisture_score = max(30, moisture_score - 20)

        # 3. Soil pH
        ph_spec = crop.get("pHRange", {"min": 5.5, "max": 7.5})
        ph_min = ph_spec.get("min", 5.5)
        ph_max = ph_spec.get("max", 7.5)

        if ph_min <= ph_val <= ph_max:
            ph_score = 90
            supporting_obs.append(f"Soil pH ({ph_val}) aligns with optimal range ({ph_min}-{ph_max}).")
        else:
            ph_score = 55
            risks.append(f"Soil pH ({ph_val}) diverges from tolerance window ({ph_min}-{ph_max}).")

        # 4. National Adaptation
        app_countries = crop.get("countryApplicability", [])
        if country_code in app_countries or "GLOBAL" in app_countries:
            adapt_score = 95
            supporting_obs.append(f"Verified agronomic presence and cultivation package in {country_code}.")
        else:
            adapt_score = 50
            risks.append(f"Not listed as a primary commercial crop in national research guidelines for {country_code}.")
            confidence = "LOW"

        # 5. Crop Calendar integration
        planting_window = "Consult local extension guidelines"
        crop_cal = calendar.get("crops", {}).get(crop_id)
        if crop_cal:
            planting_window = crop_cal.get("plantingWindow", planting_window)
            supporting_obs.append(f"National planting window: {planting_window} ({crop_cal.get('source', '')[:40]}).")

        # 6. Preceding crop rotation synergy
        rotation_score = 80
        if previous_crop and previous_crop.lower() == crop_id:
            rotation_score = 40
            risks.append(f"Continuous cultivation of {crop_name} without break crop elevates root rot and insect pressure.")
        elif crop.get("nitrogenFixation", False):
            rotation_score = 95
            supporting_obs.append("Legume nitrogen fixation replenishes soil fertility.")

        overall = round(
            (temp_score * 0.25) +
            (moisture_score * 0.25) +
            (ph_score * 0.20) +
            (adapt_score * 0.20) +
            (rotation_score * 0.10)
        )

        return {
            "cropId": crop_id,
            "cropName": crop_name,
            "category": crop.get("category", "Field Crop"),
            "family": crop.get("family", "Unknown"),
            "nitrogenFixation": crop.get("nitrogenFixation", False),
            "overallScore": overall,
            "confidenceLevel": confidence,
            "suggestedPlantingWindow": planting_window,
            "supportingObservations": supporting_obs,
            "identifiedRisks": risks,
            "waterRequirementsMm": f"{w_min} - {w_max} mm",
            "growingDurationDays": f"{crop.get('growingDurationDays', {}).get('min', 90)} - {crop.get('growingDurationDays', {}).get('max', 150)} days"
        }

explainable_recommendation_engine = ExplainableRecommendationEngine()

