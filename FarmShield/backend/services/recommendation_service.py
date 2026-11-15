from typing import Dict, Any, List, Optional
from .crop_service import crop_service
from .nasa_power_service import nasa_power_service
from .soil_service import soil_service

class RecommendationService:
    def __init__(self):
        self.crop_service = crop_service
        self.nasa_service = nasa_power_service
        self.soil_service = soil_service

    def evaluate_rotation(
        self,
        farm_data: Dict[str, Any],
        current_crop_id: str,
        proposed_crop_ids: List[str]
    ) -> Dict[str, Any]:
        lat = farm_data.get("latitude", 9.0)
        lon = farm_data.get("longitude", 38.7)
        country_code = farm_data.get("countryCode", "ET")
        soil_type = farm_data.get("soilType", "Vertisols (Black clay)")
        water_avail = farm_data.get("waterAvailability", "Rainfed")

        climate = self.nasa_service.get_monthly_climatology(lat, lon)
        soil = self.soil_service.get_soil_properties(lat, lon)

        annual_rain = climate.get("summary", {}).get("annualPrecipitationMm", 850)
        mean_temp = climate.get("summary", {}).get("meanTemperatureCelsius", 18.0)
        soil_ph = soil.get("ph")
        ph_val = soil_ph.get("value", 6.5) if isinstance(soil_ph, dict) else (soil_ph if isinstance(soil_ph, (int, float)) else 6.5)

        current_crop = self.crop_service.get_crop_by_id(current_crop_id.lower())
        proposed_crops = [self.crop_service.get_crop_by_id(cid.lower()) for cid in proposed_crop_ids]
        proposed_crops = [c for c in proposed_crops if c]

        positive_highlights = []
        potential_risks = []
        missing_notes = []

        # 1. Climate Suitability (30%)
        climate_score = 75
        if proposed_crops:
            target = proposed_crops[0]
            temp_range = target.get("suitableTemperatureCelsius", {})
            opt_temp = temp_range.get("optimal", 20)
            diff = abs(mean_temp - opt_temp)
            if diff < 3:
                climate_score = 92
                positive_highlights.append(f"Temperature profile ({mean_temp:.1f}°C) matches optimal range for {target.get('name')}.")
            elif diff < 6:
                climate_score = 78
            else:
                climate_score = 60
                potential_risks.append(f"Local temperature ({mean_temp:.1f}°C) diverges from ideal thermal window for {target.get('name')}.")

        # 2. Soil Suitability (25%)
        soil_score = 70
        if proposed_crops:
            target = proposed_crops[0]
            ph_range = target.get("pHRange", {"min": 5.5, "max": 7.5})
            if ph_range.get("min", 5.5) <= ph_val <= ph_range.get("max", 7.5):
                soil_score = 88
                positive_highlights.append(f"Soil pH ({ph_val}) aligns closely with tolerance range ({ph_range['min']}-{ph_range['max']}).")
            else:
                soil_score = 65
                potential_risks.append(f"Soil pH ({ph_val}) is borderline for {target.get('name')}.")

        # 3. Water Requirements (20%)
        water_score = 70
        if proposed_crops:
            target = proposed_crops[0]
            w_req = target.get("waterRequirementsMm", {"min": 300, "max": 600})
            if water_avail == "Irrigated":
                water_score = 90
                positive_highlights.append("Controlled irrigation minimizes precipitation deficit risks.")
            elif annual_rain >= w_req.get("min", 300):
                water_score = 85
                positive_highlights.append(f"Rainfall ({annual_rain:.0f} mm) sufficient for crop moisture needs.")
            else:
                water_score = 55
                potential_risks.append(f"Rainfed moisture ({annual_rain:.0f} mm) may face seasonal dry spells.")

        # 4. Crop Diversity (15%)
        curr_cat = current_crop.get("category", "") if current_crop else ""
        prop_cats = [c.get("category", "") for c in proposed_crops]
        diversity_score = 80
        if curr_cat and curr_cat in prop_cats:
            diversity_score = 60
            potential_risks.append(f"Continuous cultivation within same botanical group ({curr_cat}) elevates disease carryover risk.")
        else:
            diversity_score = 95
            positive_highlights.append("Rotating plant family disrupts pest life cycles and weed dynamics.")

        # 5. Nitrogen Fixation (10%)
        has_legume = any(c.get("nitrogenFixation", False) for c in proposed_crops)
        if has_legume:
            n_score = 95
            positive_highlights.append("Legume inclusion adds biological nitrogen fixation, reducing chemical fertilizer dependency.")
        else:
            n_score = 50
            if current_crop and not current_crop.get("nitrogenFixation", False):
                potential_risks.append("Successive non-legume crops deplete soil nitrogen reserves.")

        # Country & Agroecological suitability check
        if proposed_crops:
            target = proposed_crops[0]
            app_countries = target.get("countryApplicability", [])
            target_name = target.get("name", "Crop")
            if country_code and country_code.upper() not in [c.upper() for c in app_countries] and "GLOBAL" not in app_countries:
                potential_risks.append(
                    f"{target_name} is not traditionally adapted or established in country ({country_code}). Verification with local agricultural extension recommended (Provisional)."
                )
                climate_score = max(40, climate_score - 15)
            else:
                positive_highlights.append(f"{target_name} has verified agronomic adaptation in country profile ({country_code}).")

        overall_score = round(
            (climate_score * 0.30) +
            (soil_score * 0.25) +
            (water_score * 0.20) +
            (diversity_score * 0.15) +
            (n_score * 0.10)
        )

        if overall_score >= 80:
            assessment = "Highly Recommended"
            summary = "This sequence provides robust agronomic synergy, combining favorable climate compatibility with nutrient cycling benefits."
        elif overall_score >= 65:
            assessment = "Recommended with Conditions"
            summary = "Viable rotation choice; monitor soil fertility adjustments and seasonal moisture windows."
        else:
            assessment = "Alternative Suggested"
            summary = "Sub-optimal combination; consider integrating a legume break crop to safeguard soil productivity."

        if climate.get("provenance", {}).get("isDemoData", False):
            missing_notes.append("Using modeled climatology fallback pending high-resolution weather connection.")
        if soil.get("provenance", {}).get("isDemoData", False):
            missing_notes.append("Soil parameters derived from regional baseline profiles; ground calibration recommended.")

        return {
            "overallScore": overall_score,
            "overallAssessment": assessment,
            "factors": {
                "climateSuitability": climate_score,
                "soilSuitability": soil_score,
                "waterRequirements": water_score,
                "cropDiversity": diversity_score,
                "nitrogenFixation": n_score
            },
            "positiveHighlights": positive_highlights,
            "potentialRisks": potential_risks,
            "missingInformationNotes": missing_notes,
            "disclaimer": "This decision-support recommendation is advisory. Always consult local agricultural extension officers and regional field guides.",
            "summaryExplanation": summary
        }

recommendation_service = RecommendationService()
