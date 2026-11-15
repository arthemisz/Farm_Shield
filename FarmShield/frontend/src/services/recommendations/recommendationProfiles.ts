export interface RecommendationWeights {
  climateWeightPct: number;
  soilWeightPct: number;
  waterWeightPct: number;
  diversityWeightPct: number;
  nitrogenWeightPct: number;
}

export interface RecommendationProfile {
  countryCode: string;
  name: string;
  defaultWeights: RecommendationWeights;
  notes: string;
}

// Configurable country-specific recommendation profiles
// Authoritative Scientific Weights: Climate 25%, Soil 25%, Water 25%, Nitrogen Fixation 15%, Diversity 10%
export const RECOMMENDATION_PROFILES: Record<string, RecommendationProfile> = {
  ET: {
    countryCode: 'ET',
    name: 'Ethiopian Highlands & Rift Valley Profile',
    defaultWeights: {
      climateWeightPct: 25,
      soilWeightPct: 25,
      waterWeightPct: 25,
      nitrogenWeightPct: 15,
      diversityWeightPct: 10,
    },
    notes: 'Prioritizes Vertisol drainage accommodation and cool-season legume biological nitrogen replenishment.',
  },
  KE: {
    countryCode: 'KE',
    name: 'Kenyan Agro-Ecological Zones Profile (Planned)',
    defaultWeights: {
      climateWeightPct: 25,
      soilWeightPct: 25,
      waterWeightPct: 25,
      nitrogenWeightPct: 15,
      diversityWeightPct: 10,
    },
    notes: 'Draft weighting adapted for bimodal rainfall belts and acidic Ferralsols.',
  },
  DEFAULT: {
    countryCode: 'DEFAULT',
    name: 'Global Heuristic Multi-Factor Profile',
    defaultWeights: {
      climateWeightPct: 25,
      soilWeightPct: 25,
      waterWeightPct: 25,
      nitrogenWeightPct: 15,
      diversityWeightPct: 10,
    },
    notes: 'Authoritative multi-factor baseline: Climate (25%), Soil (25%), Water (25%), Nitrogen (15%), Diversity (10%).',
  },
};

export const getRecommendationProfile = (countryCode: string): RecommendationProfile => {
  return RECOMMENDATION_PROFILES[(countryCode || 'ET').toUpperCase()] || RECOMMENDATION_PROFILES.DEFAULT;
};

