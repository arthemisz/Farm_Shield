import { CountryConfig } from '../../types';

export const kenyaConfig: CountryConfig = {
  id: 'kenya',
  name: 'Kenya',
  isoCode: 'KE',
  flag: '🇰🇪',
  currency: {
    name: 'Kenyan Shilling',
    code: 'KES',
    symbol: 'KSh',
  },
  defaultLanguage: 'en',
  supportedLanguages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  ],
  measurementUnits: {
    area: 'acres', // Widely used in Kenya alongside hectares
    temperature: 'celsius',
    rainfall: 'mm',
  },
  administrativeLevels: [
    { level: 1, name: 'County', pluralName: 'Counties', placeholder: 'Select County' },
    { level: 2, name: 'Sub-county', pluralName: 'Sub-counties', placeholder: 'Enter Sub-county' },
    { level: 3, name: 'Ward', pluralName: 'Wards', placeholder: 'Enter Ward' },
  ],
  supportedCrops: ['maize', 'wheat'], // Crops scheduled for Kenyan validation
  dataProviders: [
    {
      name: 'NASA POWER Agroclimatology',
      type: 'climate',
      provider: 'NASA Langley',
      coverage: 'National coverage (0.5° spatial grid)',
      status: 'planned',
      notes: 'Pending validation against Kenya Meteorological Department (KMD) station records.',
    },
    {
      name: 'ISRIC SoilGrids 2.0',
      type: 'soil',
      provider: 'ISRIC',
      coverage: '250m resolution',
      status: 'planned',
      notes: 'Soil mapping for Ferralsols and Acrisols in Western/Rift areas pending calibration.',
    },
  ],
  agriculturalSources: [
    'Kenya Agricultural and Livestock Research Organisation (KALRO)',
    'Ministry of Agriculture and Livestock Development (MoALD)',
  ],
  supportStatus: 'planned',
  statusMessage: 'Planned expansion: County administrative divisions configured. Agronomic rules and field validation pending with KALRO.',
  bounds: {
    minLat: -4.7,
    maxLat: 5.0,
    minLng: 33.9,
    maxLng: 41.9,
    center: [0.0236, 37.9062],
    defaultZoom: 6,
  },
};

