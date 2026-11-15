import { CountryConfig } from '../../types';
import { ethiopiaConfig } from './ethiopia';
import { kenyaConfig } from './kenya';
import { ugandaConfig } from './uganda';
import { tanzaniaConfig } from './tanzania';
import { rwandaConfig } from './rwanda';
import { AFRICAN_ADMIN_DIVISIONS, getAdmin1Options, getAdmin2Options } from './divisions';

export * from './divisions';

export const COUNTRIES: Record<string, CountryConfig> = {
  ET: ethiopiaConfig,
  KE: kenyaConfig,
  UG: ugandaConfig,
  TZ: tanzaniaConfig,
  RW: rwandaConfig,
};

export const COUNTRIES_LIST: CountryConfig[] = [
  ethiopiaConfig,
  kenyaConfig,
  ugandaConfig,
  tanzaniaConfig,
  rwandaConfig,
];

export const getCountryConfig = (isoCode: string): CountryConfig => {
  const code = (isoCode || 'ET').toUpperCase();
  return COUNTRIES[code] || ethiopiaConfig;
};

// Administrative Level 1 sample options for supported and planned countries
export const COUNTRY_ADMIN_LEVEL1_OPTIONS: Record<string, string[]> = {
  ET: [
    'Oromia',
    'Amhara',
    'Tigray',
    'Sidama',
    'SNNPR',
    'Central Ethiopia',
    'South Ethiopia',
    'Somali',
    'Afar',
    'Benishangul-Gumuz',
    'Gambela',
    'Harari',
    'Dire Dawa',
    'Addis Ababa',
  ],
  KE: [
    'Uasin Gishu',
    'Trans Nzoia',
    'Nakuru',
    'Kiambu',
    'Meru',
    'Machakos',
    'Nandi',
    'Bungoma',
    'Kakamega',
    'Kisii',
    'Narok',
  ],
  UG: [
    'Central Region',
    'Eastern Region',
    'Northern Region',
    'Western Region',
  ],
  TZ: [
    'Arusha',
    'Kilimanjaro',
    'Mbeya',
    'Morogoro',
    'Iringa',
    'Ruvuma',
    'Tanga',
    'Dodoma',
  ],
  RW: [
    'Northern Province',
    'Southern Province',
    'Eastern Province',
    'Western Province',
    'Kigali City',
  ],
};

