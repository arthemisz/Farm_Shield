import json
import os

# 54 UN / African Union recognized sovereign states
# ISO 3166-1 alpha-2, official names, administrative divisions, currency, measurement units, region, coordinates
AFRICAN_COUNTRIES = [
    # --- NORTH AFRICA (6) ---
    {
        "id": "DZ", "isoCode": "DZ", "name": "Algeria", "flag": "🇩🇿",
        "region": "North Africa",
        "currency": {"name": "Algerian Dinar", "code": "DZD", "symbol": "د.ج"},
        "defaultLanguage": "ar",
        "supportedLanguages": [
            {"code": "ar", "name": "Arabic", "nativeName": "العربية", "dir": "rtl"},
            {"code": "fr", "name": "French", "nativeName": "Français"},
            {"code": "ber", "name": "Tamazight", "nativeName": "Tamaziɣt"}
        ],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province (Wilaya)", "pluralName": "Provinces", "placeholder": "Select Wilaya"},
            {"level": 2, "name": "District (Daïra)", "pluralName": "Districts", "placeholder": "Select Daïra"},
            {"level": 3, "name": "Commune (Baladiyah)", "pluralName": "Communes", "placeholder": "Select Baladiyah"}
        ],
        "supportedCrops": ["wheat", "barley"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Climatology and radiation"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Edaphic properties"}
        ],
        "agriculturalSources": ["INRAA (Institut National de la Recherche Agronomique d'Algérie)", "FAO Country Profile"],
        "supportStatus": "in_development",
        "statusMessage": "Mediterranean/Sahara agroecological zones in calibration.",
        "bounds": {"minLat": 18.9, "maxLat": 37.1, "minLng": -8.7, "maxLng": 12.0, "center": [28.0339, 1.6596], "defaultZoom": 5}
    },
    {
        "id": "EG", "isoCode": "EG", "name": "Egypt", "flag": "🇪🇬",
        "region": "North Africa",
        "currency": {"name": "Egyptian Pound", "code": "EGP", "symbol": "E£"},
        "defaultLanguage": "ar",
        "supportedLanguages": [{"code": "ar", "name": "Arabic", "nativeName": "العربية", "dir": "rtl"}, {"code": "en", "name": "English", "nativeName": "English"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Governorate (Muhafazah)", "pluralName": "Governorates", "placeholder": "Select Governorate"},
            {"level": 2, "name": "Markaz / Kism", "pluralName": "Markaz", "placeholder": "Select Markaz"}
        ],
        "supportedCrops": ["wheat", "maize", "rice", "faba_bean", "barley"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Nile basin radiation & evapotranspiration"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Nile Delta alluvium & desert soils"}
        ],
        "agriculturalSources": ["Agricultural Research Center (ARC Egypt)", "Ministry of Agriculture and Land Reclamation", "FAO Egypt"],
        "supportStatus": "in_development",
        "statusMessage": "Nile irrigated agriculture parameters active.",
        "bounds": {"minLat": 22.0, "maxLat": 31.7, "minLng": 24.7, "maxLng": 36.9, "center": [26.8206, 30.8025], "defaultZoom": 5}
    },
    {
        "id": "LY", "isoCode": "LY", "name": "Libya", "flag": "🇱🇾",
        "region": "North Africa",
        "currency": {"name": "Libyan Dinar", "code": "LYD", "symbol": "ل.د"},
        "defaultLanguage": "ar",
        "supportedLanguages": [{"code": "ar", "name": "Arabic", "nativeName": "العربية", "dir": "rtl"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "District (Shabiyah)", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 2, "name": "Municipality (Baladiyah)", "pluralName": "Municipalities", "placeholder": "Select Municipality"}
        ],
        "supportedCrops": ["barley", "wheat"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Hyper-arid & coastal climatology"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Arenosols and Calcisols"}
        ],
        "agriculturalSources": ["Agricultural Research Center of Libya", "FAO Libya"],
        "supportStatus": "planned",
        "bounds": {"minLat": 19.5, "maxLat": 33.2, "minLng": 9.4, "maxLng": 25.2, "center": [26.3351, 17.2283], "defaultZoom": 5}
    },
    {
        "id": "MA", "isoCode": "MA", "name": "Morocco", "flag": "🇲🇦",
        "region": "North Africa",
        "currency": {"name": "Moroccan Dirham", "code": "MAD", "symbol": "د.م."},
        "defaultLanguage": "ar",
        "supportedLanguages": [{"code": "ar", "name": "Arabic", "nativeName": "العربية", "dir": "rtl"}, {"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "Province / Prefecture", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 3, "name": "Commune", "pluralName": "Communes", "placeholder": "Select Commune"}
        ],
        "supportedCrops": ["wheat", "barley", "faba_bean"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Atlantic & Atlas mountain climatology"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Cambisols, Luvisols"}
        ],
        "agriculturalSources": ["INRA (Institut National de la Recherche Agronomique Maroc)", "FAO Morocco"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 27.6, "maxLat": 35.9, "minLng": -13.2, "maxLng": -1.0, "center": [31.7917, -7.0926], "defaultZoom": 5}
    },
    {
        "id": "SD", "isoCode": "SD", "name": "Sudan", "flag": "🇸🇩",
        "region": "North Africa",
        "currency": {"name": "Sudanese Pound", "code": "SDG", "symbol": "ج.س."},
        "defaultLanguage": "ar",
        "supportedLanguages": [{"code": "ar", "name": "Arabic", "nativeName": "العربية", "dir": "rtl"}, {"code": "en", "name": "English", "nativeName": "English"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "State (Wilayah)", "pluralName": "States", "placeholder": "Select State"},
            {"level": 2, "name": "Locality (Mahaliyah)", "pluralName": "Localities", "placeholder": "Select Locality"}
        ],
        "supportedCrops": ["sorghum", "millet", "wheat", "groundnut", "cowpea"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Sahelian & Gezira irrigation climate"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Vertisols (Gezira clay)"}
        ],
        "agriculturalSources": ["Agricultural Research Corporation (ARC Sudan)", "FAO Sudan"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 8.7, "maxLat": 22.2, "minLng": 21.8, "maxLng": 38.6, "center": [12.8628, 30.2176], "defaultZoom": 5}
    },
    {
        "id": "TN", "isoCode": "TN", "name": "Tunisia", "flag": "🇹🇳",
        "region": "North Africa",
        "currency": {"name": "Tunisian Dinar", "code": "TND", "symbol": "د.ت"},
        "defaultLanguage": "ar",
        "supportedLanguages": [{"code": "ar", "name": "Arabic", "nativeName": "العربية", "dir": "rtl"}, {"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Governorate (Wilayah)", "pluralName": "Governorates", "placeholder": "Select Governorate"},
            {"level": 2, "name": "Delegation (Mu'tamadiyyah)", "pluralName": "Delegations", "placeholder": "Select Delegation"},
            {"level": 3, "name": "Sector (Imada)", "pluralName": "Sectors", "placeholder": "Select Imada"}
        ],
        "supportedCrops": ["wheat", "barley", "faba_bean"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Tell Atlas & Sahelian transition"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Vertisols & Calcisols"}
        ],
        "agriculturalSources": ["INRAT (Institut National de la Recherche Agronomique de Tunisie)", "FAO Tunisia"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 30.2, "maxLat": 37.5, "minLng": 7.5, "maxLng": 11.6, "center": [33.8869, 9.5375], "defaultZoom": 6}
    },

    # --- EAST AFRICA (14) ---
    {
        "id": "BI", "isoCode": "BI", "name": "Burundi", "flag": "🇧🇮",
        "region": "East Africa",
        "currency": {"name": "Burundian Franc", "code": "BIF", "symbol": "FBu"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "rn", "name": "Kirundi", "nativeName": "Ikirundi"}, {"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 2, "name": "Commune", "pluralName": "Communes", "placeholder": "Select Commune"},
            {"level": 3, "name": "Colline (Hill)", "pluralName": "Collines", "placeholder": "Select Colline"}
        ],
        "supportedCrops": ["banana", "cassava", "sweet_potato", "common_bean", "maize", "coffee"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Highland tropical rainfall"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols & Acrisols"}
        ],
        "agriculturalSources": ["ISABU (Institut des Sciences Agronomiques du Burundi)", "FAO Burundi"],
        "supportStatus": "planned",
        "bounds": {"minLat": -4.5, "maxLat": -2.3, "minLng": 29.0, "maxLng": 30.9, "center": [-3.3731, 29.9189], "defaultZoom": 7}
    },
    {
        "id": "KM", "isoCode": "KM", "name": "Comoros", "flag": "🇰🇲",
        "region": "East Africa",
        "currency": {"name": "Comorian Franc", "code": "KMF", "symbol": "CF"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "ar", "name": "Arabic", "nativeName": "العربية"}, {"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Autonomous Island", "pluralName": "Islands", "placeholder": "Select Island"},
            {"level": 2, "name": "Prefecture", "pluralName": "Prefectures", "placeholder": "Select Prefecture"}
        ],
        "supportedCrops": ["cassava", "banana", "sweet_potato"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Maritime tropical regime"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Volcanic Andosols"}
        ],
        "agriculturalSources": ["INRAPE Comoros", "FAO Comoros"],
        "supportStatus": "planned",
        "bounds": {"minLat": -12.4, "maxLat": -11.3, "minLng": 43.2, "maxLng": 44.5, "center": [-11.6455, 43.3333], "defaultZoom": 8}
    },
    {
        "id": "DJ", "isoCode": "DJ", "name": "Djibouti", "flag": "🇩🇯",
        "region": "East Africa",
        "currency": {"name": "Djiboutian Franc", "code": "DJF", "symbol": "Fdj"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "ar", "name": "Arabic", "nativeName": "العربية"}, {"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "District", "pluralName": "Districts", "placeholder": "Select District"}
        ],
        "supportedCrops": ["sorghum", "millet"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Arid Afar depression"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Leptosols & Regosols"}
        ],
        "agriculturalSources": ["CERD Djibouti", "FAO Djibouti"],
        "supportStatus": "planned",
        "bounds": {"minLat": 10.9, "maxLat": 12.7, "minLng": 41.7, "maxLng": 43.4, "center": [11.8251, 42.5903], "defaultZoom": 8}
    },
    {
        "id": "ER", "isoCode": "ER", "name": "Eritrea", "flag": "🇪🇷",
        "region": "East Africa",
        "currency": {"name": "Eritrean Nakfa", "code": "ERN", "symbol": "Nkf"},
        "defaultLanguage": "ti",
        "supportedLanguages": [{"code": "ti", "name": "Tigrinya", "nativeName": "ትግርኛ"}, {"code": "ar", "name": "Arabic", "nativeName": "العربية"}, {"code": "en", "name": "English", "nativeName": "English"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region (Zoba)", "pluralName": "Zobas", "placeholder": "Select Zoba"},
            {"level": 2, "name": "Sub-Region", "pluralName": "Sub-Regions", "placeholder": "Select Sub-Region"}
        ],
        "supportedCrops": ["teff", "barley", "sorghum", "millet", "wheat", "faba_bean"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Horn of Africa highlands and lowlands"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Cambisols, Vertisols"}
        ],
        "agriculturalSources": ["NARI (National Agricultural Research Institute Eritrea)", "FAO Eritrea"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 12.3, "maxLat": 18.0, "minLng": 36.4, "maxLng": 43.1, "center": [15.1794, 39.7823], "defaultZoom": 6}
    },
    {
        "id": "ET", "isoCode": "ET", "name": "Ethiopia", "flag": "🇪🇹",
        "region": "East Africa",
        "currency": {"name": "Ethiopian Birr", "code": "ETB", "symbol": "Br"},
        "defaultLanguage": "en",
        "supportedLanguages": [
            {"code": "en", "name": "English", "nativeName": "English"},
            {"code": "am", "name": "Amharic", "nativeName": "አማርኛ"},
            {"code": "om", "name": "Afaan Oromoo", "nativeName": "Afaan Oromoo"},
            {"code": "ti", "name": "Tigrinya", "nativeName": "ትግርኛ"}
        ],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "Zone", "pluralName": "Zones", "placeholder": "Select Zone"},
            {"level": 3, "name": "Woreda", "pluralName": "Woredas", "placeholder": "Select Woreda"}
        ],
        "supportedCrops": ["teff", "wheat", "maize", "faba_bean", "barley", "sorghum", "millet", "chickpea", "coffee"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global (0.5° × 0.5°)", "status": "active", "notes": "Climatological and real-time precipitation and temperature"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC — World Soil Information", "coverage": "Global (250m)", "status": "active", "notes": "Standardized depth-resolved soil properties"},
            {"name": "Microsoft Planetary Computer", "type": "mapping", "provider": "Microsoft / ESA / Copernicus", "coverage": "Global (10m - 500m)", "status": "active", "notes": "Sentinel-2 L2A & MODIS vegetation dynamics"}
        ],
        "agriculturalSources": ["Ethiopian Institute of Agricultural Research (EIAR)", "Ministry of Agriculture Ethiopia", "CGIAR CIMMYT Ethiopia"],
        "supportStatus": "fully_supported",
        "bounds": {"minLat": 3.4, "maxLat": 14.9, "minLng": 33.0, "maxLng": 48.0, "center": [9.145, 40.489673], "defaultZoom": 6}
    },
    {
        "id": "KE", "isoCode": "KE", "name": "Kenya", "flag": "🇰🇪",
        "region": "East Africa",
        "currency": {"name": "Kenyan Shilling", "code": "KES", "symbol": "KSh"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}, {"code": "sw", "name": "Swahili", "nativeName": "Kiswahili"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "County", "pluralName": "Counties", "placeholder": "Select County"},
            {"level": 2, "name": "Sub-County", "pluralName": "Sub-Counties", "placeholder": "Select Sub-County"},
            {"level": 3, "name": "Ward", "pluralName": "Wards", "placeholder": "Select Ward"}
        ],
        "supportedCrops": ["maize", "wheat", "tea", "coffee", "sorghum", "millet", "common_bean", "cassava", "sweet_potato", "banana"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Bimodal rainfall seasons (Long & Short rains)"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Nitisols, Ferralsols, Planosols"}
        ],
        "agriculturalSources": ["KALRO (Kenya Agricultural and Livestock Research Organization)", "Ministry of Agriculture and Livestock Development", "ICRAF"],
        "supportStatus": "fully_supported",
        "bounds": {"minLat": -4.7, "maxLat": 5.0, "minLng": 33.9, "maxLng": 41.9, "center": [0.0236, 37.9062], "defaultZoom": 6}
    },
    {
        "id": "MG", "isoCode": "MG", "name": "Madagascar", "flag": "🇲🇬",
        "region": "East Africa",
        "currency": {"name": "Malagasy Ariary", "code": "MGA", "symbol": "Ar"},
        "defaultLanguage": "mg",
        "supportedLanguages": [{"code": "mg", "name": "Malagasy", "nativeName": "Malagasy"}, {"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region (Faritra)", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "District (Fivondronana)", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 3, "name": "Commune (Kaominina)", "pluralName": "Communes", "placeholder": "Select Commune"}
        ],
        "supportedCrops": ["rice", "cassava", "sweet_potato", "maize", "banana"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Indian ocean monsoon & cyclone tracking"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols (Red island)"}
        ],
        "agriculturalSources": ["FOFIFA (Centre National de la Recherche Appliquée au Développement Rural)", "FAO Madagascar"],
        "supportStatus": "in_development",
        "bounds": {"minLat": -25.6, "maxLat": -11.9, "minLng": 43.2, "maxLng": 50.5, "center": [-18.7669, 46.8691], "defaultZoom": 5}
    },
    {
        "id": "MW", "isoCode": "MW", "name": "Malawi", "flag": "🇲🇼",
        "region": "East Africa",
        "currency": {"name": "Malawian Kwacha", "code": "MWK", "symbol": "MK"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}, {"code": "ny", "name": "Chichewa", "nativeName": "Chichewa"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "District", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 3, "name": "Traditional Authority", "pluralName": "Traditional Authorities", "placeholder": "Select Authority"}
        ],
        "supportedCrops": ["maize", "cassava", "groundnut", "soybean", "common_bean", "sweet_potato"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Lake Malawi basin uni-modal rainfall"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Luvisols & Ferralsols"}
        ],
        "agriculturalSources": ["DARS (Department of Agricultural Research Services Malawi)", "Chitedze Research Station", "FAO Malawi"],
        "supportStatus": "in_development",
        "bounds": {"minLat": -17.1, "maxLat": -9.4, "minLng": 32.7, "maxLng": 35.9, "center": [-13.2543, 34.3015], "defaultZoom": 6}
    },
    {
        "id": "MU", "isoCode": "MU", "name": "Mauritius", "flag": "🇲🇺",
        "region": "East Africa",
        "currency": {"name": "Mauritian Rupee", "code": "MUR", "symbol": "₨"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}, {"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "District", "pluralName": "Districts", "placeholder": "Select District"}
        ],
        "supportedCrops": ["banana", "cassava"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Tropical maritime"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Volcanic soils"}
        ],
        "agriculturalSources": ["FAREI Mauritius", "FAO Mauritius"],
        "supportStatus": "planned",
        "bounds": {"minLat": -20.5, "maxLat": -19.9, "minLng": 57.3, "maxLng": 57.8, "center": [-20.3484, 57.5522], "defaultZoom": 9}
    },
    {
        "id": "MZ", "isoCode": "MZ", "name": "Mozambique", "flag": "🇲🇿",
        "region": "East Africa",
        "currency": {"name": "Mozambican Metical", "code": "MZN", "symbol": "MT"},
        "defaultLanguage": "pt",
        "supportedLanguages": [{"code": "pt", "name": "Portuguese", "nativeName": "Português"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 2, "name": "District", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 3, "name": "Posto Administrativo", "pluralName": "Postos", "placeholder": "Select Posto"}
        ],
        "supportedCrops": ["cassava", "maize", "rice", "cowpea", "groundnut", "sweet_potato"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Zambezi & Limpopo basin hydrology"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Arenosols & Ferralsols"}
        ],
        "agriculturalSources": ["IIAM (Instituto de Investigação Agrária de Moçambique)", "FAO Mozambique"],
        "supportStatus": "in_development",
        "bounds": {"minLat": -26.9, "maxLat": -10.5, "minLng": 30.2, "maxLng": 40.8, "center": [-18.6657, 35.5296], "defaultZoom": 5}
    },
    {
        "id": "RW", "isoCode": "RW", "name": "Rwanda", "flag": "🇷🇼",
        "region": "East Africa",
        "currency": {"name": "Rwandan Franc", "code": "RWF", "symbol": "FRw"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "rw", "name": "Kinyarwanda", "nativeName": "Ikinyarwanda"}, {"code": "en", "name": "English", "nativeName": "English"}, {"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province (Intara)", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 2, "name": "District (Akarere)", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 3, "name": "Sector (Umurenge)", "pluralName": "Sectors", "placeholder": "Select Sector"},
            {"level": 4, "name": "Cell (Akagari)", "pluralName": "Cells", "placeholder": "Select Cell"}
        ],
        "supportedCrops": ["banana", "common_bean", "cassava", "maize", "sweet_potato", "coffee", "tea"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Highland tropical terrain with microclimates"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols, Andosols on volcanic slopes"}
        ],
        "agriculturalSources": ["RAB (Rwanda Agriculture and Animal Resources Development Board)", "Ministry of Agriculture and Animal Resources (MINAGRI)"],
        "supportStatus": "fully_supported",
        "bounds": {"minLat": -2.8, "maxLat": -1.0, "minLng": 28.8, "maxLng": 30.9, "center": [-1.9403, 29.8739], "defaultZoom": 8}
    },
    {
        "id": "SC", "isoCode": "SC", "name": "Seychelles", "flag": "🇸🇨",
        "region": "East Africa",
        "currency": {"name": "Seychellois Rupee", "code": "SCR", "symbol": "SR"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "crs", "name": "Seychellois Creole", "nativeName": "Kreol"}, {"code": "en", "name": "English", "nativeName": "English"}, {"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "District", "pluralName": "Districts", "placeholder": "Select District"}
        ],
        "supportedCrops": ["banana", "cassava", "sweet_potato"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Granitic island equatorial marine"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Humic Ferralsols"}
        ],
        "agriculturalSources": ["Seychelles Agricultural Agency", "FAO Seychelles"],
        "supportStatus": "planned",
        "bounds": {"minLat": -10.3, "maxLat": -4.2, "minLng": 46.2, "maxLng": 56.3, "center": [-4.6796, 55.492], "defaultZoom": 9}
    },
    {
        "id": "SO", "isoCode": "SO", "name": "Somalia", "flag": "🇸🇴",
        "region": "East Africa",
        "currency": {"name": "Somali Shilling", "code": "SOS", "symbol": "Sh.So."},
        "defaultLanguage": "so",
        "supportedLanguages": [{"code": "so", "name": "Somali", "nativeName": "Soomaali"}, {"code": "ar", "name": "Arabic", "nativeName": "العربية"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Federal Member State", "pluralName": "States", "placeholder": "Select State"},
            {"level": 2, "name": "Region (Gobol)", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 3, "name": "District (Degmo)", "pluralName": "Districts", "placeholder": "Select District"}
        ],
        "supportedCrops": ["sorghum", "maize", "cowpea", "millet"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Juba and Shabelle river basins, Gu and Deyr seasons"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Calcisols, Gypsisols, Vertisols"}
        ],
        "agriculturalSources": ["Ministry of Agriculture and Irrigation Somalia", "FAO SWALIM"],
        "supportStatus": "in_development",
        "bounds": {"minLat": -1.7, "maxLat": 12.0, "minLng": 40.9, "maxLng": 51.4, "center": [5.1521, 46.1996], "defaultZoom": 5}
    },
    {
        "id": "SS", "isoCode": "SS", "name": "South Sudan", "flag": "🇸🇸",
        "region": "East Africa",
        "currency": {"name": "South Sudanese Pound", "code": "SSP", "symbol": "£"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}, {"code": "ar", "name": "Arabic", "nativeName": "العربية"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "State", "pluralName": "States", "placeholder": "Select State"},
            {"level": 2, "name": "County", "pluralName": "Counties", "placeholder": "Select County"},
            {"level": 3, "name": "Payam", "pluralName": "Payams", "placeholder": "Select Payam"}
        ],
        "supportedCrops": ["sorghum", "maize", "millet", "cassava", "groundnut"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Sudd wetland & Green Belt agroecology"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Vertisols & Plinthosols"}
        ],
        "agriculturalSources": ["Ministry of Agriculture and Food Security South Sudan", "FAO South Sudan"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 3.5, "maxLat": 12.2, "minLng": 24.1, "maxLng": 36.0, "center": [6.877, 31.307], "defaultZoom": 6}
    },
    {
        "id": "TZ", "isoCode": "TZ", "name": "Tanzania", "flag": "🇹🇿",
        "region": "East Africa",
        "currency": {"name": "Tanzanian Shilling", "code": "TZS", "symbol": "TSh"},
        "defaultLanguage": "sw",
        "supportedLanguages": [{"code": "sw", "name": "Swahili", "nativeName": "Kiswahili"}, {"code": "en", "name": "English", "nativeName": "English"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region (Mkoa)", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "District (Wilaya)", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 3, "name": "Ward (Kata)", "pluralName": "Wards", "placeholder": "Select Ward"}
        ],
        "supportedCrops": ["maize", "rice", "cassava", "common_bean", "sorghum", "banana", "sweet_potato", "coffee", "tea", "cowpea", "groundnut"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Southern Highlands, Coastal belt, Lake Victoria basin"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols, Acrisols, Vertisols (mbuga)"}
        ],
        "agriculturalSources": ["TARI (Tanzania Agricultural Research Institute)", "Ministry of Agriculture Tanzania", "IITA Tanzania"],
        "supportStatus": "fully_supported",
        "bounds": {"minLat": -11.7, "maxLat": -0.9, "minLng": 29.3, "maxLng": 40.5, "center": [-6.369, 34.8888], "defaultZoom": 6}
    },
    {
        "id": "UG", "isoCode": "UG", "name": "Uganda", "flag": "🇺🇬",
        "region": "East Africa",
        "currency": {"name": "Ugandan Shilling", "code": "UGX", "symbol": "USh"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}, {"code": "sw", "name": "Swahili", "nativeName": "Kiswahili"}, {"code": "lg", "name": "Luganda", "nativeName": "Luganda"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "District", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 3, "name": "County / Municipality", "pluralName": "Counties", "placeholder": "Select County"},
            {"level": 4, "name": "Sub-County", "pluralName": "Sub-Counties", "placeholder": "Select Sub-County"}
        ],
        "supportedCrops": ["banana", "cassava", "maize", "sweet_potato", "common_bean", "millet", "sorghum", "coffee", "groundnut", "rice"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Equatorial bi-modal rainfall regime"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols (Red deep fertile clays)"}
        ],
        "agriculturalSources": ["NARO (National Agricultural Research Organisation Uganda)", "Ministry of Agriculture, Animal Industry and Fisheries (MAAIF)"],
        "supportStatus": "fully_supported",
        "bounds": {"minLat": -1.5, "maxLat": 4.2, "minLng": 29.5, "maxLng": 35.0, "center": [1.3733, 32.2903], "defaultZoom": 7}
    },
    {
        "id": "ZM", "isoCode": "ZM", "name": "Zambia", "flag": "🇿🇲",
        "region": "East Africa", # Also Southern
        "currency": {"name": "Zambian Kwacha", "code": "ZMW", "symbol": "ZK"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}, {"code": "bem", "name": "Bemba", "nativeName": "Chibemba"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 2, "name": "District", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 3, "name": "Ward", "pluralName": "Wards", "placeholder": "Select Ward"}
        ],
        "supportedCrops": ["maize", "cassava", "soybean", "groundnut", "wheat", "sorghum", "millet"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Agroecological Regions I, II, III"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Acrisols, Ferralsols, Arenosols"}
        ],
        "agriculturalSources": ["ZARI (Zambia Agriculture Research Institute)", "Ministry of Agriculture Zambia"],
        "supportStatus": "in_development",
        "bounds": {"minLat": -18.1, "maxLat": -8.2, "minLng": 22.0, "maxLng": 33.7, "center": [-13.1339, 27.8493], "defaultZoom": 6}
    },
    {
        "id": "ZW", "isoCode": "ZW", "name": "Zimbabwe", "flag": "🇿🇼",
        "region": "East Africa", # Also Southern
        "currency": {"name": "Zimbabwe Gold / USD", "code": "ZWG", "symbol": "ZiG"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}, {"code": "sn", "name": "Shona", "nativeName": "chiShona"}, {"code": "nd", "name": "Ndebele", "nativeName": "isiNdebele"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 2, "name": "District", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 3, "name": "Ward", "pluralName": "Wards", "placeholder": "Select Ward"}
        ],
        "supportedCrops": ["maize", "sorghum", "millet", "soybean", "groundnut", "wheat"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Natural Regions I to V (Highveld to Lowveld)"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Fersiallitic & Paraferrallitic soils"}
        ],
        "agriculturalSources": ["DR&SS (Department of Research and Specialist Services Zimbabwe)", "FAO Zimbabwe"],
        "supportStatus": "in_development",
        "bounds": {"minLat": -22.4, "maxLat": -15.6, "minLng": 25.2, "maxLng": 33.1, "center": [-19.0154, 29.1549], "defaultZoom": 6}
    },

    # --- WEST AFRICA (16) ---
    {
        "id": "BJ", "isoCode": "BJ", "name": "Benin", "flag": "🇧🇯",
        "region": "West Africa",
        "currency": {"name": "West African CFA Franc", "code": "XOF", "symbol": "CFA"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Department", "pluralName": "Departments", "placeholder": "Select Department"},
            {"level": 2, "name": "Commune", "pluralName": "Communes", "placeholder": "Select Commune"},
            {"level": 3, "name": "Arrondissement", "pluralName": "Arrondissements", "placeholder": "Select Arrondissement"}
        ],
        "supportedCrops": ["maize", "cassava", "yam", "cowpea", "sorghum", "rice"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Dahomey Gap sub-humid to sudanian"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols, Luvisols"}
        ],
        "agriculturalSources": ["INRAB (Institut National des Recherches Agricoles du Bénin)", "FAO Benin"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 6.2, "maxLat": 12.4, "minLng": 0.8, "maxLng": 3.8, "center": [9.3077, 2.3158], "defaultZoom": 7}
    },
    {
        "id": "BF", "isoCode": "BF", "name": "Burkina Faso", "flag": "🇧🇫",
        "region": "West Africa",
        "currency": {"name": "West African CFA Franc", "code": "XOF", "symbol": "CFA"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "fr", "name": "French", "nativeName": "Français"}, {"code": "mos", "name": "Mooré", "nativeName": "Mòoré"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "Province", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 3, "name": "Department", "pluralName": "Departments", "placeholder": "Select Department"}
        ],
        "supportedCrops": ["sorghum", "millet", "maize", "cowpea", "groundnut", "rice"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Sahelian & Sudanian single rainy season"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Lixisols, Plinthosols, Cambisols"}
        ],
        "agriculturalSources": ["INERA (Institut de l'Environnement et de Recherches Agricoles)", "FAO Burkina Faso"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 9.4, "maxLat": 15.1, "minLng": -5.5, "maxLng": 2.4, "center": [12.2383, -1.5616], "defaultZoom": 6}
    },
    {
        "id": "CV", "isoCode": "CV", "name": "Cabo Verde", "flag": "🇨🇻",
        "region": "West Africa",
        "currency": {"name": "Cape Verdean Escudo", "code": "CVE", "symbol": "Esc"},
        "defaultLanguage": "pt",
        "supportedLanguages": [{"code": "pt", "name": "Portuguese", "nativeName": "Português"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Municipality (Concelho)", "pluralName": "Municipalities", "placeholder": "Select Municipality"},
            {"level": 2, "name": "Parish (Freguesia)", "pluralName": "Parishes", "placeholder": "Select Parish"}
        ],
        "supportedCrops": ["maize", "sweet_potato", "cassava", "banana"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Arid island archipelago"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Volcanic Leptosols"}
        ],
        "agriculturalSources": ["INIDA Cabo Verde", "FAO Cabo Verde"],
        "supportStatus": "planned",
        "bounds": {"minLat": 14.8, "maxLat": 17.2, "minLng": -25.4, "maxLng": -22.6, "center": [16.5388, -23.0418], "defaultZoom": 8}
    },
    {
        "id": "CI", "isoCode": "CI", "name": "Côte d'Ivoire", "flag": "🇨🇮",
        "region": "West Africa",
        "currency": {"name": "West African CFA Franc", "code": "XOF", "symbol": "CFA"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "District", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 2, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 3, "name": "Department", "pluralName": "Departments", "placeholder": "Select Department"}
        ],
        "supportedCrops": ["cocoa", "cassava", "yam", "plantain", "rice", "maize", "coffee"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Equatorial forest to savanna transition"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols, Acrisols"}
        ],
        "agriculturalSources": ["CNRA (Centre National de Recherche Agronomique)", "ICCO", "FAO Côte d'Ivoire"],
        "supportStatus": "fully_supported",
        "bounds": {"minLat": 4.3, "maxLat": 10.7, "minLng": -8.6, "maxLng": -2.5, "center": [7.54, -5.5471], "defaultZoom": 6}
    },
    {
        "id": "GM", "isoCode": "GM", "name": "Gambia", "flag": "🇬🇲",
        "region": "West Africa",
        "currency": {"name": "Gambian Dalasi", "code": "GMD", "symbol": "D"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}, {"code": "wo", "name": "Wolof", "nativeName": "Wolof"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region (Division)", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "District", "pluralName": "Districts", "placeholder": "Select District"}
        ],
        "supportedCrops": ["groundnut", "millet", "sorghum", "rice", "maize"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Gambia River alluvial regime"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Fluvisols, Arenosols"}
        ],
        "agriculturalSources": ["NARI (National Agricultural Research Institute Gambia)", "FAO Gambia"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 13.0, "maxLat": 13.8, "minLng": -16.8, "maxLng": -13.8, "center": [13.4432, -15.3101], "defaultZoom": 8}
    },
    {
        "id": "GH", "isoCode": "GH", "name": "Ghana", "flag": "🇬🇭",
        "region": "West Africa",
        "currency": {"name": "Ghanaian Cedi", "code": "GHS", "symbol": "GH₵"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}, {"code": "ak", "name": "Akan/Twi", "nativeName": "Akan"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "District / Municipal / Metro", "pluralName": "Districts", "placeholder": "Select District"}
        ],
        "supportedCrops": ["cocoa", "cassava", "yam", "plantain", "maize", "rice", "sorghum", "cowpea", "groundnut"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Coastal, Forest, Guinea Savanna ecological zones"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Acrisols, Lixisols, Fluvisols"}
        ],
        "agriculturalSources": ["CSIR (Council for Scientific and Industrial Research Ghana) - CRI / SRI", "Ministry of Food and Agriculture (MoFA)", "Cocoa Research Institute of Ghana (CRIG)"],
        "supportStatus": "fully_supported",
        "bounds": {"minLat": 4.7, "maxLat": 11.2, "minLng": -3.3, "maxLng": 1.2, "center": [7.9465, -1.0232], "defaultZoom": 6}
    },
    {
        "id": "GN", "isoCode": "GN", "name": "Guinea", "flag": "🇬🇳",
        "region": "West Africa",
        "currency": {"name": "Guinean Franc", "code": "GNF", "symbol": "FG"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "Prefecture", "pluralName": "Prefectures", "placeholder": "Select Prefecture"},
            {"level": 3, "name": "Sub-Prefecture", "pluralName": "Sub-Prefectures", "placeholder": "Select Sub-Prefecture"}
        ],
        "supportedCrops": ["rice", "cassava", "maize", "groundnut", "banana", "coffee"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Fouta Djallon water tower & coastal rains"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols, Plinthosols"}
        ],
        "agriculturalSources": ["IRAG (Institut de Recherche Agronomique de Guinée)", "FAO Guinea"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 7.2, "maxLat": 12.7, "minLng": -15.1, "maxLng": -7.6, "center": [9.9456, -9.6966], "defaultZoom": 6}
    },
    {
        "id": "GW", "isoCode": "GW", "name": "Guinea-Bissau", "flag": "🇬🇼",
        "region": "West Africa",
        "currency": {"name": "West African CFA Franc", "code": "XOF", "symbol": "CFA"},
        "defaultLanguage": "pt",
        "supportedLanguages": [{"code": "pt", "name": "Portuguese", "nativeName": "Português"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "Sector", "pluralName": "Sectors", "placeholder": "Select Sector"}
        ],
        "supportedCrops": ["rice", "cashew", "cassava", "groundnut", "millet"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Mangrove & low plateau coastal climate"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Gleysols, Ferralsols"}
        ],
        "agriculturalSources": ["INPA Guinea-Bissau", "FAO Guinea-Bissau"],
        "supportStatus": "planned",
        "bounds": {"minLat": 10.9, "maxLat": 12.7, "minLng": -16.7, "maxLng": -13.6, "center": [11.8037, -15.1804], "defaultZoom": 8}
    },
    {
        "id": "LR", "isoCode": "LR", "name": "Liberia", "flag": "🇱🇷",
        "region": "West Africa",
        "currency": {"name": "Liberian Dollar", "code": "LRD", "symbol": "L$"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "County", "pluralName": "Counties", "placeholder": "Select County"},
            {"level": 2, "name": "District", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 3, "name": "Clan", "pluralName": "Clans", "placeholder": "Select Clan"}
        ],
        "supportedCrops": ["rice", "cassava", "cocoa", "plantain"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Upper Guinean rainforest high precipitation"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols"}
        ],
        "agriculturalSources": ["CARI (Central Agricultural Research Institute Liberia)", "Ministry of Agriculture Liberia"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 4.3, "maxLat": 8.6, "minLng": -11.5, "maxLng": -7.4, "center": [6.4281, -9.4295], "defaultZoom": 7}
    },
    {
        "id": "ML", "isoCode": "ML", "name": "Mali", "flag": "🇲🇱",
        "region": "West Africa",
        "currency": {"name": "West African CFA Franc", "code": "XOF", "symbol": "CFA"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "fr", "name": "French", "nativeName": "Français"}, {"code": "bm", "name": "Bambara", "nativeName": "Bamanankan"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "Cercle", "pluralName": "Cercles", "placeholder": "Select Cercle"},
            {"level": 3, "name": "Commune", "pluralName": "Communes", "placeholder": "Select Commune"}
        ],
        "supportedCrops": ["millet", "sorghum", "rice", "maize", "cowpea", "groundnut"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Sahelian & Niger Inner Delta hydrology"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Arenosols, Fluvisols (Office du Niger)"}
        ],
        "agriculturalSources": ["IER (Institut d'Economie Rurale Mali)", "ICRISAT Mali", "FAO Mali"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 10.1, "maxLat": 25.0, "minLng": -12.3, "maxLng": 4.3, "center": [17.5707, -3.9962], "defaultZoom": 5}
    },
    {
        "id": "MR", "isoCode": "MR", "name": "Mauritania", "flag": "🇲🇷",
        "region": "West Africa",
        "currency": {"name": "Mauritanian Ouguiya", "code": "MRU", "symbol": "UM"},
        "defaultLanguage": "ar",
        "supportedLanguages": [{"code": "ar", "name": "Arabic", "nativeName": "العربية", "dir": "rtl"}, {"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region (Wilaya)", "pluralName": "Wilayas", "placeholder": "Select Wilaya"},
            {"level": 2, "name": "Department (Moughataa)", "pluralName": "Moughataas", "placeholder": "Select Moughataa"}
        ],
        "supportedCrops": ["sorghum", "millet", "rice"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Senegal River Valley irrigation vs Sahara"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Fluvisols, Arenosols"}
        ],
        "agriculturalSources": ["CNRADA Mauritanie", "FAO Mauritania"],
        "supportStatus": "planned",
        "bounds": {"minLat": 14.7, "maxLat": 27.3, "minLng": -17.1, "maxLng": -4.8, "center": [21.0079, -10.9408], "defaultZoom": 5}
    },
    {
        "id": "NE", "isoCode": "NE", "name": "Niger", "flag": "🇳🇪",
        "region": "West Africa",
        "currency": {"name": "West African CFA Franc", "code": "XOF", "symbol": "CFA"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "fr", "name": "French", "nativeName": "Français"}, {"code": "ha", "name": "Hausa", "nativeName": "Harshen Hausa"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "Department", "pluralName": "Departments", "placeholder": "Select Department"},
            {"level": 3, "name": "Commune", "pluralName": "Communes", "placeholder": "Select Commune"}
        ],
        "supportedCrops": ["millet", "sorghum", "cowpea", "groundnut"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Sahelian rainfall variability"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Arenosols (sandy dune soils)"}
        ],
        "agriculturalSources": ["INRAN (Institut National de la Recherche Agronomique du Niger)", "ICRISAT Niamey", "FAO Niger"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 11.7, "maxLat": 23.5, "minLng": 0.2, "maxLng": 16.0, "center": [17.6078, 8.0817], "defaultZoom": 5}
    },
    {
        "id": "NG", "isoCode": "NG", "name": "Nigeria", "flag": "🇳🇬",
        "region": "West Africa",
        "currency": {"name": "Nigerian Naira", "code": "NGN", "symbol": "₦"},
        "defaultLanguage": "en",
        "supportedLanguages": [
            {"code": "en", "name": "English", "nativeName": "English"},
            {"code": "ha", "name": "Hausa", "nativeName": "Hausa"},
            {"code": "yo", "name": "Yoruba", "nativeName": "Yorùbá"},
            {"code": "ig", "name": "Igbo", "nativeName": "Asụsụ Igbo"}
        ],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "State", "pluralName": "States", "placeholder": "Select State"},
            {"level": 2, "name": "Local Government Area (LGA)", "pluralName": "LGAs", "placeholder": "Select LGA"},
            {"level": 3, "name": "Ward", "pluralName": "Wards", "placeholder": "Select Ward"}
        ],
        "supportedCrops": ["cassava", "yam", "maize", "sorghum", "millet", "rice", "cowpea", "groundnut", "soybean", "cocoa", "plantain"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Multi-zone: Mangrove, Rain forest, Derived savanna, Guinea & Sudan savanna"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Acrisols, Ferralsols, Luvisols"}
        ],
        "agriculturalSources": ["IITA (International Institute of Tropical Agriculture)", "Federal Ministry of Agriculture and Food Security", "NCRI Badeggi", "NRCRI Umudike"],
        "supportStatus": "fully_supported",
        "bounds": {"minLat": 4.3, "maxLat": 13.9, "minLng": 2.7, "maxLng": 14.7, "center": [9.082, 8.6753], "defaultZoom": 6}
    },
    {
        "id": "SN", "isoCode": "SN", "name": "Senegal", "flag": "🇸🇳",
        "region": "West Africa",
        "currency": {"name": "West African CFA Franc", "code": "XOF", "symbol": "CFA"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "fr", "name": "French", "nativeName": "Français"}, {"code": "wo", "name": "Wolof", "nativeName": "Wolof"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "Department", "pluralName": "Departments", "placeholder": "Select Department"},
            {"level": 3, "name": "Arrondissement", "pluralName": "Arrondissements", "placeholder": "Select Arrondissement"},
            {"level": 4, "name": "Commune", "pluralName": "Communes", "placeholder": "Select Commune"}
        ],
        "supportedCrops": ["groundnut", "millet", "rice", "sorghum", "maize", "cowpea", "cassava"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Groundnut Basin & Casamance sub-humid regime"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Arenosols, Luvisols"}
        ],
        "agriculturalSources": ["ISRA (Institut Sénégalais de Recherches Agricoles)", "AfricaRice Senegal", "FAO Senegal"],
        "supportStatus": "fully_supported",
        "bounds": {"minLat": 12.3, "maxLat": 16.7, "minLng": -17.5, "maxLng": -11.4, "center": [14.4974, -14.4524], "defaultZoom": 7}
    },
    {
        "id": "SL", "isoCode": "SL", "name": "Sierra Leone", "flag": "🇸🇱",
        "region": "West Africa",
        "currency": {"name": "Sierra Leonean Leone", "code": "SLE", "symbol": "Le"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}, {"code": "kri", "name": "Krio", "nativeName": "Krio"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 2, "name": "District", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 3, "name": "Chiefdom", "pluralName": "Chiefdoms", "placeholder": "Select Chiefdom"}
        ],
        "supportedCrops": ["rice", "cassava", "sweet_potato", "cocoa", "coffee", "groundnut"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "High coastal monsoon rainfall"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols"}
        ],
        "agriculturalSources": ["SLARI (Sierra Leone Agricultural Research Institute)", "Rokupr Rice Research Station"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 6.9, "maxLat": 10.0, "minLng": -13.3, "maxLng": -10.3, "center": [8.4606, -11.7799], "defaultZoom": 7}
    },
    {
        "id": "TG", "isoCode": "TG", "name": "Togo", "flag": "🇹🇬",
        "region": "West Africa",
        "currency": {"name": "West African CFA Franc", "code": "XOF", "symbol": "CFA"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "fr", "name": "French", "nativeName": "Français"}, {"code": "ee", "name": "Ewe", "nativeName": "Èʋegbe"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "Prefecture", "pluralName": "Prefectures", "placeholder": "Select Prefecture"},
            {"level": 3, "name": "Commune", "pluralName": "Communes", "placeholder": "Select Commune"}
        ],
        "supportedCrops": ["maize", "cassava", "yam", "sorghum", "cowpea", "rice", "cocoa"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Maritime to savannah corridor"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Acrisols, Ferralsols"}
        ],
        "agriculturalSources": ["ITRA (Institut Togolais de Recherche Agronomique)", "FAO Togo"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 6.1, "maxLat": 11.1, "minLng": -0.1, "maxLng": 1.8, "center": [8.6195, 0.8248], "defaultZoom": 7}
    },

    # --- CENTRAL AFRICA (9) ---
    {
        "id": "CM", "isoCode": "CM", "name": "Cameroon", "flag": "🇨🇲",
        "region": "Central Africa",
        "currency": {"name": "Central African CFA Franc", "code": "XAF", "symbol": "FCFA"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "fr", "name": "French", "nativeName": "Français"}, {"code": "en", "name": "English", "nativeName": "English"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "Department", "pluralName": "Departments", "placeholder": "Select Department"},
            {"level": 3, "name": "Arrondissement", "pluralName": "Arrondissements", "placeholder": "Select Arrondissement"}
        ],
        "supportedCrops": ["cassava", "plantain", "maize", "cocoa", "coffee", "yam", "sorghum", "sweet_potato"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Congo basin forest to Sudano-Sahelian North"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols, Andosols (Mt Cameroon)"}
        ],
        "agriculturalSources": ["IRAD (Institut de Recherche Agricole pour le Développement Cameroon)", "FAO Cameroon"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 1.7, "maxLat": 13.1, "minLng": 8.5, "maxLng": 16.2, "center": [7.3697, 12.3547], "defaultZoom": 6}
    },
    {
        "id": "CF", "isoCode": "CF", "name": "Central African Republic", "flag": "🇨🇫",
        "region": "Central Africa",
        "currency": {"name": "Central African CFA Franc", "code": "XAF", "symbol": "FCFA"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "sg", "name": "Sango", "nativeName": "Sängö"}, {"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Prefecture", "pluralName": "Prefectures", "placeholder": "Select Prefecture"},
            {"level": 2, "name": "Sub-Prefecture", "pluralName": "Sub-Prefectures", "placeholder": "Select Sub-Prefecture"}
        ],
        "supportedCrops": ["cassava", "groundnut", "maize", "sorghum", "plantain"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Ubangi river basin sub-humid"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols"}
        ],
        "agriculturalSources": ["ICRA (Institut Centrafricain de Recherche Agronomique)", "FAO CAR"],
        "supportStatus": "planned",
        "bounds": {"minLat": 2.2, "maxLat": 11.0, "minLng": 14.4, "maxLng": 27.5, "center": [6.6111, 20.9394], "defaultZoom": 6}
    },
    {
        "id": "TD", "isoCode": "TD", "name": "Chad", "flag": "🇹🇩",
        "region": "Central Africa",
        "currency": {"name": "Central African CFA Franc", "code": "XAF", "symbol": "FCFA"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "fr", "name": "French", "nativeName": "Français"}, {"code": "ar", "name": "Arabic", "nativeName": "العربية"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 2, "name": "Department", "pluralName": "Departments", "placeholder": "Select Department"}
        ],
        "supportedCrops": ["sorghum", "millet", "groundnut", "maize", "rice"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Lake Chad basin & Sudanian south"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Arenosols, Vertisols"}
        ],
        "agriculturalSources": ["ITRAD (Institut Tchadien de Recherche Agronomique pour le Développement)", "FAO Chad"],
        "supportStatus": "in_development",
        "bounds": {"minLat": 7.4, "maxLat": 23.4, "minLng": 13.5, "maxLng": 24.0, "center": [15.4542, 18.7322], "defaultZoom": 5}
    },
    {
        "id": "CG", "isoCode": "CG", "name": "Republic of the Congo", "flag": "🇨🇬",
        "region": "Central Africa",
        "currency": {"name": "Central African CFA Franc", "code": "XAF", "symbol": "FCFA"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "fr", "name": "French", "nativeName": "Français"}, {"code": "ln", "name": "Lingala", "nativeName": "Lingála"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Department", "pluralName": "Departments", "placeholder": "Select Department"},
            {"level": 2, "name": "District", "pluralName": "Districts", "placeholder": "Select District"}
        ],
        "supportedCrops": ["cassava", "plantain", "banana", "sweet_potato", "yam"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Congolian rainforest humid tropical"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols, Arenosols (Batéké plateau)"}
        ],
        "agriculturalSources": ["IRA (Institut de Recherche Agronomique Congo)", "FAO Congo"],
        "supportStatus": "planned",
        "bounds": {"minLat": -5.0, "maxLat": 3.7, "minLng": 11.2, "maxLng": 18.6, "center": [-0.228, 15.8277], "defaultZoom": 6}
    },
    {
        "id": "CD", "isoCode": "CD", "name": "Democratic Republic of the Congo", "flag": "🇨🇩",
        "region": "Central Africa",
        "currency": {"name": "Congolese Franc", "code": "CDF", "symbol": "FC"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "fr", "name": "French", "nativeName": "Français"}, {"code": "ln", "name": "Lingala", "nativeName": "Lingála"}, {"code": "sw", "name": "Swahili", "nativeName": "Kiswahili"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 2, "name": "Territory", "pluralName": "Territories", "placeholder": "Select Territory"},
            {"level": 3, "name": "Sector / Chiefdom", "pluralName": "Sectors", "placeholder": "Select Sector"}
        ],
        "supportedCrops": ["cassava", "maize", "plantain", "rice", "sweet_potato", "groundnut", "common_bean", "coffee", "cocoa"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Central Congo basin & Albertine rift highlands"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols, Acrisols"}
        ],
        "agriculturalSources": ["INERA (Institut National pour l'Etude et la Recherche Agronomiques DRC)", "FAO DRC"],
        "supportStatus": "in_development",
        "bounds": {"minLat": -13.5, "maxLat": 5.4, "minLng": 12.2, "maxLng": 31.3, "center": [-4.0383, 21.7587], "defaultZoom": 5}
    },
    {
        "id": "GQ", "isoCode": "GQ", "name": "Equatorial Guinea", "flag": "🇬🇶",
        "region": "Central Africa",
        "currency": {"name": "Central African CFA Franc", "code": "XAF", "symbol": "FCFA"},
        "defaultLanguage": "es",
        "supportedLanguages": [{"code": "es", "name": "Spanish", "nativeName": "Español"}, {"code": "fr", "name": "French", "nativeName": "Français"}, {"code": "pt", "name": "Portuguese", "nativeName": "Português"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 2, "name": "District", "pluralName": "Districts", "placeholder": "Select District"}
        ],
        "supportedCrops": ["cassava", "plantain", "sweet_potato", "cocoa"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Bioko island & Rio Muni rainforest"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols & volcanic Andosols"}
        ],
        "agriculturalSources": ["INPAGE Equatorial Guinea", "FAO Equatorial Guinea"],
        "supportStatus": "planned",
        "bounds": {"minLat": 1.0, "maxLat": 3.8, "minLng": 5.6, "maxLng": 11.3, "center": [1.6508, 10.2679], "defaultZoom": 8}
    },
    {
        "id": "GA", "isoCode": "GA", "name": "Gabon", "flag": "🇬🇦",
        "region": "Central Africa",
        "currency": {"name": "Central African CFA Franc", "code": "XAF", "symbol": "FCFA"},
        "defaultLanguage": "fr",
        "supportedLanguages": [{"code": "fr", "name": "French", "nativeName": "Français"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 2, "name": "Department", "pluralName": "Departments", "placeholder": "Select Department"}
        ],
        "supportedCrops": ["cassava", "plantain", "banana", "yam"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Dense equatorial evergreen forest climate"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols, Acrisols"}
        ],
        "agriculturalSources": ["CENAREST Gabon", "FAO Gabon"],
        "supportStatus": "planned",
        "bounds": {"minLat": -3.9, "maxLat": 2.3, "minLng": 8.7, "maxLng": 14.5, "center": [-0.8037, 11.6094], "defaultZoom": 6}
    },
    {
        "id": "ST", "isoCode": "ST", "name": "São Tomé and Príncipe", "flag": "🇸🇹",
        "region": "Central Africa",
        "currency": {"name": "São Tomé and Príncipe Dobra", "code": "STN", "symbol": "Db"},
        "defaultLanguage": "pt",
        "supportedLanguages": [{"code": "pt", "name": "Portuguese", "nativeName": "Português"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province / Autonomous Region", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 2, "name": "District", "pluralName": "Districts", "placeholder": "Select District"}
        ],
        "supportedCrops": ["cocoa", "banana", "plantain", "cassava"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Oceanic equatorial high rainfall"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Volcanic Andosols"}
        ],
        "agriculturalSources": ["CIAT São Tomé", "FAO STP"],
        "supportStatus": "planned",
        "bounds": {"minLat": 0.0, "maxLat": 1.7, "minLng": 6.4, "maxLng": 7.5, "center": [0.1864, 6.6131], "defaultZoom": 9}
    },
    {
        "id": "AO", "isoCode": "AO", "name": "Angola", "flag": "🇦🇴",
        "region": "Central Africa", # Often Southern/Central
        "currency": {"name": "Angolan Kwanza", "code": "AOA", "symbol": "Kz"},
        "defaultLanguage": "pt",
        "supportedLanguages": [{"code": "pt", "name": "Portuguese", "nativeName": "Português"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 2, "name": "Municipality", "pluralName": "Municipalities", "placeholder": "Select Municipality"},
            {"level": 3, "name": "Commune", "pluralName": "Communes", "placeholder": "Select Commune"}
        ],
        "supportedCrops": ["cassava", "maize", "sweet_potato", "coffee", "common_bean", "sorghum", "banana"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Planalto Central highlands to coastal desert"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols, Arenosols"}
        ],
        "agriculturalSources": ["IIA (Instituto de Investigação Agronómica de Angola)", "FAO Angola"],
        "supportStatus": "in_development",
        "bounds": {"minLat": -18.0, "maxLat": -4.4, "minLng": 11.7, "maxLng": 24.1, "center": [-11.2027, 17.8739], "defaultZoom": 5}
    },

    # --- SOUTHERN AFRICA (9) ---
    {
        "id": "BW", "isoCode": "BW", "name": "Botswana", "flag": "🇧🇼",
        "region": "Southern Africa",
        "currency": {"name": "Botswana Pula", "code": "BWP", "symbol": "P"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}, {"code": "tn", "name": "Setswana", "nativeName": "Setswana"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "District", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 2, "name": "Sub-District", "pluralName": "Sub-Districts", "placeholder": "Select Sub-District"}
        ],
        "supportedCrops": ["sorghum", "millet", "cowpea", "maize"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Kalahari semi-arid climate"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Arenosols (deep Kalahari sand)"}
        ],
        "agriculturalSources": ["DAR (Department of Agricultural Research Botswana)", "BUAN (Botswana University of Agriculture and Natural Resources)"],
        "supportStatus": "in_development",
        "bounds": {"minLat": -26.9, "maxLat": -17.8, "minLng": 20.0, "maxLng": 29.4, "center": [-22.3285, 24.6849], "defaultZoom": 6}
    },
    {
        "id": "SZ", "isoCode": "SZ", "name": "Eswatini", "flag": "🇸🇿",
        "region": "Southern Africa",
        "currency": {"name": "Swazi Lilangeni", "code": "SZL", "symbol": "E"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}, {"code": "ss", "name": "siSwati", "nativeName": "siSwati"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "Inkhundla", "pluralName": "Tinkhundla", "placeholder": "Select Inkhundla"}
        ],
        "supportedCrops": ["maize", "sugarcane", "sweet_potato", "sorghum"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Highveld to Lowveld agroecological gradient"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Ferralsols, Vertisols"}
        ],
        "agriculturalSources": ["Department of Agricultural Research and Specialist Services Eswatini", "FAO Eswatini"],
        "supportStatus": "planned",
        "bounds": {"minLat": -27.3, "maxLat": -25.7, "minLng": 30.8, "maxLng": 32.1, "center": [-26.5225, 31.4659], "defaultZoom": 8}
    },
    {
        "id": "LS", "isoCode": "LS", "name": "Lesotho", "flag": "🇱🇸",
        "region": "Southern Africa",
        "currency": {"name": "Lesotho Loti", "code": "LSL", "symbol": "L"},
        "defaultLanguage": "st",
        "supportedLanguages": [{"code": "st", "name": "Sesotho", "nativeName": "Sesotho"}, {"code": "en", "name": "English", "nativeName": "English"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "District", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 2, "name": "Community Council", "pluralName": "Councils", "placeholder": "Select Council"}
        ],
        "supportedCrops": ["maize", "sorghum", "wheat", "common_bean"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Montane temperate & frost occurrence"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Phaeozems, Leptosols"}
        ],
        "agriculturalSources": ["Department of Agricultural Research Lesotho", "FAO Lesotho"],
        "supportStatus": "planned",
        "bounds": {"minLat": -30.7, "maxLat": -28.6, "minLng": 27.0, "maxLng": 29.5, "center": [-29.6099, 28.2336], "defaultZoom": 8}
    },
    {
        "id": "NA", "isoCode": "NA", "name": "Namibia", "flag": "🇳🇦",
        "region": "Southern Africa",
        "currency": {"name": "Namibian Dollar", "code": "NAD", "symbol": "N$"},
        "defaultLanguage": "en",
        "supportedLanguages": [{"code": "en", "name": "English", "nativeName": "English"}],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Region", "pluralName": "Regions", "placeholder": "Select Region"},
            {"level": 2, "name": "Constituency", "pluralName": "Constituencies", "placeholder": "Select Constituency"}
        ],
        "supportedCrops": ["millet", "sorghum", "maize"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Hyper-arid Namib desert to sub-humid Caprivi/Zambezi strip"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Arenosols, Calcisols"}
        ],
        "agriculturalSources": ["Ministry of Agriculture, Water and Land Reform Namibia", "UNAM Faculty of Agriculture"],
        "supportStatus": "in_development",
        "bounds": {"minLat": -29.0, "maxLat": -16.9, "minLng": 11.7, "maxLng": 25.3, "center": [-22.9576, 18.4904], "defaultZoom": 5}
    },
    {
        "id": "ZA", "isoCode": "ZA", "name": "South Africa", "flag": "🇿🇦",
        "region": "Southern Africa",
        "currency": {"name": "South African Rand", "code": "ZAR", "symbol": "R"},
        "defaultLanguage": "en",
        "supportedLanguages": [
            {"code": "en", "name": "English", "nativeName": "English"},
            {"code": "af", "name": "Afrikaans", "nativeName": "Afrikaans"},
            {"code": "zu", "name": "isiZulu", "nativeName": "isiZulu"},
            {"code": "xh", "name": "isiXhosa", "nativeName": "isiXhosa"}
        ],
        "measurementUnits": {"area": "hectares", "temperature": "celsius", "rainfall": "mm"},
        "administrativeLevels": [
            {"level": 1, "name": "Province", "pluralName": "Provinces", "placeholder": "Select Province"},
            {"level": 2, "name": "District Municipality", "pluralName": "Districts", "placeholder": "Select District"},
            {"level": 3, "name": "Local Municipality", "pluralName": "Municipalities", "placeholder": "Select Municipality"},
            {"level": 4, "name": "Ward", "pluralName": "Wards", "placeholder": "Select Ward"}
        ],
        "supportedCrops": ["maize", "wheat", "soybean", "barley", "sorghum", "groundnut", "sweet_potato"],
        "dataProviders": [
            {"name": "NASA POWER", "type": "climate", "provider": "NASA Langley", "coverage": "Global", "status": "active", "notes": "Mediterranean Western Cape (winter rain) to Highveld summer rain"},
            {"name": "ISRIC SoilGrids", "type": "soil", "provider": "ISRIC", "coverage": "Global (250m)", "status": "active", "notes": "Plinthosols, Luvisols, Arenosols"}
        ],
        "agriculturalSources": ["ARC (Agricultural Research Council South Africa)", "Department of Agriculture, Land Reform and Rural Development", "Bureau for Food and Agricultural Policy (BFAP)"],
        "supportStatus": "fully_supported",
        "bounds": {"minLat": -34.8, "maxLat": -22.1, "minLng": 16.4, "maxLng": 32.9, "center": [-30.5595, 22.9375], "defaultZoom": 5}
    }
]

print(f"Total African sovereign states structured: {len(AFRICAN_COUNTRIES)}")

