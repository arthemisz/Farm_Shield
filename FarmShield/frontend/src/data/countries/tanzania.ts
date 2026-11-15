import { CountryConfig } from '../../types';

export const tanzaniaConfig: CountryConfig = {
  id: 'tanzania',
  name: 'Tanzania',
  isoCode: 'TZ',
  flag: '🇹🇿',
  currency: {
    name: 'Tanzanian Shilling',
    code: 'TZS',
    symbol: 'TSh',
  },
  defaultLanguage: 'sw',
  supportedLanguages: [
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
    { code: 'en', name: 'English', nativeName: 'English' },
  ],
  measurementUnits: {
    area: 'hectares',
    temperature: 'celsius',
    rainfall: 'mm',
  },
  administrativeLevels: [
    { level: 1, name: 'Region (Mkoa)', pluralName: 'Regions', placeholder: 'Select Region' },
    { level: 2, name: 'District (Wilaya)', pluralName: 'Districts', placeholder: 'Enter District' },
    { level: 3, name: 'Ward (Kata)', pluralName: 'Wards', placeholder: 'Enter Ward' },
  ],
  supportedCrops: ['maize'],
  dataProviders: [
    {
      name: 'NASA POWER Agroclimatology',
      type: 'climate',
      provider: 'NASA',
      coverage: 'National coverage',
      status: 'planned',
      notes: 'Southern Highlands and Northern grain corridors planned.',
    },
  ],
  agriculturalSources: [
    'Tanzania Agricultural Research Institute (TARI)',
  ],
  supportStatus: 'planned',
  statusMessage: 'Planned expansion: Regional agricultural calendar mapping in progress with East African data partners.',
  bounds: {
    minLat: -11.8,
    maxLat: -0.9,
    minLng: 29.3,
    maxLng: 40.5,
    center: [-6.369, 34.8888],
    defaultZoom: 6,
  },
};

