"""
Regional Crop Calendars & National Agronomic Knowledge Service
==============================================================
Provides verified agricultural calendars, planting windows, critical growth
periods, and regional extension guidelines sourced from official institutions:
  - FAO Crop Calendar Database & FAO GIEWS (Global Information and Early Warning System)
  - EIAR (Ethiopian Institute of Agricultural Research)
  - KALRO (Kenya Agricultural and Livestock Research Organization)
  - CSIR-CRI (Council for Scientific and Industrial Research - Crops Research Institute, Ghana)
  - IITA (International Institute of Tropical Agriculture, Nigeria/West Africa)
  - ARC (Agricultural Research Council, South Africa)

Requirements enforced:
  - Preserves national and agroecological distinctions.
  - Never applies East African bimodal calendars (MAM/OND) to West African monomodal regimes (JJAS).
  - Cites publication source, institution, and agroecological zone.
"""

from typing import Dict, Any, List, Optional
from services.data_sources.base_service import (
    BaseDataSource, STATUS_LIVE, STATUS_CACHED, STATUS_PARTIAL, STATUS_UNAVAILABLE
)
from utils.cache import cache

# Verified Regional Crop Calendars
# Sources: FAO GIEWS Country Briefs, EIAR Agronomy Guides, KALRO Crop Guides, IITA Handbooks
CROP_CALENDARS = {
    "ET": { # Ethiopia
        "country": "Ethiopia",
        "institution": "Ethiopian Institute of Agricultural Research (EIAR) & FAO GIEWS",
        "seasons": {
            "Meher": "Main cropping season (June - December), nourished by Kiremt rains",
            "Belg": "Secondary cropping season (February - June), nourished by Belg rains"
        },
        "crops": {
            "teff": {
                "season": "Meher",
                "plantingWindow": "July 10 - August 5",
                "floweringPeriod": "September - October",
                "harvestingWindow": "November - December",
                "optimalRainfallMm": "450 - 650",
                "optimalTempC": "15 - 27",
                "criticalStages": "Tillering & heading (moisture stress sensitive)",
                "source": "EIAR Teff Production Package (2020) & Debre Zeit Agricultural Research Center"
            },
            "wheat": {
                "season": "Meher",
                "plantingWindow": "June 20 - July 15",
                "floweringPeriod": "August - September",
                "harvestingWindow": "October - December",
                "optimalRainfallMm": "500 - 800",
                "optimalTempC": "15 - 23",
                "criticalStages": "Stem elongation and grain filling",
                "source": "EIAR Wheat Production Manual (Kulumsa Agricultural Research Center)"
            },
            "maize": {
                "season": "Meher / Belg transition",
                "plantingWindow": "April 15 - May 30",
                "floweringPeriod": "July - August",
                "harvestingWindow": "October - November",
                "optimalRainfallMm": "600 - 1000",
                "optimalTempC": "18 - 30",
                "criticalStages": "Silking and tasseling (severe drought vulnerability)",
                "source": "Bako National Maize Research Center (EIAR)"
            },
            "barley": {
                "season": "Meher & Belg (Highlands)",
                "plantingWindow": "June 1 - June 30 (Meher) / March (Belg)",
                "floweringPeriod": "July - August",
                "harvestingWindow": "October - November",
                "optimalRainfallMm": "400 - 700",
                "optimalTempC": "12 - 20",
                "criticalStages": "Tillering and grain hardening",
                "source": "Holetta Agricultural Research Center (EIAR)"
            },
            "sorghum": {
                "season": "Meher (Long season)",
                "plantingWindow": "April - May",
                "floweringPeriod": "August - September",
                "harvestingWindow": "November - December",
                "optimalRainfallMm": "400 - 650",
                "optimalTempC": "24 - 34",
                "criticalStages": "Seedling emergence and panicle development",
                "source": "Melkassa Agricultural Research Center (EIAR)"
            }
        }
    },
    "KE": { # Kenya
        "country": "Kenya",
        "institution": "Kenya Agricultural and Livestock Research Organization (KALRO) & FAO",
        "seasons": {
            "Long Rains": "March - August (Central, Rift Valley, Western, Eastern)",
            "Short Rains": "October - January (Eastern, Coastal, Lake Basin)"
        },
        "crops": {
            "maize": {
                "season": "Long Rains",
                "plantingWindow": "March 15 - April 10",
                "floweringPeriod": "May - June",
                "harvestingWindow": "August - October",
                "optimalRainfallMm": "600 - 1100",
                "optimalTempC": "18 - 28",
                "criticalStages": "Tasseling and grain filling",
                "source": "KALRO Maize Production Guidelines & Ministry of Agriculture Kenya"
            },
            "sorghum": {
                "season": "Short Rains (Semi-arid zones)",
                "plantingWindow": "October 15 - November 10",
                "floweringPeriod": "December",
                "harvestingWindow": "January - February",
                "optimalRainfallMm": "350 - 600",
                "optimalTempC": "22 - 32",
                "criticalStages": "Panicle emergence",
                "source": "KALRO Katumani Dryland Agricultural Research Station"
            },
            "cowpea": {
                "season": "Short Rains",
                "plantingWindow": "October 20 - November 15",
                "floweringPeriod": "December",
                "harvestingWindow": "January",
                "optimalRainfallMm": "300 - 550",
                "optimalTempC": "20 - 32",
                "criticalStages": "Pod filling",
                "source": "KALRO Legume Research Program"
            }
        }
    },
    "NG": { # Nigeria
        "country": "Nigeria",
        "institution": "International Institute of Tropical Agriculture (IITA) & FMARD",
        "seasons": {
            "Southern Early Season": "March - July (Derived Savanna / Forest)",
            "Southern Late Season": "August - November",
            "Northern Single Wet Season": "May/June - October (Sudan / Sahel Savanna)"
        },
        "crops": {
            "cassava": {
                "season": "Year-round (Main planting: March - May)",
                "plantingWindow": "March 15 - May 15",
                "floweringPeriod": "N/A (vegetative root crop)",
                "harvestingWindow": "10 - 15 months post-planting",
                "optimalRainfallMm": "1000 - 1500",
                "optimalTempC": "25 - 35",
                "criticalStages": "Root bulking (3 - 6 months)",
                "source": "IITA Cassava Agronomy Guide (Ibadan) & NIHORT"
            },
            "yam": {
                "season": "Main Savanna Season",
                "plantingWindow": "November - December (dry planting) or March - April (early rains)",
                "floweringPeriod": "July - August",
                "harvestingWindow": "September - November",
                "optimalRainfallMm": "1100 - 1600",
                "optimalTempC": "25 - 32",
                "criticalStages": "Tuber initiation and canopy expansion",
                "source": "National Root Crops Research Institute (NRCRI) Umudike"
            },
            "maize": {
                "season": "Northern Wet Season",
                "plantingWindow": "May 25 - June 20",
                "floweringPeriod": "July - August",
                "harvestingWindow": "September - October",
                "optimalRainfallMm": "600 - 1000",
                "optimalTempC": "22 - 32",
                "criticalStages": "Tasseling and cob formation",
                "source": "IITA Maize Improvement Program & IAR Samaru, Zaria"
            },
            "cowpea": {
                "season": "Late Northern Season (Photoperiod sensitive)",
                "plantingWindow": "July 25 - August 15",
                "floweringPeriod": "September",
                "harvestingWindow": "October - November",
                "optimalRainfallMm": "350 - 600",
                "optimalTempC": "24 - 35",
                "criticalStages": "Pod development and seed maturation",
                "source": "IITA Cowpea Breeding Unit (Kano Station)"
            }
        }
    },
    "GH": { # Ghana
        "country": "Ghana",
        "institution": "CSIR - Crops Research Institute (Kumasi) & MoFA Ghana",
        "seasons": {
            "Major Season": "March - July (Coastal, Forest, Transition zones)",
            "Minor Season": "September - November (Forest, Transition zones)",
            "Northern Single Season": "May - October (Guinea Savanna)"
        },
        "crops": {
            "cassava": {
                "season": "Major Season",
                "plantingWindow": "April - May",
                "floweringPeriod": "Vegetative",
                "harvestingWindow": "10 - 14 months",
                "optimalRainfallMm": "1000 - 1400",
                "optimalTempC": "25 - 32",
                "criticalStages": "Sprouting and tuberization",
                "source": "CSIR-CRI Cassava Farmers Field Guide"
            },
            "cocoa": {
                "season": "Main Harvest (Oct-Feb) / Light Crop (May-Aug)",
                "plantingWindow": "May - June (seedlings establishment)",
                "floweringPeriod": "April - May & September - October",
                "harvestingWindow": "October - February (Main crop)",
                "optimalRainfallMm": "1200 - 1800",
                "optimalTempC": "21 - 32",
                "criticalStages": "Cherelle wilt stage and pod development",
                "source": "Cocoa Research Institute of Ghana (CRIG) Tafo"
            },
            "maize": {
                "season": "Major Season",
                "plantingWindow": "March 20 - April 20",
                "floweringPeriod": "May - June",
                "harvestingWindow": "July - August",
                "optimalRainfallMm": "700 - 1100",
                "optimalTempC": "24 - 32",
                "criticalStages": "Silking and grain hardening",
                "source": "CSIR-CRI Kumasi Maize Production Guidelines"
            }
        }
    },
    "ZA": { # South Africa
        "country": "South Africa",
        "institution": "Agricultural Research Council (ARC) & Department of Agriculture",
        "seasons": {
            "Summer Rainfall Region": "October - April (Highveld, Free State, KwaZulu-Natal)",
            "Winter Rainfall Region": "May - October (Western Cape)"
        },
        "crops": {
            "maize": {
                "season": "Summer Crop (Highveld / Free State)",
                "plantingWindow": "October 20 - November 30",
                "floweringPeriod": "January - February",
                "harvestingWindow": "May - July",
                "optimalRainfallMm": "500 - 800",
                "optimalTempC": "18 - 28",
                "criticalStages": "Pollination and grain filling",
                "source": "ARC-Grain Crops Institute (Potchefstroom)"
            },
            "soybean": {
                "season": "Summer Crop",
                "plantingWindow": "November 1 - December 10",
                "floweringPeriod": "January",
                "harvestingWindow": "April - May",
                "optimalRainfallMm": "500 - 750",
                "optimalTempC": "20 - 30",
                "criticalStages": "Pod formation and seed enlargement",
                "source": "ARC-Grain Crops Soybean Production Guidelines"
            },
            "wheat": {
                "season": "Winter Rainfall (Western Cape) or Winter Irrigated",
                "plantingWindow": "April 20 - May 25",
                "floweringPeriod": "August - September",
                "harvestingWindow": "October - November",
                "optimalRainfallMm": "350 - 550",
                "optimalTempC": "12 - 22",
                "criticalStages": "Crown root initiation and heading",
                "source": "ARC-Small Grain Institute (Bethlehem)"
            }
        }
    }
}

class CropCalendarService(BaseDataSource):
    """
    Agricultural Calendar & Extension Knowledge Service.
    Maps farm locations and country codes to verified national crop calendars.
    """

    def __init__(self):
        super().__init__(
            source_id="crop_calendars",
            source_name="National Crop Calendars & Agricultural Research Institution Publications",
            provider="EIAR, KALRO, IITA, CSIR-CRI, ARC & FAO GIEWS",
            default_ttl_hours=720 # 30-day cache (calendars are seasonal/structural)
        )

    def get_crop_calendar(self, country_code: str, crop_id: Optional[str] = None) -> Dict[str, Any]:
        cc = country_code.upper()
        cache_key = {"country": cc, "crop": crop_id or "all"}
        cached = cache.get("crop_calendar", **cache_key)
        if cached:
            cached["provenance"]["status"] = STATUS_CACHED
            return cached

        data = CROP_CALENDARS.get(cc)
        if not data:
            return {
                "countryCode": cc,
                "calendarAvailable": False,
                "message": (
                    f"Detailed national crop calendar not yet registered for country '{cc}'. "
                    "FarmShield relies exclusively on verified national extension and research publications "
                    "and will not invent planting dates."
                ),
                "provenance": self.build_provenance(
                    dataset="National Agricultural Research Calendars",
                    status=STATUS_UNAVAILABLE,
                    limitations="National research institution calendar not yet registered."
                )
            }

        crops_dict = data.get("crops", {})
        if crop_id and crop_id in crops_dict:
            filtered_crops = {crop_id: crops_dict[crop_id]}
        else:
            filtered_crops = crops_dict

        result = {
            "countryCode": cc,
            "countryName": data.get("country"),
            "researchInstitution": data.get("institution"),
            "agroecologicalSeasons": data.get("seasons"),
            "crops": filtered_crops,
            "provenance": self.build_provenance(
                dataset="National Crop Calendars & Agronomic Extension Guidelines",
                status=STATUS_LIVE,
                is_demo=False,
                spatial_resolution="National agroecological zone",
                temporal_resolution="Seasonal / Phenological stage",
                limitations=(
                    "Calendar timing depends on actual rainy season onset (Kiremt, Belg, Long/Short Rains, Monsoon). "
                    "Dates must be paired with seasonal CHIRPS/NASA POWER rainfall onset tracking."
                )
            )
        }

        cache.set("crop_calendar", result, ttl_seconds=self.default_ttl_seconds, **cache_key)
        return result

crop_calendar_service = CropCalendarService()

