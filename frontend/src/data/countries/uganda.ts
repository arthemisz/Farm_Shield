import { CountryConfig } from '../../types';

export const ugandaConfig: CountryConfig = {
  id: 'uganda',
  name: 'Uganda',
  isoCode: 'UG',
  flag: '🇺🇬',
  currency: {
    name: 'Ugandan Shilling',
    code: 'UGX',
    symbol: 'USh',
  },
  defaultLanguage: 'en',
  supportedLanguages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  ],
  measurementUnits: {
    area: 'acres',
    temperature: 'celsius',
    rainfall: 'mm',
  },
  administrativeLevels: [
    { level: 1, name: 'Region', pluralName: 'Regions', placeholder: 'Select Region' },
    { level: 2, name: 'District', pluralName: 'Districts', placeholder: 'Enter District' },
    { level: 3, name: 'Sub-county', pluralName: 'Sub-counties', placeholder: 'Enter Sub-county' },
  ],
  supportedCrops: ['maize'],
  dataProviders: [
    {
      name: 'NASA POWER Agroclimatology',
      type: 'climate',
      provider: 'NASA',
      coverage: 'National coverage',
      status: 'planned',
      notes: 'Bimodal equatorial rainfall profiling planned.',
    },
  ],
  agriculturalSources: [
    'National Agricultural Research Organisation (NARO Uganda)',
  ],
  supportStatus: 'planned',
  statusMessage: 'Planned expansion: District administrative structure mapped. Crop suitability profiles pending partner validation.',
  bounds: {
    minLat: -1.5,
    maxLat: 4.2,
    minLng: 29.5,
    maxLng: 35.0,
    center: [1.3733, 32.2903],
    defaultZoom: 7,
  },
};

