import { SoilInformation, Farm } from '../types';

export const getSoilDataForFarm = (farm: Farm): SoilInformation => {
  const isVertisol = farm.soilType.includes('Vertisols');
  const isNitisol = farm.soilType.includes('Nitisols');

  let ph = 6.8;
  let organicCarbonPct = 2.4;
  let textureClass = 'Clay loam';
  let clay = 42;
  let sand = 28;
  let silt = 30;
  let drainage: SoilInformation['drainageClass'] = 'Moderately well drained';
  let fertility: SoilInformation['fertilityStatus'] = 'Moderate';
  let notes = [
    'Subsoil demonstrates moderate organic carbon storage capability.',
    'Seasonal monitoring of nutrient leaching recommended after peak Kiremt rains.',
  ];

  if (isVertisol) {
    ph = 7.2;
    organicCarbonPct = 1.9;
    textureClass = 'Heavy clay (Black cracking soil)';
    clay = 62;
    sand = 15;
    silt = 23;
    drainage = 'Poorly drained';
    fertility = 'High';
    notes = [
      'High swelling-shrinking montmorillonite clay content causes surface cracking when dry.',
      'Waterlogging hazard during peak rains; BBM recommended.',
    ];
  } else if (isNitisol) {
    ph = 5.9;
    organicCarbonPct = 3.2;
    textureClass = 'Clay loam to reddish friable clay';
    clay = 48;
    sand = 24;
    silt = 28;
    drainage = 'Well drained';
    fertility = 'High';
    notes = [
      'Deep, porous red volcanic profile with stable aggregate structure.',
      'Excellent rooting depth for cereal taproots and legumes.',
    ];
  }

  return {
    farmId: farm.id,
    countryCode: farm.countryCode || 'ET',
    provenance: {
      provider: 'ISRIC SoilGrids 2.0',
      source: 'ISRIC World Soil Information',
      retrievalDate: new Date().toISOString().split('T')[0],
      timePeriod: 'SoilGrids Global Baseline',
      spatialResolution: '250m grid (0-30cm depth)',
      measurementType: 'satellite_model',
      limitations: 'Soil predictions based on global calibration profiles.',
      isDemoData: true,
    },
    soilType: farm.soilType,
    ph,
    organicCarbonPct,
    textureClass,
    clayPct: clay,
    sandPct: sand,
    siltPct: silt,
    cationExchangeCapacityCmol: 28.5,
    bulkDensityGPerCm3: 1.25,
    drainageClass: drainage,
    fertilityStatus: fertility,
    suitabilityNotes: notes,
  };
};
