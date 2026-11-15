/**
 * Rural Sub-City / District Agricultural Practices & Planted Crops
 * Grounded in national extension systems (EIAR, KALRO, IITA, CSIR-CRI, ARC)
 * Phase 4.10: Explicit Citations, Scientific Provenance & Evidence Status
 */

export interface DistrictAgronomy {
  district: string;
  subCityOrRural: string;
  majorCrops: string[];
  farmingMethod: string;
  plantingCalendar: string;
  soilCondition: string;
  irrigationType: 'Rainfed' | 'Spate / Basin' | 'Furrow / River Drip' | 'Mixed';
  sourceCitation: string;
  evidenceStatus: 'FIELD_VERIFIED' | 'GENERAL_REGIONAL_INFORMATION' | 'STATISTICAL' | 'DATA_PENDING';
  geographicScope: string;
  notes?: string;
  coordinates?: [number, number]; // [lat, lng] exact rural farming district center
}

export const COUNTRY_SUBCITY_AGRONOMY: Record<string, DistrictAgronomy[]> = {
  // Ethiopia (ET)
  "ET": [
    {
      district: "East Shewa (Debre Zeit / Bishoftu)",
      coordinates: [8.7523, 38.9841],
      subCityOrRural: "Ada'a & Gimbichu Rural Woredas",
      majorCrops: ["Teff (Magna & Quncho/DZ-Cr-37)", "Durum Wheat", "Chickpea"],
      farmingMethod: "Oxen-drawn traditional Maresha plowing (3-5 passes for fine seedbed tilth), broadcast manual seeding followed by light soil coverage.",
      plantingCalendar: "Meher Season: Sowing mid-July to early August; Harvesting November to December.",
      soilCondition: "Heavy Vertisols (Black clay with crack-swelling properties and high water-holding capacity, pH 6.8-7.2).",
      irrigationType: "Rainfed",
      sourceCitation: "EIAR Debre Zeit Agricultural Research Center (DZARC) National Teff Research Program (2020-2023 Extension Bulletin)",
      evidenceStatus: "FIELD_VERIFIED",
      geographicScope: "East Shewa High-Clay Agricultural Zone",
      notes: "Applies to smallholder rainfed farms on heavy Vertisol flats; sloping parcels require broadbed-and-furrow (BBM) drainage."
    },
    {
      district: "Arsi Highland Plateau (Asella)",
      coordinates: [7.9556, 39.1214],
      subCityOrRural: "Tiyo & Hetosa Rural Woredas",
      majorCrops: ["Bread Wheat (Kakaba, Ogolcho)", "Malt Barley", "Faba Bean"],
      farmingMethod: "Mechanized tractor disc plowing combined with combine-harvester services. Crop rotation with nitrogen-fixing faba bean.",
      plantingCalendar: "Meher Season: Planting late June to mid-July; Harvest December.",
      soilCondition: "Humic Nitisols (Fertile deep volcanic red loams, slightly acidic pH 5.6-6.2).",
      irrigationType: "Rainfed",
      sourceCitation: "EIAR Kulumsa Agricultural Research Center (KARC) Highland Cereal Directorate",
      evidenceStatus: "FIELD_VERIFIED",
      geographicScope: "Arsi Highland Wheat Corridor"
    },
    {
      district: "Jimma Montane Belt",
      coordinates: [7.6734, 36.8344],
      subCityOrRural: "Mana & Gomma Agroforestry Woredas",
      majorCrops: ["Arabica Coffee", "Enset (False Banana)", "Maize"],
      farmingMethod: "Multi-strata shade agroforestry under native Albizia/Cordia canopy. Minimal tillage; organic composting from coffee pulp.",
      plantingCalendar: "Perennial canopy care; Selective red-cherry hand picking from October to January.",
      soilCondition: "Deep Dystric Nitisols enriched by organic mulch.",
      irrigationType: "Rainfed",
      sourceCitation: "Jimma Agricultural Research Center (JARC) Coffee Research Division",
      evidenceStatus: "FIELD_VERIFIED",
      geographicScope: "Jimma Montane Rainforest Belt"
    },
    {
      district: "East Hararghe (Haramaya)",
      coordinates: [9.4072, 42.0203],
      subCityOrRural: "Kersa & Meta Lowland Foothills",
      majorCrops: ["Drought-Tolerant Sorghum", "Common Bean", "Khat"],
      farmingMethod: "Intercropping sorghum with cowpea or haricot beans on stone-faced contour bunds for runoff water harvesting.",
      plantingCalendar: "Belg early showers (April) to Meher harvest (November).",
      soilCondition: "Sandy Loams & Cambisols prone to water runoff.",
      irrigationType: "Spate / Basin",
      sourceCitation: "Haramaya University Dryland Agriculture Extension Bulletin",
      evidenceStatus: "GENERAL_REGIONAL_INFORMATION",
      geographicScope: "Semi-Arid Eastern Highlands"
    }
  ],

  // Kenya (KE)
  "KE": [
    {
      district: "Trans-Nzoia County (Kitale)",
      coordinates: [1.0167, 35.0],
      subCityOrRural: "Cherangany & Kiminini Rural Sub-Counties",
      majorCrops: ["White Hybrid Maize (H614D)", "Dry Beans", "Sunflower"],
      farmingMethod: "Conservation tillage with direct seed drilling, basal DAP application at planting followed by CAN top-dressing at knee-height.",
      plantingCalendar: "Long Rains: Sowing late March to April; Harvesting October to November.",
      soilCondition: "Deep well-drained volcanic Nitisols and Ferralsols (pH 5.4-6.0).",
      irrigationType: "Rainfed",
      sourceCitation: "Kenya Agricultural and Livestock Research Organisation (KALRO Kitale Maize Center)",
      evidenceStatus: "FIELD_VERIFIED",
      geographicScope: "Trans-Nzoia Maize Belt"
    },
    {
      district: "Kiambu / Nyeri Highlands",
      coordinates: [-0.4167, 36.95],
      subCityOrRural: "Githunguri & Othaya Slopes",
      majorCrops: ["Specialty Arabica Coffee (SL28)", "Tea", "Irish Potato"],
      farmingMethod: "Bench terracing on steep slopes with Napier grass stabilization; hand weeding and selective pruning.",
      plantingCalendar: "Main Crop flowering with March rains, harvest October-December.",
      soilCondition: "Humic Andosols with high organic matter.",
      irrigationType: "Rainfed",
      sourceCitation: "KALRO Coffee Research Institute (Ruiru)",
      evidenceStatus: "FIELD_VERIFIED",
      geographicScope: "Mount Kenya Southern Slopes"
    }
  ],

  // Nigeria (NG)
  "NG": [
    {
      district: "Oyo / Ogun Agro-Ecological Corridor",
      coordinates: [7.3775, 3.947],
      subCityOrRural: "Ibarapa & Ikenne Rural Outskirts",
      majorCrops: ["Cassava (TME 419, Vitamin A)", "White Maize", "Yam"],
      farmingMethod: "Ridge and mound tillage using mechanical ridge-makers; stem cutting insertion at 45-degree angle at 1m spacing.",
      plantingCalendar: "Bimodal cycle: Main planting with first sustained rains in April; 12-month harvesting cycle.",
      soilCondition: "Ferric Luvisols with sandy-loam topsoil (pH 5.8-6.5).",
      irrigationType: "Rainfed",
      sourceCitation: "International Institute of Tropical Agriculture (IITA Ibadan Root & Tuber Directorate)",
      evidenceStatus: "FIELD_VERIFIED",
      geographicScope: "Southwestern Cassava Zone"
    },
    {
      district: "Kano River Irrigation Project (KID)",
      coordinates: [11.7833, 8.5333],
      subCityOrRural: "Kura & Bunkure Farming Districts",
      majorCrops: ["Paddy Rice (FARO 44)", "Wheat", "Tomato"],
      farmingMethod: "Canal-fed gravity furrow and basin irrigation; transplanting 21-day nursery seedlings into puddled bunded basins.",
      plantingCalendar: "Dry season irrigated cropping from November to April; Wet season rainfed rice June to October.",
      soilCondition: "Fluvisols and alluvial silt loams.",
      irrigationType: "Furrow / River Drip",
      sourceCitation: "Hadejia-Jama'are River Basin Development Authority (HJRBDA)",
      evidenceStatus: "FIELD_VERIFIED",
      geographicScope: "Sudan Savanna Irrigated Perimeters"
    }
  ],

  // Ghana (GH)
  "GH": [
    {
      district: "Ashanti Cocoa Belt",
      coordinates: [6.6885, -1.6244],
      subCityOrRural: "Atwima Mponua & Bekwai Rural Districts",
      majorCrops: ["Cocoa (Amelonado / Hybrid)", "Plantain", "Cocoyam"],
      farmingMethod: "Zero-tillage planting under temporary plantain shade; integrated pest management (IPM) for capsid control.",
      plantingCalendar: "Transplanting potted hybrid seedlings in May-June; Main crop harvest September-January.",
      soilCondition: "Forest Ochrosols with thick organic humic surface layer.",
      irrigationType: "Rainfed",
      sourceCitation: "Cocoa Research Institute of Ghana (CRIG / COCOBOD)",
      evidenceStatus: "FIELD_VERIFIED",
      geographicScope: "Deciduous Forest Agro-Ecological Zone"
    }
  ],

  // South Africa (ZA)
  "ZA": [
    {
      district: "Free State Maize Triangle",
      coordinates: [-27.65, 27.2333],
      subCityOrRural: "Kroonstad & Bothaville Commercial District",
      majorCrops: ["Yellow & White Maize", "Soybeans", "Sunflower"],
      farmingMethod: "Precision GPS no-till planting, variable rate fertilizer injection, and rotational stubble retention.",
      plantingCalendar: "Summer season: Planting October-December; Combine harvesting May-July.",
      soilCondition: "Deep sandy-clay loams (Avalon & Bainsvlei forms).",
      irrigationType: "Mixed",
      sourceCitation: "Agricultural Research Council - Grain Crops (ARC-GC Potchefstroom)",
      evidenceStatus: "FIELD_VERIFIED",
      geographicScope: "Highveld Summer Rainfall Region"
    }
  ]
};
