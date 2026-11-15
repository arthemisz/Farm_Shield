import { CountryConfig } from '../../types';

export const ethiopiaConfig: CountryConfig = {
  id: 'ethiopia',
  name: 'Ethiopia',
  isoCode: 'ET',
  flag: '🇪🇹',
  currency: {
    name: 'Ethiopian Birr',
    code: 'ETB',
    symbol: 'Br',
  },
  defaultLanguage: 'en',
  supportedLanguages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  ],
  measurementUnits: {
    area: 'hectares',
    temperature: 'celsius',
    rainfall: 'mm',
  },
  administrativeLevels: [
    { level: 1, name: 'Region', pluralName: 'Regions', placeholder: 'Select Region' },
    { level: 2, name: 'Zone', pluralName: 'Zones', placeholder: 'Enter Administrative Zone' },
    { level: 3, name: 'Woreda', pluralName: 'Woredas', placeholder: 'Enter Woreda / District' },
  ],
  supportedCrops: ['teff', 'wheat', 'maize', 'faba_bean'],
  dataProviders: [
    {
      name: 'NASA POWER Agroclimatology',
      type: 'climate',
      provider: 'NASA Langley / Goddard',
      coverage: 'National coverage (0.5° spatial grid)',
      status: 'simulated',
      notes: 'Calibrated for Ethiopian highlands, rift valley, and lowlands.',
    },
    {
      name: 'ISRIC SoilGrids 2.0',
      type: 'soil',
      provider: 'ISRIC - World Soil Information',
      coverage: '250m global raster grid',
      status: 'simulated',
      notes: 'Detailed Vertisols, Nitisols, Cambisols properties.',
    },
    {
      name: 'OpenStreetMap Carto',
      type: 'mapping',
      provider: 'OpenStreetMap Contributors',
      coverage: 'National road and administrative boundaries',
      status: 'active',
      notes: 'Free open spatial layer.',
    },
  ],
  agriculturalSources: [
    'Ethiopian Institute of Agricultural Research (EIAR)',
    'Ministry of Agriculture of Ethiopia (MoA)',
    'FAO Ethiopia Land & Water Division',
    'CIMMYT & ICARDA Highland Legumes Programs',
  ],
  supportStatus: 'fully_supported',
  statusMessage: 'Fully supported pilot territory with validated agroclimate models and initial staple crops.',
  bounds: {
    minLat: 3.4,
    maxLat: 14.9,
    minLng: 33.0,
    maxLng: 48.0,
    center: [9.145, 40.4896],
    defaultZoom: 6,
  },
};

