/**
 * Scientific Environmental GIS Layer Data for Africa:
 * Phase 4.10 Audit: Explicit Provenance, Historical Telemetry separation & Rigorous Units
 * 1. Water Resources (HydroRIVERS, HydroLAKES, FAO AQUASTAT)
 * 2. Rainfall & Precipitation Distribution (CHIRPS v3 / v2 validated 30-year climatology)
 * 3. Soil Degradation Risk & Land Degradation (FAO GLADA / ISRIC modelled risk proxies)
 * 4. Soil pH Mapping (ISRIC SoilGrids 2.0 at 0-30cm depth interval)
 */

export interface WaterFeature {
  id: string;
  name: string;
  type: 'River' | 'Lake' | 'Reservoir' | 'Dam' | 'River Basin';
  basin: string;
  country: string;
  countryCode: string;
  coordinates: [number, number][];
  center: [number, number];
  lengthKm?: number;
  surfaceAreaKm2?: number;
  capacityBm3?: number;
  meanAnnualDischargeM3s?: number;
  source: string;
  provenanceStatus: 'STATISTICAL' | 'CARTOGRAPHIC_VECTOR' | 'MODELLED';
  observationPeriod: string;
  agriculturalRole: string;
  telemetryNotice: string;
}

export interface RainfallZone {
  id: string;
  name: string;
  annualMeanMm: number;
  category: 'Very Low (<200mm)' | 'Low (200-500mm)' | 'Moderate (500-1000mm)' | 'High (1000-1600mm)' | 'Very High (>1600mm)';
  monthlyPeakMonth: string;
  polygon: [number, number][];
  color: string;
  source: string;
  productVersion: string;
  resolution: string;
  provenanceStatus: 'CALIBRATED_CLIMATOLOGY' | 'LIVE' | 'PARTIAL';
  droughtAnomalyStatus: string;
}

export interface SoilDegradationZone {
  id: string;
  regionName: string;
  country: string;
  indicator: string;
  riskLevel: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' | 'CRITICAL_DEGRADATION' | 'DATA_UNAVAILABLE';
  socMeanGkg: number;
  erosionRiskFactor: string;
  polygon: [number, number][];
  source: string;
  resolution: string;
  provenanceStatus: 'MODELLED' | 'UNAVAILABLE';
  confidence: string;
  scientificExplanation: string;
  limitations: string;
}

export interface SoilPhZone {
  id: string;
  regionName: string;
  country: string;
  phValue: number;
  classification:
    | 'Extremely Acidic (<4.5)'
    | 'Strongly Acidic (4.5-5.5)'
    | 'Moderately Acidic (5.5-6.5)'
    | 'Near Neutral (6.5-7.5)'
    | 'Alkaline (7.5-8.5)'
    | 'Strongly Alkaline (>8.5)';
  depth: string;
  polygon: [number, number][];
  color: string;
  source: string;
  resolution: string;
  measurementMethod: string;
  provenanceStatus: 'MODELLED' | 'CACHED' | 'LIVE';
  agronomicImpact: string;
}

// 1. WATER RESOURCES (HydroRIVERS / HydroLAKES / FAO AQUASTAT)
export const WATER_RESOURCES_DATA: WaterFeature[] = [
  {
    id: 'river-nile',
    name: 'Nile River Corridor (Blue & White Nile)',
    type: 'River',
    basin: 'Nile Basin (3.25 million km²)',
    country: 'Egypt, Sudan, South Sudan, Ethiopia, Uganda',
    countryCode: 'EG',
    center: [15.6, 32.5],
    coordinates: [
      [31.2, 30.5],
      [27.2, 31.0],
      [24.1, 32.9],
      [19.2, 30.5],
      [15.6, 32.5],
      [11.8, 34.4],
      [9.0, 31.5],
      [2.8, 32.3],
      [0.4, 33.2]
    ],
    lengthKm: 6650,
    meanAnnualDischargeM3s: 2830,
    source: 'HydroRIVERS v1.0 / FAO AQUASTAT Survey',
    provenanceStatus: 'STATISTICAL',
    observationPeriod: '30-Year Long-Term Hydrometric Climatology (1961-1990 Mean)',
    agriculturalRole: 'Irrigates over 4.5 million hectares of Egyptian delta and Gezira scheme wheat/cotton',
    telemetryNotice: 'Static mapped cartographic vector with published historical mean discharge; not live daily river flow gauge telemetry.'
  },
  {
    id: 'gerd-reservoir',
    name: 'Grand Ethiopian Renaissance Dam (GERD)',
    type: 'Reservoir',
    basin: 'Blue Nile (Abay)',
    country: 'Ethiopia',
    countryCode: 'ET',
    center: [11.21, 35.09],
    coordinates: [
      [11.10, 35.00],
      [11.35, 35.05],
      [11.38, 35.25],
      [11.15, 35.22],
      [11.10, 35.00]
    ],
    capacityBm3: 74,
    source: 'Ethiopian Ministry of Water and Energy (MoWE)',
    provenanceStatus: 'STATISTICAL',
    observationPeriod: 'Engineering Design Specification & 2023-2024 Stage-Filling Baseline',
    agriculturalRole: 'Hydropower generation, flood mitigation in Roseires, sediment trap for downstream agriculture',
    telemetryNotice: 'Static reservoir polygon with published design storage volume (74 BCM); not real-time satellite radar altimetry storage.'
  },
  {
    id: 'lake-victoria',
    name: 'Lake Victoria Basin',
    type: 'Lake',
    basin: 'Upper Nile Basin',
    country: 'Uganda, Kenya, Tanzania',
    countryCode: 'UG',
    center: [-1.0, 33.0],
    coordinates: [
      [0.35, 32.5],
      [0.10, 34.0],
      [-1.5, 34.3],
      [-2.6, 33.5],
      [-2.5, 32.0],
      [-1.0, 31.6],
      [0.35, 32.5]
    ],
    surfaceAreaKm2: 68800,
    capacityBm3: 2750,
    source: 'HydroLAKES Database (v1.0)',
    provenanceStatus: 'CARTOGRAPHIC_VECTOR',
    observationPeriod: 'Published HydroLAKES Shoreline Survey',
    agriculturalRole: 'Supports 40+ million people with basin microclimates for rainfed tea, coffee, and maize',
    telemetryNotice: 'Mapped limnological boundary; not live water level altimetry.'
  },
  {
    id: 'river-niger',
    name: 'Niger River Basin & Inland Delta',
    type: 'River',
    basin: 'Niger Basin (2.11 million km²)',
    country: 'Guinea, Mali, Niger, Nigeria',
    countryCode: 'NG',
    center: [13.5, 2.1],
    coordinates: [
      [10.5, -9.5],
      [13.0, -5.0],
      [16.5, -3.5],
      [14.5, 0.5],
      [13.5, 2.1],
      [9.5, 4.5],
      [6.0, 6.7],
      [4.5, 6.0]
    ],
    lengthKm: 4180,
    meanAnnualDischargeM3s: 5589,
    source: 'HydroRIVERS / Niger Basin Authority (ABN)',
    provenanceStatus: 'STATISTICAL',
    observationPeriod: 'Historical Multi-Decadal Gauging Station Record',
    agriculturalRole: 'Crucial for Mali Inner Niger Delta rice cultivation and Kainji Dam downstream agro-irrigation',
    telemetryNotice: 'Static vector representation with long-term average discharge.'
  },
  {
    id: 'lake-tana',
    name: 'Lake Tana (Source of Blue Nile)',
    type: 'Lake',
    basin: 'Blue Nile (Abay)',
    country: 'Ethiopia',
    countryCode: 'ET',
    center: [12.0, 37.3],
    coordinates: [
      [12.3, 37.2],
      [12.1, 37.6],
      [11.6, 37.5],
      [11.7, 37.0],
      [12.3, 37.2]
    ],
    surfaceAreaKm2: 3156,
    capacityBm3: 29.1,
    source: 'HydroLAKES / Ministry of Water and Energy',
    provenanceStatus: 'CARTOGRAPHIC_VECTOR',
    observationPeriod: 'National Hydrological Survey Baseline',
    agriculturalRole: 'Supplies Tana-Beles sugar schemes and regional rice paddies in Fogera plains',
    telemetryNotice: 'Static limnological boundary; actual seasonal water volume fluctuates by ~9 BCM.'
  },
  {
    id: 'river-congo',
    name: 'Congo River Basin',
    type: 'River',
    basin: 'Congo Basin (3.7 million km²)',
    country: 'DR Congo, Congo Republic, Central African Republic',
    countryCode: 'CD',
    center: [0.0, 20.0],
    coordinates: [
      [-5.0, 26.5],
      [-1.0, 25.0],
      [1.5, 21.0],
      [0.0, 18.0],
      [-4.3, 15.3],
      [-6.0, 12.4]
    ],
    lengthKm: 4700,
    meanAnnualDischargeM3s: 41000,
    source: 'HydroRIVERS / CICOS Multi-Decadal Gauging',
    provenanceStatus: 'STATISTICAL',
    observationPeriod: 'Historical Gauging Station Series (Kinshasa/Brazzaville)',
    agriculturalRole: 'World’s second-largest river discharge, perennial water security for Central African agroforestry',
    telemetryNotice: 'Static cartographic line; historical discharge mean.'
  }
];

// 2. RAINFALL LAYER (CHIRPS v3.0 / v2.0 Validated Climatology)
export const RAINFALL_LAYER_DATA: RainfallZone[] = [
  {
    id: 'rf-sahara-hyperarid',
    name: 'Sahara Hyper-Arid Isohyetal Zone',
    annualMeanMm: 45,
    category: 'Very Low (<200mm)',
    monthlyPeakMonth: 'Sporadic (No defined wet season)',
    polygon: [
      [31.0, -8.0],
      [31.0, 32.0],
      [22.0, 35.0],
      [16.5, 30.0],
      [17.0, 0.0],
      [18.0, -15.0],
      [27.0, -12.0],
      [31.0, -8.0]
    ],
    color: '#D4AC0D',
    source: 'Climate Hazards Center (CHIRPS v3.0 / v2.0)',
    productVersion: 'CHIRPS v3.0 Preview / v2.0 Normal',
    resolution: '0.05° (~5.3 km)',
    provenanceStatus: 'CALIBRATED_CLIMATOLOGY',
    droughtAnomalyStatus: 'Chronic Hyper-Aridity (<200mm/yr; non-arable without deep fossil aquifer irrigation)'
  },
  {
    id: 'rf-sahel-semiarid',
    name: 'Sahel Semi-Arid Pastoral Belt',
    annualMeanMm: 380,
    category: 'Low (200-500mm)',
    monthlyPeakMonth: 'August (Single short peak)',
    polygon: [
      [17.0, -16.0],
      [17.0, 15.0],
      [16.5, 34.0],
      [13.0, 35.0],
      [12.5, 15.0],
      [13.0, -16.0],
      [17.0, -16.0]
    ],
    color: '#7DCEA0',
    source: 'Climate Hazards Center (CHIRPS v3.0 / v2.0)',
    productVersion: 'CHIRPS v3.0 Ready / v2.0 Baseline',
    resolution: '0.05° (~5.3 km)',
    provenanceStatus: 'CALIBRATED_CLIMATOLOGY',
    droughtAnomalyStatus: 'High Inter-Annual Coefficient of Variation; vulnerable to early rainfall cessation'
  },
  {
    id: 'rf-savanna-moderate',
    name: 'Sudanian Savanna & Rift Valley Cereal Corridor',
    annualMeanMm: 820,
    category: 'Moderate (500-1000mm)',
    monthlyPeakMonth: 'July - August (West) / April - May (East)',
    polygon: [
      [12.5, -14.0],
      [12.5, 14.0],
      [11.0, 36.0],
      [6.0, 42.0],
      [2.0, 38.0],
      [6.0, 10.0],
      [8.0, -12.0],
      [12.5, -14.0]
    ],
    color: '#27AE60',
    source: 'Climate Hazards Center (CHIRPS v3.0 / v2.0)',
    productVersion: 'CHIRPS v3.0 / v2.0 Climatological Normal',
    resolution: '0.05° (~5.3 km)',
    provenanceStatus: 'CALIBRATED_CLIMATOLOGY',
    droughtAnomalyStatus: 'Optimal Agroclimatic Range for staple grains (Maize, Sorghum, Teff)'
  },
  {
    id: 'rf-highland-wet',
    name: 'Ethiopian Highlands & Guinean High-Rain Zone',
    annualMeanMm: 1350,
    category: 'High (1000-1600mm)',
    monthlyPeakMonth: 'July - August (Kiremt season)',
    polygon: [
      [13.5, 37.0],
      [13.0, 40.0],
      [7.0, 40.5],
      [6.5, 36.0],
      [10.0, 35.5],
      [13.5, 37.0]
    ],
    color: '#2980B9',
    source: 'Climate Hazards Center (CHIRPS v3.0 / v2.0) & National Meteorological Agencies',
    productVersion: 'CHIRPS v3.0 / v2.0',
    resolution: '0.05° (~5.3 km)',
    provenanceStatus: 'CALIBRATED_CLIMATOLOGY',
    droughtAnomalyStatus: 'High seasonal reliability; localized slope soil erosion during torrential bursts'
  },
  {
    id: 'rf-congo-equatorial',
    name: 'Congo Basin Equatorial Rainforest Belt',
    annualMeanMm: 1980,
    category: 'Very High (>1600mm)',
    monthlyPeakMonth: 'Bimodal Peaks (April & October)',
    polygon: [
      [4.0, 9.0],
      [4.5, 29.0],
      [-4.0, 29.0],
      [-5.0, 18.0],
      [-3.0, 10.0],
      [4.0, 9.0]
    ],
    color: '#1B4F72',
    source: 'Climate Hazards Center (CHIRPS v3.0 / v2.0)',
    productVersion: 'CHIRPS v3.0 / v2.0',
    resolution: '0.05° (~5.3 km)',
    provenanceStatus: 'CALIBRATED_CLIMATOLOGY',
    droughtAnomalyStatus: 'Perennial Water Surplus; severe nutrient leaching in coarse-textured soils'
  }
];

// 3. SOIL DEGRADATION LAYER (Modelled Risk Proxies vs. Observed Evidence)
export const SOIL_DEGRADATION_DATA: SoilDegradationZone[] = [
  {
    id: 'deg-ethiopia-highlands',
    regionName: 'Central & Northern Ethiopian Highlands',
    country: 'Ethiopia',
    indicator: 'Modelled Water Erosion on Cultivated Slopes',
    riskLevel: 'HIGH_RISK',
    socMeanGkg: 18.5,
    erosionRiskFactor: 'High (Modelled RUSLE > 35 t/ha/yr on slopes >15%)',
    polygon: [
      [13.8, 37.5],
      [13.5, 39.8],
      [9.5, 40.0],
      [8.0, 38.0],
      [10.5, 36.5],
      [13.8, 37.5]
    ],
    source: 'ISRIC SoilGrids & EIAR Land Resource Surveys',
    resolution: '250m Digital Elevation & Soil Mapping',
    provenanceStatus: 'MODELLED',
    confidence: 'Modelled Risk Proxy with Ground Auger Calibration in Select Watersheds',
    scientificExplanation: 'Modelled soil loss driven by high-intensity rains on deforested slopes. Not every field in the zone is degraded; terraced farms retain soil.',
    limitations: 'Calculated using RUSLE slope equations; not direct continuous sediment trap measurements.'
  },
  {
    id: 'deg-sahel-wind-erosion',
    regionName: 'Sahelian Agro-Pastoral Transition (Niger / Chad)',
    country: 'Niger & Chad',
    indicator: 'Aeolian Deflation & Vegetative Cover Depletion',
    riskLevel: 'CRITICAL_DEGRADATION',
    socMeanGkg: 4.8,
    erosionRiskFactor: 'Severe seasonal wind erosion (Harmattan)',
    polygon: [
      [16.0, 8.0],
      [16.0, 16.0],
      [13.0, 16.0],
      [13.0, 8.0],
      [16.0, 8.0]
    ],
    source: 'FAO GLADA / Landsat Vegetative Trend Proxies',
    resolution: '30m Satellite Proxy / 250m Soil Matrix',
    provenanceStatus: 'MODELLED',
    confidence: 'Satellite NDVI Trend Proxy with Moderate Ground Validation',
    scientificExplanation: 'Sparse perennial vegetation exposes Arenosols to wind deflation. Mitigated by Farmer Managed Natural Regeneration (FMNR).',
    limitations: 'Satellite vegetation index trend is used as a proxy for soil stability; does not distinguish drought-induced dormancy from permanent degradation.'
  },
  {
    id: 'deg-kenya-rift-valley',
    regionName: 'Kenya Central Rift Valley Agricultural Basin',
    country: 'Kenya',
    indicator: 'Nutrient Mining & Intensive Monocropping Proxy',
    riskLevel: 'MODERATE_RISK',
    socMeanGkg: 24.2,
    erosionRiskFactor: 'Moderate (Rill erosion during heavy convection)',
    polygon: [
      [1.0, 35.0],
      [0.8, 37.2],
      [-1.8, 37.0],
      [-1.5, 35.2],
      [1.0, 35.0]
    ],
    source: 'KALRO Soil Health Baseline & ISRIC SoilGrids',
    resolution: '250m Digital Soil Assessment',
    provenanceStatus: 'MODELLED',
    confidence: 'Calibrated with Regional Extension Soil Sampling',
    scientificExplanation: 'Continuous commercial maize cultivation without balanced organic replenishment increases subsoil compaction risk.',
    limitations: 'Regional model estimate; well-managed commercial farms using precision fertilizer may have healthy soil.'
  },
  {
    id: 'deg-congo-basin-forest',
    regionName: 'Central Congolian Lowland Evergreen Forest',
    country: 'DR Congo',
    indicator: 'Natural Vegetative Canopy Protection',
    riskLevel: 'LOW_RISK',
    socMeanGkg: 38.6,
    erosionRiskFactor: 'Very Low under continuous primary canopy',
    polygon: [
      [2.5, 18.0],
      [3.0, 26.0],
      [-3.0, 26.0],
      [-3.5, 18.0],
      [2.5, 18.0]
    ],
    source: 'ISRIC SoilGrids 2.0 SOC Layer',
    resolution: '250m Standard Product',
    provenanceStatus: 'MODELLED',
    confidence: 'Literature Estimate & Remote Sensing Proxy',
    scientificExplanation: 'Multi-tiered rainforest canopy absorbs raindrop kinetic energy, preventing detachment of Ferralsols.',
    limitations: 'Assumes undisturbed forest cover; cleared slash-and-burn tracts experience rapid organic matter loss.'
  }
];

// 4. SOIL pH LAYER (ISRIC SoilGrids 2.0: 0-30 cm Depth Average)
export const SOIL_PH_LAYER_DATA: SoilPhZone[] = [
  {
    id: 'ph-congo-strongly-acidic',
    regionName: 'Congo Basin & Coastal West Africa Leached Ferralsols',
    country: 'DR Congo & Guinea',
    phValue: 4.8,
    classification: 'Strongly Acidic (4.5-5.5)',
    depth: '0-30 cm Combined Depth Interval (Averaged 0-5, 5-15, 15-30 cm)',
    polygon: [
      [5.0, -8.0],
      [5.5, 10.0],
      [4.0, 28.0],
      [-4.0, 28.0],
      [-4.5, 12.0],
      [4.0, -4.0],
      [5.0, -8.0]
    ],
    color: '#E67E22',
    source: 'ISRIC SoilGrids 2.0 (phh2o property)',
    resolution: '250m Spatial Resolution',
    measurementMethod: 'Electrometric pH in 1:5 soil-water suspension (phh2o / 10)',
    provenanceStatus: 'MODELLED',
    agronomicImpact: 'Aluminum toxicity risk; high phosphorus fixation. Requires agricultural lime (CaCO3) for maize and legumes.'
  },
  {
    id: 'ph-east-africa-moderately-acidic',
    regionName: 'East African Highland Nitisols & Volcanic Slopes',
    country: 'Ethiopia & Kenya',
    phValue: 5.8,
    classification: 'Moderately Acidic (5.5-6.5)',
    depth: '0-30 cm Combined Depth Interval (Averaged 0-5, 5-15, 15-30 cm)',
    polygon: [
      [11.5, 36.5],
      [11.0, 39.5],
      [0.5, 37.5],
      [-1.5, 36.0],
      [5.0, 35.0],
      [11.5, 36.5]
    ],
    color: '#F39C12',
    source: 'ISRIC SoilGrids 2.0 & National Soil Research (EIAR/KALRO)',
    resolution: '250m Spatial Resolution',
    measurementMethod: 'Electrometric pH in 1:5 soil-water suspension (phh2o / 10)',
    provenanceStatus: 'MODELLED',
    agronomicImpact: 'Optimal for Arabica coffee and tea; well tolerated by teff and wheat. Mild lime maintenance recommended.'
  },
  {
    id: 'ph-nile-vertisol-neutral',
    regionName: 'Nile Basin Alluvial & Plateau Vertisols',
    country: 'Sudan, Egypt & Central Ethiopia',
    phValue: 6.9,
    classification: 'Near Neutral (6.5-7.5)',
    depth: '0-30 cm Combined Depth Interval',
    polygon: [
      [16.0, 31.0],
      [16.0, 35.0],
      [8.0, 39.5],
      [7.5, 38.0],
      [12.0, 32.5],
      [16.0, 31.0]
    ],
    color: '#27AE60',
    source: 'ISRIC SoilGrids 2.0 & FAO Soil Map of the World',
    resolution: '250m Spatial Resolution',
    measurementMethod: 'Electrometric pH in 1:5 soil-water suspension',
    provenanceStatus: 'MODELLED',
    agronomicImpact: 'Optimal nutrient availability range. Optimum for cation exchange and microbial Rhizobium nitrogen fixation.'
  },
  {
    id: 'ph-sahara-alkaline',
    regionName: 'Saharan & Somalian Calcisols & Saline Basins',
    country: 'Egypt, Libya & Eastern Somalia',
    phValue: 8.3,
    classification: 'Alkaline (7.5-8.5)',
    depth: '0-30 cm Combined Depth Interval',
    polygon: [
      [31.0, 10.0],
      [31.0, 32.0],
      [24.0, 34.0],
      [22.0, 25.0],
      [25.0, 12.0],
      [31.0, 10.0]
    ],
    color: '#8E44AD',
    source: 'ISRIC SoilGrids 2.0',
    resolution: '250m Spatial Resolution',
    measurementMethod: 'Digital mapping of free calcium carbonate horizons',
    provenanceStatus: 'MODELLED',
    agronomicImpact: 'Micronutrient (Iron, Zinc) lockout risk. Drip fertigation with acidifying fertilizers required for horticulture.'
  }
];
