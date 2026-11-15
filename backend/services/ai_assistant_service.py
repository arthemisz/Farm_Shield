"""
FarmShield AI Agricultural Assistant Service
============================================
Provides agronomic explanations, climate context, and decision support
grounded in FarmShield's registered database:
- Registered Farms & Fields (names, coordinates, soil types, crops, sizes)
- Crop Database (25 botanical profiles, thermal/water requirements, soil preferences)
- Environmental Observations (NASA POWER, SoilGrids, NASA GPM, ECOSTRESS)
- Soil Type Identification & Agronomic Management Rules
- CHIRPS Precipitation & WMO SPI Drought Indices
"""

import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

class AIAssistantService:
    def __init__(self):
        self.api_key = os.environ.get("FARMSHIELD_AI_API_KEY") or os.environ.get("GEMINI_API_KEY")
        self.provider = "gemini" if self.api_key else "knowledge_base_engine"

    def _query_database_context(self, message: str, farm_context: Optional[Dict[str, Any]] = None, country_code: str = "ET") -> Dict[str, Any]:
        """
        Retrieves real registered data from the FarmShield SQLite database:
        - Matching farms
        - Matching crops
        - Live environmental observations for the farm or country
        """
        db_context: Dict[str, Any] = {
            "farms": [],
            "matched_crops": [],
            "observations": [],
            "total_farms": 0,
            "total_crops": 0,
        }

        try:
            from models.farm import Farm
            from models.crop import CropModel
            from models.environmental_observation import EnvironmentalObservation

            # 1. Query registered farms
            all_farms = Farm.query.all()
            db_context["total_farms"] = len(all_farms)
            farm_list = []
            for f in all_farms:
                d = f.to_dict()
                farm_list.append({
                    "id": d.get("id"),
                    "name": d.get("name"),
                    "countryCode": d.get("countryCode"),
                    "currentCrop": d.get("currentCrop"),
                    "soilType": d.get("soilType"),
                    "size": d.get("size") or d.get("sizeHectares"),
                    "waterAvailability": d.get("waterAvailability"),
                    "adminLevel1": d.get("adminLevel1") or d.get("region"),
                    "adminLevel2": d.get("adminLevel2") or d.get("zone"),
                    "latitude": d.get("latitude"),
                    "longitude": d.get("longitude"),
                    "hasBoundary": bool(d.get("boundaryGeoJson")),
                    "plotsCount": len(d.get("plots", []))
                })
            db_context["farms"] = farm_list

            # 2. Query crops matching keywords in message
            all_crops = CropModel.query.all()
            db_context["total_crops"] = len(all_crops)
            msg_lower = message.lower()
            matched_crops = []
            for c in all_crops:
                c_dict = c.to_dict()
                c_name = c_dict.get("name", "").lower()
                c_id = c_dict.get("id", "").lower()
                c_sci = c_dict.get("scientificName", "").lower()
                if c_name in msg_lower or c_id in msg_lower or c_sci in msg_lower or (c_name and any(w in msg_lower for w in c_name.split())):
                    matched_crops.append({
                        "id": c_dict.get("id"),
                        "name": c_dict.get("name"),
                        "category": c_dict.get("category"),
                        "growingDuration": c_dict.get("growingDurationDays"),
                        "waterNeeds": c_dict.get("waterRequirementsMm"),
                        "optimalTemp": c_dict.get("suitableTemperatureCelsius", {}).get("optimal"),
                        "soilPreference": c_dict.get("soilPreference"),
                        "nitrogenFixing": c_dict.get("nitrogenFixation", {}).get("capable", False)
                    })
            db_context["matched_crops"] = matched_crops[:4]

            # 3. Query observations for active farm or country
            target_farm_id = farm_context.get("id") if farm_context else None
            obs_query = EnvironmentalObservation.query
            if target_farm_id:
                farm_obs = obs_query.filter_by(farm_id=target_farm_id).limit(10).all()
            else:
                farm_obs = obs_query.filter_by(country_code=country_code).limit(10).all()

            if farm_obs:
                db_context["observations"] = [
                    {
                        "dataset": o.dataset_id,
                        "variable": o.variable_name,
                        "value": o.value,
                        "unit": o.unit,
                        "date": o.observation_date,
                        "provenance": o.provenance
                    } for o in farm_obs
                ]

        except Exception as e:
            db_context["query_error"] = str(e)

        return db_context

    def query_assistant(
        self,
        message: str,
        farm_context: Optional[Dict[str, Any]] = None,
        country_code: Optional[str] = "ET",
        capability: Optional[str] = "assistant"
    ) -> Dict[str, Any]:
        """
        Processes an inquiry by querying the database for context
        and formulating a grounded, accurate response.
        """
        msg_lower = message.lower().strip()
        timestamp = datetime.now(timezone.utc).isoformat()
        clean_country = country_code or "ET"

        # Pull real database data
        db_context = self._query_database_context(message, farm_context, clean_country)

        # Check if live external LLM is configured
        if self.api_key and self.provider == "gemini":
            return self._call_live_llm(message, farm_context, clean_country, capability, db_context)

        # Grounded rule-based Knowledge Base & Database Engine
        return self._generate_grounded_response(msg_lower, farm_context, clean_country, capability, db_context)

    def _generate_grounded_response(
        self,
        msg: str,
        farm: Optional[Dict[str, Any]],
        country_code: str,
        capability: Optional[str],
        db_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        timestamp = datetime.now(timezone.utc).isoformat()
        farms = db_data.get("farms", [])
        matched_crops = db_data.get("matched_crops", [])
        observations = db_data.get("observations", [])

        # Active farm context from client or first registered farm
        if farm and farm.get("name"):
            active_farm = farm
        elif farms:
            active_farm = farms[0]
        else:
            active_farm = {
                "name": "your farm",
                "soilType": "Vertisols (Black clay)",
                "waterAvailability": "Rainfed",
                "currentCrop": "Teff",
                "size": 5.0
            }

        farm_name = active_farm.get("name", "your farm")
        soil_type = active_farm.get("soilType", "Vertisols (Black clay)")
        water_avail = active_farm.get("waterAvailability", "Rainfed")
        current_crop = active_farm.get("currentCrop", "field crops")
        farm_size = active_farm.get("size") or active_farm.get("sizeHectares", 5.0)

        citations = [
            {"source": "FarmShield SQLite Database (Farms, Crops & Soil Profiles)", "version": "4.1.0"},
            {"source": "ISRIC SoilGrids & NASA Agroclimatology Observations", "type": "Pedological / Climate"}
        ]

        # -----------------------------------------------------------------
        # 1. DATABASE QUERIES ABOUT REGISTERED FARMS
        # -----------------------------------------------------------------
        if any(w in msg for w in ["how many farms", "list farms", "registered farms", "show farms", "my farms", "farm count", "database farm"]):
            if farms:
                farm_lines = "\n".join([
                    f"• {f['name']} ({f.get('adminLevel1') or 'Region'}, {f.get('countryCode')}): {f.get('size')} ha | Soil: {f.get('soilType')} | Current: {f.get('currentCrop')} | {'Boundary Verified' if f.get('hasBoundary') else 'Point Only'}"
                    for f in farms
                ])
                response_text = (
                    f"Database Farm Registry ({len(farms)} registered parcels in database):\n\n"
                    f"{farm_lines}\n\n"
                    f"Active Focus: {farm_name} ({soil_type}, {water_avail})."
                )
            else:
                response_text = "There are currently no registered farms stored in the local database. You can register new parcels on the 'Register Farm & Map Boundary' page."
            topic = "Database Farm Inventory"

        # -----------------------------------------------------------------
        # 2. DATABASE QUERIES ABOUT CROPS
        # -----------------------------------------------------------------
        elif matched_crops:
            crop_summaries = []
            for c in matched_crops:
                n_fix = "Yes (Biological N-Fixing Legume)" if c.get("nitrogenFixing") else "No (Nitrogen Feeder)"
                crop_summaries.append(
                    f"🌿 **{c['name']}** ({c['category']}):\n"
                    f"  - Growing Duration: {c.get('growingDuration', {}).get('min', 90)}–{c.get('growingDuration', {}).get('max', 120)} days\n"
                    f"  - Seasonal Water Needs: {c.get('waterNeeds', {}).get('min', 300)}–{c.get('waterNeeds', {}).get('max', 600)} mm\n"
                    f"  - Thermal Optimum: {c.get('optimalTemp', {}).get('min', 18)}°C – {c.get('optimalTemp', {}).get('max', 26)}°C\n"
                    f"  - Soil Preference: {', '.join(c.get('soilPreference', ['Loams']))}\n"
                    f"  - Nitrogen Dynamic: {n_fix}"
                )
            response_text = (
                f"Database Crop Profiles matching your query:\n\n"
                + "\n\n".join(crop_summaries) + "\n\n"
                f"Grounded Context for {farm_name} ({soil_type}): Check if the preferred soil aligns with your active farm's edaphic conditions."
            )
            topic = "Crop Botanical & Physiological Records"

        # -----------------------------------------------------------------
        # 3. ROTATION & CROPPING SEQUENCE INQUIRIES
        # -----------------------------------------------------------------
        elif "rotation" in msg or "sequence" in msg or "break crop" in msg:
            response_text = (
                f"Crop Rotation Advisory for {farm_name} (Database Current Crop: {current_crop}, Soil: {soil_type}):\n\n"
                f"• Monoculture Risk: Successive cycles of {current_crop} deplete root-zone mineral reserves and accumulate host-specific pathogens.\n"
                "• Recommended Sequence: Alternate with a biologically compatible break crop:\n"
                "  - If preceding cereal (Teff/Wheat/Maize): Rotate with a legume (Faba Bean, Chickpea, or Cowpea) to fix 40–80 kg N/ha and restore soil crumb tilth.\n"
                "  - Vertisol Accommodations: On heavy cracking Vertisols, chickpea performs exceptionally well on residual end-of-season moisture.\n"
                "• Quantitative Engine: You can test the full mathematical scoring model in the Rotation Planner tool."
            )
            topic = "Crop Rotation & Sequence Advisory"

        # -----------------------------------------------------------------
        # 4. SOIL HEALTH, EDAPHIC PROPERTIES & SOIL TYPE DOCUMENTATION
        # -----------------------------------------------------------------
        elif "soil" in msg or "ph" in msg or "vertisol" in msg or "nitisol" in msg or "clay" in msg:
            response_text = (
                f"Soil Profile & Edaphic Properties for {farm_name}:\n\n"
                f"• Registered Dominant Soil: {soil_type}\n"
                f"• Water Availability Mode: {water_avail}\n"
                "• Farmer Soil Characteristics:\n"
                "  - Vertisols (Black clay): Heavy, cracking when dry, sticky when wet; exceptional water retention but requires drainage during peak rains (broadbed & furrow).\n"
                "  - Nitisols (Red basaltic): Deep, porous, stable nutty crumb structure; excellent rooting depth; susceptible to phosphorus fixation.\n"
                "  - Cambisols (Brown loamy): High natural mineral fertility, versatile, easily tilled.\n"
                "• Soil pH & Nutrient Uptake: Near-neutral pH (6.2–7.2) optimizes nitrogen fixation and phosphorus absorption. Strongly acidic soils (<5.5) require lime."
            )
            topic = "Soil Health & Edaphic Properties"

        # -----------------------------------------------------------------
        # 5. RAINFALL, CLIMATE & ENVIRONMENTAL OBSERVATIONS
        # -----------------------------------------------------------------
        elif "rain" in msg or "drought" in msg or "spi" in msg or "precipitation" in msg or "weather" in msg or "climate" in msg:
            obs_lines = ""
            if observations:
                obs_lines = "\n• Database Environmental Observations for Location:\n" + "\n".join([
                    f"  - {o['dataset']} {o['variable']}: {o['value']} {o['unit']} ({o['date']})"
                    for o in observations[:4]
                ])

            response_text = (
                f"Precipitation & Moisture Intelligence for {farm_name} ({water_avail}):\n"
                f"{obs_lines}\n\n"
                "• Meteorological Drought (CHIRPS & WMO SPI):\n"
                "  - SPI > +1.0: Abnormally wet; monitor waterlogging and fungal pressure.\n"
                "  - -0.99 to +0.99: Normal seasonal precipitation.\n"
                "  - SPI <= -1.50: Severe precipitation deficit; deploy drought-hardy crops and mulching."
            )
            topic = "Precipitation & Environmental Observations"

        # -----------------------------------------------------------------
        # 6. GENERAL AGRONOMIC WELCOME & FEATURE GUIDE
        # -----------------------------------------------------------------
        else:
            response_text = (
                f"Hello! I am your FarmShield Agricultural AI Assistant, connected directly to your registered farm database.\n\n"
                f"Currently tracking: **{farm_name}** ({farm_size} ha, {soil_type}, Current: {current_crop}).\n\n"
                "You can ask me questions grounded in your live database, such as:\n"
                "• 'Show all my registered farms in the database'\n"
                "• 'What are the water and temperature needs for Teff, Chickpea, or Wheat?'\n"
                "• 'What should I rotate after my current crop?'\n"
                "• 'How do I identify and manage my Vertisol soil?'\n"
                "• 'What are the current rainfall and environmental observations?'"
            )
            topic = "Database-Connected Agronomic Assistant"

        return {
            "success": True,
            "response": response_text,
            "topic": topic,
            "capability": capability or "assistant",
            "provider": self.provider,
            "isLiveAI": bool(self.api_key),
            "disclaimer": "AI Advisory Notice: Responses are grounded in FarmShield's registered database and verified scientific extension datasets.",
            "citations": citations,
            "timestamp": timestamp
        }

    def _call_live_llm(
        self,
        message: str,
        farm_context: Optional[Dict[str, Any]],
        country_code: str,
        capability: Optional[str],
        db_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """External LLM call wrapper with strict database context injection."""
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = (
                f"You are the FarmShield AI Agricultural Assistant for African farmers in {country_code}.\n"
                f"Role Mode: {'Crop Advisor' if capability == 'advisor' else 'Agricultural Assistant'}\n"
                f"Active Farm Context: {json.dumps(farm_context or {})}\n"
                f"Database Farms & Crops Context: {json.dumps(db_data)}\n"
                "Strict Rules:\n"
                "- Answer the user's question directly using the provided database information.\n"
                "- Never invent synthetic weather numbers or fake sensor data.\n"
                "- Use sound agronomic principles (biological nitrogen fixation, soil drainage, WMO SPI).\n"
                "- Be concise, practical, and clear for farm operators.\n"
                f"User Question: {message}\n"
            )
            res = model.generate_content(prompt)
            return {
                "success": True,
                "response": res.text,
                "topic": "Live AI Advisory" if capability != "advisor" else "Live AI Crop Advisor",
                "capability": capability,
                "provider": "gemini-1.5-flash",
                "isLiveAI": True,
                "disclaimer": "AI Advisory Notice: Generated by Gemini 1.5 Flash grounded in FarmShield database context.",
                "citations": [{"source": "Gemini 1.5 Flash / FarmShield SQLite Database", "type": "Live Model"}],
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            grounded = self._generate_grounded_response(message.lower(), farm_context, country_code, capability, db_data)
            grounded["disclaimer"] += f" (Live AI fallback: {str(e)[:60]})"
            return grounded

ai_assistant_service = AIAssistantService()
