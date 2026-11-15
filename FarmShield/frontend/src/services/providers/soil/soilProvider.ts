import { SoilInformation, Farm } from '../../../types';

export interface SoilProviderRequest {
  latitude: number;
  longitude: number;
  countryCode?: string;
  farmContext?: Farm;
}

export interface ISoilProvider {
  name: string;
  providerId: string;
  getSoilData(req: SoilProviderRequest): Promise<SoilInformation>;
}

/**
 * Standard ISRIC SoilGrids 250m Simulation Provider
 * Simulates REST queries for depth 0-30cm (phh2o, soc, clay, sand, silt, cec, bdod)
 */
export class SoilGridsProvider implements ISoilProvider {
  name = 'ISRIC SoilGrids 2.0';
  providerId = 'isric-soilgrids';

  async getSoilData(req: SoilProviderRequest): Promise<SoilInformation> {
    const soilType = req.farmContext?.soilType || 'Vertisols (Black clay)';
    const isVertisol = soilType.includes('Vertisols');
    const isNitisol = soilType.includes('Nitisols');
    const isFerralsol = soilType.includes('Ferralsols');

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
      'Seasonal monitoring of nutrient leaching recommended after peak precipitation.',
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
        'Waterlogging hazard during peak rains; Broad Bed and Furrow (BBM) management advised for cereals/pulses.',
        'High cation retention capacity, retaining nutrients effectively once drained.',
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
        'High phosphorus fixation capacity; organic amendment or pulse rotation promotes available P release.',
        'Excellent rooting depth for cereal taproots and legumes.',
      ];
    } else if (isFerralsol) {
      ph = 5.4;
      organicCarbonPct = 2.1;
      textureClass = 'Weathered red tropical clay';
      clay = 52;
      sand = 30;
      silt = 18;
      drainage = 'Well drained';
      fertility = 'Moderate';
      notes = [
        'Heavily weathered tropical soil; prone to acidity and rapid nutrient leaching under intensive cultivation.',
        'Responds favorably to leguminous green manure and lime treatment.',
      ];
    }

    return {
      farmId: req.farmContext?.id || `coords-${req.latitude.toFixed(2)}-${req.longitude.toFixed(2)}`,
      countryCode: req.countryCode || req.farmContext?.countryCode || 'ET',
      provenance: {
        provider: 'ISRIC SoilGrids 250m REST API',
        source: 'International Soil Reference and Information Centre (ISRIC)',
        retrievalDate: new Date().toISOString().split('T')[0],
        timePeriod: 'SoilGrids v2.0 Global Standard',
        spatialResolution: '250m raster resolution (Depth: 0-30cm)',
        measurementType: 'satellite_model',
        limitations:
          'Soil properties are machine learning spatial predictions calibrated against global profiles. They represent general soil order trends and do not substitute certified laboratory chemical soil tests.',
        isDemoData: true,
      },
      soilType,
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
  }
}

