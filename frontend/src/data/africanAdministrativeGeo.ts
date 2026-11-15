/**
 * Geolocation Directory for African Sovereign Countries, Regions, and Rural Districts
 * Ensures that when a farmer selects their country and administrative hierarchy,
 * the interactive map automatically centers, zooms, and locates the true place.
 */

export interface LocationGeo {
  center: [number, number]; // [lat, lng]
  zoom: number;
}

// 1. All 54 African Sovereign Countries with exact centers and zoom levels
export const ALL_54_AFRICAN_COUNTRY_CENTERS: Record<string, LocationGeo> = {
  DZ: { center: [28.0339, 1.6596], zoom: 5 },
  AO: { center: [-11.2027, 17.8739], zoom: 6 },
  BJ: { center: [9.3077, 2.3158], zoom: 7 },
  BW: { center: [-22.3285, 24.6849], zoom: 6 },
  BF: { center: [12.2383, -1.5616], zoom: 7 },
  BI: { center: [-3.3731, 29.9189], zoom: 9 },
  CV: { center: [16.5388, -23.0418], zoom: 9 },
  CM: { center: [7.3697, 12.3547], zoom: 6 },
  CF: { center: [6.6111, 20.9394], zoom: 6 },
  TD: { center: [15.4542, 18.7322], zoom: 5 },
  KM: { center: [-11.875, 43.8722], zoom: 10 },
  CG: { center: [-0.228, 15.8277], zoom: 6 },
  CD: { center: [-4.0383, 21.7587], zoom: 5 },
  CI: { center: [7.54, -5.5471], zoom: 7 },
  DJ: { center: [11.8251, 42.5903], zoom: 8 },
  EG: { center: [26.8206, 30.8025], zoom: 6 },
  GQ: { center: [1.6508, 10.2679], zoom: 8 },
  ER: { center: [15.1794, 39.7823], zoom: 7 },
  SZ: { center: [-26.5225, 31.4659], zoom: 9 },
  ET: { center: [9.145, 40.4897], zoom: 6 },
  GA: { center: [-0.8037, 11.6094], zoom: 7 },
  GM: { center: [13.4432, -15.3101], zoom: 8 },
  GH: { center: [7.9465, -1.0232], zoom: 7 },
  GN: { center: [9.9456, -9.6966], zoom: 7 },
  GW: { center: [11.8037, -15.1804], zoom: 8 },
  KE: { center: [0.0236, 37.9062], zoom: 6 },
  LS: { center: [-29.6099, 28.2336], zoom: 8 },
  LR: { center: [6.4281, -9.4295], zoom: 7 },
  LY: { center: [26.3351, 17.2283], zoom: 5 },
  MG: { center: [-18.7669, 46.8691], zoom: 6 },
  MW: { center: [-13.2543, 34.3015], zoom: 7 },
  ML: { center: [17.5707, -3.9962], zoom: 5 },
  MR: { center: [21.0079, -10.9408], zoom: 6 },
  MU: { center: [-20.3484, 57.5522], zoom: 10 },
  MA: { center: [31.7917, -7.0926], zoom: 6 },
  MZ: { center: [-18.6657, 35.5296], zoom: 6 },
  NA: { center: [-22.9576, 18.4904], zoom: 6 },
  NE: { center: [17.6078, 8.0817], zoom: 5 },
  NG: { center: [9.082, 8.6753], zoom: 6 },
  RW: { center: [-1.9403, 29.8739], zoom: 9 },
  ST: { center: [0.1864, 6.6131], zoom: 10 },
  SN: { center: [14.4974, -14.4524], zoom: 7 },
  SC: { center: [-4.6796, 55.492], zoom: 11 },
  SL: { center: [8.4606, -11.7799], zoom: 8 },
  SO: { center: [5.1521, 46.1996], zoom: 6 },
  ZA: { center: [-30.5595, 22.9375], zoom: 6 },
  SS: { center: [6.877, 31.307], zoom: 6 },
  SD: { center: [12.8628, 30.2176], zoom: 5 },
  TZ: { center: [-6.369, 34.8888], zoom: 6 },
  TG: { center: [8.6195, 0.8248], zoom: 7 },
  TN: { center: [33.8869, 9.5375], zoom: 6 },
  UG: { center: [1.3733, 32.2903], zoom: 7 },
  ZM: { center: [-13.1339, 27.8493], zoom: 6 },
  ZW: { center: [-19.0154, 29.1549], zoom: 6 },
};

// 2. Comprehensive Subnational / District Coordinates Lookup
// Key is normalized lowercase text
export const SUBNATIONAL_COORDINATES_MAP: Record<string, LocationGeo> = {
  // Ethiopia - Regional States & Major Agricultural Hubs
  'addis ababa': { center: [9.02, 38.74], zoom: 12 },
  'oromia': { center: [8.54, 39.27], zoom: 8 },
  'oromia (adama / nazret)': { center: [8.54, 39.27], zoom: 9 },
  'amhara': { center: [11.6, 37.38], zoom: 8 },
  'amhara (bahir dar)': { center: [11.59, 37.39], zoom: 9 },
  'tigray': { center: [13.5, 39.47], zoom: 8 },
  'tigray (mekelle)': { center: [13.5, 39.47], zoom: 9 },
  'sidama': { center: [7.05, 38.48], zoom: 9 },
  'sidama (hawassa)': { center: [7.05, 38.48], zoom: 10 },
  'somali': { center: [9.35, 42.8], zoom: 8 },
  'somali (jijiga)': { center: [9.35, 42.8], zoom: 9 },
  'afar': { center: [11.79, 41.0], zoom: 8 },
  'afar (semera)': { center: [11.79, 41.0], zoom: 9 },
  'benishangul-gumuz': { center: [10.07, 34.53], zoom: 8 },
  'benishangul-gumuz (assosa)': { center: [10.07, 34.53], zoom: 9 },
  'gambela': { center: [8.25, 34.59], zoom: 9 },
  'gambela (gambela town)': { center: [8.25, 34.59], zoom: 10 },
  'harari': { center: [9.31, 42.12], zoom: 11 },
  'harari (harar)': { center: [9.31, 42.12], zoom: 11 },
  'dire dawa': { center: [9.6, 41.86], zoom: 11 },
  'south ethiopia': { center: [6.03, 37.55], zoom: 8 },
  'south ethiopia (arba minch)': { center: [6.03, 37.55], zoom: 9 },
  'central ethiopia': { center: [7.55, 37.85], zoom: 8 },
  'central ethiopia (hosaena)': { center: [7.55, 37.85], zoom: 9 },

  // Ethiopia - Towns, Districts & Woredas
  'bishoftu (debre zeyit)': { center: [8.7523, 38.9841], zoom: 13 },
  'bishoftu': { center: [8.7523, 38.9841], zoom: 13 },
  'debre zeit': { center: [8.7523, 38.9841], zoom: 13 },
  'adama': { center: [8.54, 39.27], zoom: 12 },
  'adama town': { center: [8.54, 39.27], zoom: 12 },
  'asella': { center: [7.9556, 39.1214], zoom: 12 },
  'arsi': { center: [7.9556, 39.1214], zoom: 10 },
  'jimma': { center: [7.6734, 36.8344], zoom: 12 },
  'shashamane': { center: [7.2, 38.6], zoom: 12 },
  'bale robe': { center: [7.12, 40.01], zoom: 12 },
  'nekemte': { center: [9.08, 36.55], zoom: 12 },
  'ambo': { center: [8.98, 37.85], zoom: 12 },
  'waliso': { center: [8.53, 37.97], zoom: 12 },
  'bahir dar': { center: [11.59, 37.39], zoom: 12 },
  'bahir dar city': { center: [11.59, 37.39], zoom: 12 },
  'gondar': { center: [12.6, 37.46], zoom: 12 },
  'dessie': { center: [11.13, 39.63], zoom: 12 },
  'debre birhan': { center: [9.68, 39.53], zoom: 12 },
  'debre markos': { center: [10.33, 37.73], zoom: 12 },
  'kombolcha': { center: [11.08, 39.73], zoom: 12 },
  'woldiya': { center: [11.83, 39.6], zoom: 12 },
  'mekelle': { center: [13.5, 39.47], zoom: 12 },
  'mekelle city': { center: [13.5, 39.47], zoom: 12 },
  'axum': { center: [14.12, 38.72], zoom: 13 },
  'adigrat': { center: [14.28, 39.46], zoom: 12 },
  'adwa': { center: [14.16, 38.9], zoom: 12 },
  'shire': { center: [14.1, 38.28], zoom: 12 },
  'shire (inda selassie)': { center: [14.1, 38.28], zoom: 12 },
  'alamata': { center: [12.42, 39.56], zoom: 12 },
  'hawassa': { center: [7.05, 38.48], zoom: 12 },
  'hawassa city': { center: [7.05, 38.48], zoom: 12 },
  'yirgalem': { center: [6.75, 38.42], zoom: 12 },
  'aleta wondo': { center: [6.6, 38.42], zoom: 12 },
  'arba minch': { center: [6.03, 37.55], zoom: 12 },
  'arba minch town': { center: [6.03, 37.55], zoom: 12 },
  'sodo': { center: [6.86, 37.76], zoom: 12 },
  'sodo (wolaita)': { center: [6.86, 37.76], zoom: 12 },
  'dilla': { center: [6.41, 38.31], zoom: 12 },
  'dilla (gedeo)': { center: [6.41, 38.31], zoom: 12 },
  'hosaena': { center: [7.55, 37.85], zoom: 12 },
  'butajira': { center: [8.12, 38.37], zoom: 12 },
  'bole': { center: [8.99, 38.79], zoom: 13 },
  'yeka': { center: [9.03, 38.81], zoom: 13 },
  'kirkos': { center: [9.01, 38.76], zoom: 13 },
  'arada': { center: [9.03, 38.75], zoom: 13 },
  'lideta': { center: [9.01, 38.73], zoom: 13 },
  'akaki kality': { center: [8.9, 38.77], zoom: 13 },
  'ada\'a': { center: [8.75, 38.98], zoom: 13 },
  'gimbichu': { center: [8.95, 39.15], zoom: 13 },
  'tiyo': { center: [7.95, 39.12], zoom: 13 },
  'hetosa': { center: [8.12, 39.25], zoom: 13 },

  // Kenya
  'nairobi': { center: [-1.2921, 36.8219], zoom: 11 },
  'uasin gishu': { center: [0.5167, 35.2833], zoom: 10 },
  'eldoret': { center: [0.5167, 35.2833], zoom: 12 },
  'nakuru': { center: [-0.3031, 36.08], zoom: 11 },
  'trans nzoia': { center: [1.0167, 35.0], zoom: 10 },
  'kitale': { center: [1.0167, 35.0], zoom: 12 },
  'kiambu': { center: [-1.1714, 36.8356], zoom: 11 },
  'meru': { center: [0.05, 37.65], zoom: 11 },
  'machakos': { center: [-1.5167, 37.2667], zoom: 11 },
  'kisumu': { center: [-0.0917, 34.768], zoom: 12 },
  'mombasa': { center: [-4.0435, 39.6682], zoom: 11 },
  'kakamega': { center: [0.2827, 34.7519], zoom: 11 },
  'bungoma': { center: [0.5695, 34.5584], zoom: 11 },
  'narok': { center: [-1.0783, 35.8601], zoom: 10 },

  // Nigeria
  'abuja': { center: [9.0765, 7.3986], zoom: 11 },
  'lagos': { center: [6.5244, 3.3792], zoom: 11 },
  'kano': { center: [12.0022, 8.592], zoom: 11 },
  'oyo': { center: [7.85, 3.93], zoom: 9 },
  'ibadan': { center: [7.3775, 3.947], zoom: 12 },
  'kaduna': { center: [10.5105, 7.4165], zoom: 11 },
  'benue': { center: [7.73, 8.52], zoom: 9 },
  'makurdi': { center: [7.73, 8.52], zoom: 12 },
  'enugu': { center: [6.4584, 7.5464], zoom: 11 },
  'rivers': { center: [4.8156, 7.0498], zoom: 10 },
  'port harcourt': { center: [4.8156, 7.0498], zoom: 12 },

  // Ghana
  'accra': { center: [5.6037, -0.187], zoom: 11 },
  'ashanti': { center: [6.6885, -1.6244], zoom: 9 },
  'kumasi': { center: [6.6885, -1.6244], zoom: 12 },
  'tamale': { center: [9.4008, -0.8393], zoom: 12 },
  'northern region': { center: [9.4, -0.84], zoom: 8 },

  // Tanzania
  'dodoma': { center: [-6.163, 35.7516], zoom: 11 },
  'dar es salaam': { center: [-6.7924, 39.2083], zoom: 11 },
  'arusha': { center: [-3.3869, 36.683], zoom: 11 },
  'mbeya': { center: [-8.9, 33.45], zoom: 11 },
  'morogoro': { center: [-6.8278, 37.6667], zoom: 11 },
  'kilimanjaro': { center: [-3.3349, 37.3404], zoom: 10 },
  'moshi': { center: [-3.3349, 37.3404], zoom: 12 },

  // Uganda
  'kampala': { center: [0.3476, 32.5825], zoom: 12 },
  'wakiso': { center: [0.4, 32.48], zoom: 11 },
  'mbarara': { center: [-0.6072, 30.6545], zoom: 12 },
  'gulu': { center: [2.7747, 32.299], zoom: 12 },
  'jinja': { center: [0.4244, 33.2042], zoom: 12 },

  // Rwanda
  'kigali': { center: [-1.9441, 30.0619], zoom: 12 },
  'musanze': { center: [-1.4998, 29.6349], zoom: 12 },
  'huye': { center: [-2.5967, 29.7394], zoom: 12 },
  'rubavu': { center: [-1.6792, 29.2636], zoom: 12 },
};

/**
 * Resolve the best matching coordinates and zoom for a country, region, and district selection.
 */
export function resolveAdministrativeCoordinates(
  countryCode: string,
  admin1?: string,
  admin2?: string
): LocationGeo {
  const normCountry = (countryCode || 'ET').toUpperCase();
  const norm1 = (admin1 || '').trim().toLowerCase();
  const norm2 = (admin2 || '').trim().toLowerCase();

  // 1. Try district / sub-city match (highest precision)
  if (norm2) {
    if (SUBNATIONAL_COORDINATES_MAP[norm2]) {
      return SUBNATIONAL_COORDINATES_MAP[norm2];
    }
    // Partial substring match in subnational map
    for (const [key, geo] of Object.entries(SUBNATIONAL_COORDINATES_MAP)) {
      if (norm2.includes(key) || key.includes(norm2)) {
        return { center: geo.center, zoom: 13 };
      }
    }
  }

  // 2. Try region / province match
  if (norm1) {
    if (SUBNATIONAL_COORDINATES_MAP[norm1]) {
      return SUBNATIONAL_COORDINATES_MAP[norm1];
    }
    for (const [key, geo] of Object.entries(SUBNATIONAL_COORDINATES_MAP)) {
      if (norm1.includes(key) || key.includes(norm1)) {
        return { center: geo.center, zoom: 10 };
      }
    }
  }

  // 3. Fallback to sovereign country centroid
  if (ALL_54_AFRICAN_COUNTRY_CENTERS[normCountry]) {
    return ALL_54_AFRICAN_COUNTRY_CENTERS[normCountry];
  }

  // 4. Default baseline (Ethiopia agricultural highland)
  return { center: [9.145, 40.4897], zoom: 6 };
}

