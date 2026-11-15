// Country Configuration Schema
export type CountrySupportStatus = 'fully_supported' | 'planned' | 'in_development';
export type CountryOperationalStatus = 'PILOT_OPERATIONAL' | 'DIRECTORY_ONLY' | 'DATA_PENDING' | 'PARTIALLY_OPERATIONAL';

export interface AdministrativeLevelConfig {
  level: number;
  name: string; // e.g. "Region", "County"
  pluralName: string; // e.g. "Regions", "Counties"
  placeholder: string;
}

export interface AdministrativeOption {
  id: string;
  name: string;
  parentId?: string; // Links to parent administrative unit
}

export interface DataProviderRef {
  name: string;
  type: 'climate' | 'soil' | 'agriculture' | 'mapping';
  provider: string; // e.g. "NASA POWER", "ISRIC SoilGrids", "OpenStreetMap"
  coverage: string;
  status: 'active' | 'planned' | 'simulated';
  notes: string;
}

export interface CountryConfig {
  id: string;
  name: string;
  isoCode: string; // ISO 3166-1 alpha-2 (e.g. "ET", "KE")
  flag: string; // Emoji flag or icon identifier
  currency: {
    name: string;
    code: string;
    symbol: string;
  };
  defaultLanguage: string;
  supportedLanguages: {
    code: string;
    name: string;
    nativeName: string;
    dir?: 'ltr' | 'rtl';
  }[];
  measurementUnits: {
    area: 'hectares' | 'acres';
    temperature: 'celsius' | 'fahrenheit';
    rainfall: 'mm' | 'inches';
  };
  administrativeLevels: AdministrativeLevelConfig[];
  supportedCrops: string[]; // Crop IDs supported in this country
  dataProviders: DataProviderRef[];
  agriculturalSources: string[];
  supportStatus: CountrySupportStatus;
  operationalStatus?: CountryOperationalStatus;
  statusMessage?: string;
  isoAlpha2?: string;
  isoAlpha3?: string;
  capital?: string;
  region?: string;
  flagImage?: string;
  countryImage?: string;
  imageCaption?: string;
  climateZones?: string[];
  agriculturalRegions?: string[];
  plantingSeasons?: any[];
  agroclimaticZones?: any[];
  soilCharacteristics?: {
    description?: string;
    dominantOrders?: string[];
    [key: string]: any;
  };
  bounds?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
    center: [number, number];
    defaultZoom: number;
  };
}

export type WaterAvailability = 'Rainfed' | 'Irrigated' | 'Mixed' | 'Seasonal Stream' | 'Groundwater';

export type SoilType =
  | 'Vertisols (Black clay)'
  | 'Nitisols (Red basaltic)'
  | 'Cambisols (Brown loamy)'
  | 'Luvisols'
  | 'Fluvisols (Alluvial)'
  | 'Arenosols (Sandy)'
  | 'Ferralsols (Tropical red)'
  | 'Acrisols'
  | 'Leptosols';

export type CropProvenance =
  | 'FARMER_REPORTED'
  | 'FIELD_VERIFIED'
  | 'SATELLITE_CLASSIFIED'
  | 'STATISTICAL_ESTIMATE'
  | 'UNKNOWN';

export interface FarmPlot {
  id: string;
  farmId: string;
  name: string;
  cropName: string;
  areaHectares: number;
  plantingDate?: string;
  harvestTarget?: string;
  cropProvenance: CropProvenance;
  boundaryGeoJson?: any;
  createdAt?: string;
}

export interface Farm {
  id: string;
  name: string;
  countryCode: string; // ISO Code (e.g. "ET", "KE")
  country: string; // Display name
  // Flexible administrative levels
  adminLevel1: string; // e.g. Region (ET) / County (KE)
  adminLevel2: string; // e.g. Zone (ET) / Sub-county (KE)
  adminLevel3: string; // e.g. Woreda (ET) / Ward (KE)
  // Backward compatibility legacy fields
  region?: string;
  zone?: string;
  woreda?: string;

  size: number; // Value stored in standard internal unit (hectares)
  sizeHectares?: number; // Legacy alias
  sizeUnit: 'hectares' | 'acres';

  latitude: number;
  longitude: number;
  currentCrop: string;
  plantingDate?: string;
  growingSeason?: string;
  cropProvenance?: CropProvenance;
  soilType: SoilType;
  waterAvailability: WaterAvailability;
  description?: string;
  elevationMeters?: number;
  boundaryGeoJson?: any;
  ownerId?: string;
  plots?: FarmPlot[];
  createdAt: string;
  updatedAt: string;
}

export interface Crop {
  id: string;
  name: string;
  localNames?: Record<string, string>; // e.g. { am: 'ጤፍ', sw: 'Ufuta' }
  scientificName: string;
  family: string;
  category: 'Cereal' | 'Legume' | 'Pulse' | 'Oilseed' | 'Root' | 'Vegetable';
  countryApplicability: string[]; // Country ISO codes where this crop is grown
  regionalSuitability?: {
    countryCode: string;
    regions: string[];
    elevationMeters: { min: number; max: number };
    notes: string;
  }[];
  growingDurationDays: { min: number; max: number };
  waterRequirementsMm: { min: number; max: number };
  suitableTemperatureCelsius: { min: number; max: number; optimal: { min: number; max: number } };
  soilPhRange: { min: number; max: number };
  suitableSoilTypes: SoilType[];
  rootCharacteristics: {
    depthCm: { min: number; max: number };
    systemType: 'Taproot' | 'Fibrous' | 'Adventitious';
    description: string;
  };
  nitrogenFixation: {
    capable: boolean;
    rateKgPerHectare?: number;
    description: string;
  };
  description: string;
  climateSensitivity: {
    droughtTolerance: 'High' | 'Moderate' | 'Low';
    waterloggingTolerance: 'High' | 'Moderate' | 'Low';
    frostTolerance: 'High' | 'Moderate' | 'Low';
  };
  references: string[];
  validationStatus: 'verified_field_data' | 'literature_estimate' | 'demonstration_model';
  isDemoData: boolean;
  // Phase 4.7 — Crop image library fields
  imagePath?: string;
  imageSource?: string;
  imageAttribution?: string;
  imageLicense?: string;
  dataAvailabilityStatus?: string;
  // Additional agronomic profile fields (from crops.json)
  harvestSeason?: string;
  growingRegions?: string;
  avgYield?: string;
  dataSource?: string;
}

export interface MonthlyClimatePoint {
  month: string;
  monthIndex?: number;
  rainfallMm: number;
  tempMeanC: number;
  tempMinC: number;
  tempMaxC: number;
  solarRadiationMj?: number;
  solarRadiationKwh?: number;
  humidityPct?: number;
  isCompleteMonth?: boolean;
}

export interface HistoricalAnnualComparisonItem {
  year: number;
  isTargetYear: boolean;
  isComplete: boolean;
  annualRainfallMm: number;
  meanTempC: number;
  maxTempC: number;
  minTempC: number;
  solarRadiationAvgMj: number;
  dataSource: string;
}

export interface SameMonthHistoricalItem {
  year: number;
  month: string;
  isTargetYear: boolean;
  rainfallMm: number;
  tempMeanC: number;
  tempMaxC: number;
  tempMinC: number;
  solarRadiationMj: number;
  isComplete: boolean;
}

export interface SeasonalComparisonRecord {
  seasonName: string;
  months: string;
  cropCycle: string;
  yearlyRecords: {
    year: number;
    isTargetYear: boolean;
    rainfallMm: number;
    meanTempC: number;
  }[];
}

export interface HistoricalClimateComparison {
  location: {
    latitude: number;
    longitude: number;
    countryCode: string;
    spatialAggregation: string;
  };
  selectedParameters: {
    year: number;
    month: number;
    monthName: string;
    comparisonYearsRange: string;
  };
  baselineSummary: {
    referencePeriod: string;
    baselineAnnualRainfallMm: number;
    baselineMeanTempC: number;
    targetYearRainfallMm: number;
    targetYearMeanTempC: number;
    rainfallAnomalyMm: number;
    rainfallAnomalyPercentage: number;
    temperatureAnomalyCelsius: number;
  };
  annualComparison: HistoricalAnnualComparisonItem[];
  sameMonthComparison: SameMonthHistoricalItem[];
  seasonalComparison: Record<string, SeasonalComparisonRecord>;
  targetYearMonthlyData: MonthlyClimatePoint[];
  allYearsMonthlyMatrix: {
    year: number;
    isTargetYear: boolean;
    monthlyData: MonthlyClimatePoint[];
  }[];
  factualExplanation: string;
  scientificCaveats: string[];
  provenance: {
    nasaPower: {
      dataset: string;
      spatialResolution: string;
      temporalResolution: string;
      units: {
        temperature: string;
        solarRadiation: string;
      };
      retrievalTimestamp: string;
      status: string;
    };
    chirps: {
      dataset: string;
      spatialResolution: string;
      temporalResolution: string;
      units: {
        rainfall: string;
      };
      retrievalTimestamp: string;
      status: string;
    };
  };
}

export interface DataProvenance {
  provider: string; // e.g. "NASA POWER Agroclimatology"
  source: string; // e.g. "NASA Goddard Space Flight Center"
  retrievalDate: string;
  timePeriod: string;
  spatialResolution: string; // e.g. "0.5° x 0.5° (~50km)"
  measurementType: 'measured' | 'satellite_model' | 'reanalysis' | 'demonstration_simulation';
  limitations: string;
  isDemoData: boolean;
}

export interface ClimateIntelligence {
  farmId: string;
  countryCode: string;
  year: number;
  provenance: DataProvenance;
  summary: {
    annualRainfallMm: number;
    avgTempC: number;
    minTempC: number;
    maxTempC: number;
    rainyDaysEstimated: number;
    droughtRiskScore: 'Low' | 'Moderate' | 'High' | 'Severe';
  };
  monthlyData: MonthlyClimatePoint[];
  historicalTrends: {
    year: number;
    annualRainfallMm: number;
    avgTempC: number;
  }[];
}

export interface SoilInformation {
  farmId: string;
  countryCode: string;
  provenance: DataProvenance;
  soilType: SoilType;
  ph: number;
  organicCarbonPct: number;
  textureClass: string;
  clayPct: number;
  sandPct: number;
  siltPct: number;
  cationExchangeCapacityCmol?: number;
  bulkDensityGPerCm3?: number;
  drainageClass: 'Well drained' | 'Moderately well drained' | 'Imperfectly drained' | 'Poorly drained';
  fertilityStatus: 'High' | 'Moderate' | 'Low';
  suitabilityNotes: string[];
}

export interface SmapSoilMoistureIntelligence {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  cropContext: string;
  soilTexture: {
    sandPercent: number;
    clayPercent: number;
    siltPercent: number;
    textureClass: string;
    organicMatterPercent: number;
  };
  hydraulicLimits: {
    permanentWiltingPointVolumetric: number;
    fieldCapacityVolumetric: number;
    saturationPointVolumetric: number;
    totalAvailableWaterCapacity: number;
  };
  smapObservations: {
    surfaceMoisture_0_5cm: number;
    rootZoneMoisture_0_100cm: number;
    unit: string;
    observationInstrument: string;
    resolution: string;
    revisitCadence: string;
  };
  agronomicMoistureStatus: {
    stressLevel: 'SEVERE_DROUGHT_STRESS' | 'MILD_MOISTURE_DEFICIT' | 'OPTIMAL_MOISTURE' | 'WATERLOGGED_SATURATED';
    relativeAvailableMoisturePercent: number;
    statusText: string;
    irrigationDeficitMm: number;
    actionRecommended: string;
  };
  provenance: {
    dataSource: string;
    repositoryStandard: string;
    doi: string;
    calibrationSpecification: string;
    isDemoData: boolean;
    status: string;
  };
}

export interface RotationEvaluationFactor {
  name: string;
  weightPct: number;
  score: number; // 0 to 100
  explanation: string;
  positiveFactors: string[];
  potentialRisks: string[];
}

export interface RotationEvaluation {
  id?: string;
  farmId?: string;
  countryCode?: string;
  currentCrop?: string;
  proposedSequence?: string[];
  overallScore: number;
  overallAssessment: 'Highly Recommended' | 'Recommended' | 'Recommended with Conditions' | 'Alternative Suggested' | 'Conditional / Moderate Risk' | 'Not Advised';
  summaryExplanation: string;
  factors: {
    climateSuitability?: RotationEvaluationFactor | number;
    soilSuitability?: RotationEvaluationFactor | number;
    waterRequirements?: RotationEvaluationFactor | number;
    cropDiversity?: RotationEvaluationFactor | number;
    nitrogenFixation?: RotationEvaluationFactor | number;
    soilCompatibility?: number;
    moistureSufficiency?: number;
    nutrientManagement?: number;
    adaptationLevel?: number;
  };
  positiveHighlights: string[];
  potentialRisks: string[];
  missingInformationNotes: string[];
  suggestedPlantingWindow?: string;
  provenance?: DataProvenance;
  disclaimer: string;
}

export interface CropRecommendationCandidate {
  cropId: string;
  cropName: string;
  category: string;
  family: string;
  nitrogenFixation: boolean;
  overallScore: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedPlantingWindow: string;
  supportingObservations: string[];
  identifiedRisks: string[];
  waterRequirementsMm: string;
  growingDurationDays: string;
}

export interface FarmCropRecommendations {
  farmLocation: {
    latitude: number;
    longitude: number;
    countryCode: string;
  };
  environmentalProfile: {
    annualRainfallMm: number;
    meanTemperatureCelsius: number;
    soilPh: number;
    soilOrganicCarbonPct: number;
    soilClayPercentage: number;
    droughtSpi3: number;
    waterAvailability: string;
  };
  recommendations: CropRecommendationCandidate[];
  missingInformation: string[];
  disclaimer: string;
  sources: { name: string; parameter: string }[];
}

export interface FarmDataQualityDomainEvaluation {
  domain: string;
  provider: string;
  dataset: string;
  status: 'LIVE' | 'CACHED' | 'PARTIAL' | 'DEMONSTRATION' | 'UNAVAILABLE';
  spatialResolution: string;
  temporalResolution: string;
  isDemoData: boolean;
  completeness: string;
  notes: string;
}

export interface FarmDataQualitySummary {
  evaluatedAt: string;
  readinessLevel: 'HIGH_FIDELITY_OBSERVATIONAL' | 'OPERATIONAL_DECISION_GRADE' | 'PROVISIONAL_DEMONSTRATION' | 'INCOMPLETE_DATA';
  readinessDescription: string;
  summaryMetrics: {
    totalDomainsEvaluated: number;
    liveLayersCount: number;
    cachedLayersCount: number;
    demonstrationLayersCount: number;
    missingDomainsCount: number;
    hasRealSatelliteNdvi: boolean;
  };
  missingDomains: string[];
  evaluations: FarmDataQualityDomainEvaluation[];
}

export interface UserSettings {
  userName: string;
  organization: string;
  email: string;
  selectedCountryCode: string; // ISO 3166-1 alpha-2 (e.g. "ET", "KE")
  language: string; // 'en' | 'am' | 'sw' | 'fr' | 'ar'
  measurementUnits: {
    area: 'hectares' | 'acres';
    temperature: 'celsius' | 'fahrenheit';
    rainfall: 'mm' | 'inches';
  };
  theme: 'light' | 'dark' | 'system';
  dataRefreshCadence: 'daily' | 'weekly' | 'manual';
  notificationsEnabled: boolean;
}
