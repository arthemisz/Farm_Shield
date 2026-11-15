import { CountryConfig } from '../../types';

export const rwandaConfig: CountryConfig = {
  id: 'rwanda',
  name: 'Rwanda',
  isoCode: 'RW',
  flag: '🇷🇼',
  currency: {
    name: 'Rwandan Franc',
    code: 'RWF',
    symbol: 'FRw',
  },
  defaultLanguage: 'en',
  supportedLanguages: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  ],
  measurementUnits: {
    area: 'hectares',
    temperature: 'celsius',
    rainfall: 'mm',
  },
  administrativeLevels: [
    { level: 1, name: 'Province (Intara)', pluralName: 'Provinces', placeholder: 'Select Province' },
    { level: 2, name: 'District (Akarere)', pluralName: 'Districts', placeholder: 'Enter District' },
    { level: 3, name: 'Sector (Umurenge)', pluralName: 'Sectors', placeholder: 'Enter Sector' },
  ],
  supportedCrops: ['maize', 'faba_bean'],
  dataProviders: [
    {
      name: 'NASA POWER Agroclimatology',
      type: 'climate',
      provider: 'NASA',
      coverage: 'Highland terrain (0.5° resolution)',
      status: 'planned',
      notes: 'Terrace elevation microclimate modeling required.',
    },
  ],
  agriculturalSources: [
    'Rwanda Agriculture and Animal Resources Development Board (RAB)',
  ],
  supportStatus: 'planned',
  statusMessage: 'Planned expansion: Steep slope and volcanic terrace crop suitability models under development.',
  bounds: {
    minLat: -2.9,
    maxLat: -1.0,
    minLng: 28.8,
    maxLng: 30.9,
    center: [-1.9403, 29.8739],
    defaultZoom: 8,
  },
};

