export interface AgriculturalZone {
  id: string;
  name: string;
  cropId: string;
  cropName: string;
  scientificName: string;
  category: 'Cereal' | 'Legume' | 'Pulse' | 'Cash Crop' | 'Tuber' | 'Oilseed';
  countryCode: string;
  countryName: string;
  polygon: [number, number][]; // [lat, lng]
  fillColor: string;
  borderColor: string;
  areaHa: string;
  avgYield: string;
  season: string;
  soil: string;
  ndvi: string;
  description: string;
  provenanceClassification?: 'DEMONSTRATION' | 'DIGITIZED_REGIONAL_APPROXIMATION' | 'PUBLISHED_RESEARCH_POLYGON' | 'OFFICIAL_CADASTRAL';
  geometrySourceNotice?: string;
}

export const CONTINENTAL_BIOMES = [
  // Sahara Desert Zone
  {
    id: 'sahara-desert',
    name: 'Sahara Desert Arid Basin',
    type: 'DESERT',
    polygon: [
      [31.5, -9.0],
      [31.5, 33.0],
      [27.0, 34.5],
      [22.0, 36.5],
      [18.0, 37.0],
      [15.5, 32.0],
      [16.0, 15.0],
      [15.0, 0.0],
      [16.0, -15.0],
      [21.0, -17.0],
      [28.0, -13.0],
      [31.5, -9.0]
    ] as [number, number][],
    fillColor: '#E0A96D',
    borderColor: '#C68B59',
    opacity: 0.28,
    description: 'Hyper-arid continental desert basin (<50mm annual precipitation). Non-arable open sand sheets and regs.'
  },
  // Kalahari & Namib Desert Zone
  {
    id: 'kalahari-namib-desert',
    name: 'Kalahari & Namib Semi-Desert',
    type: 'DESERT',
    polygon: [
      [-19.0, 12.0],
      [-18.5, 24.0],
      [-22.0, 26.5],
      [-27.5, 25.0],
      [-30.0, 20.0],
      [-29.0, 16.5],
      [-23.0, 14.0],
      [-19.0, 12.0]
    ] as [number, number][],
    fillColor: '#D4A373',
    borderColor: '#B8865B',
    opacity: 0.26,
    description: 'Arid to semi-arid southwestern desert & scrublands with pastoral transhumance.'
  },
  // Sahel Semi-Arid Transition
  {
    id: 'sahel-agro-pastoral',
    name: 'Sahel Semi-Arid Agro-Pastoral Belt',
    type: 'SEMI_ARID',
    polygon: [
      [15.0, -16.0],
      [16.0, 0.0],
      [16.0, 15.0],
      [15.5, 32.0],
      [12.5, 34.0],
      [11.5, 15.0],
      [11.0, 0.0],
      [12.0, -16.0],
      [15.0, -16.0]
    ] as [number, number][],
    fillColor: '#CDBE78',
    borderColor: '#A89952',
    opacity: 0.22,
    description: 'Semi-arid agro-pastoral corridor (millet, sorghum, pastoral grazing).'
  },
  // Central & West African Humid / Rainforest Belt
  {
    id: 'central-rainforest-belt',
    name: 'Guineo-Congolian Humid Forest & Fertile Savanna',
    type: 'HUMID_TROPICAL',
    polygon: [
      [5.0, -9.0],
      [6.5, 2.0],
      [5.5, 10.0],
      [4.0, 28.0],
      [-4.0, 29.0],
      [-5.5, 20.0],
      [-5.0, 12.0],
      [2.0, 9.0],
      [4.0, -5.0],
      [5.0, -9.0]
    ] as [number, number][],
    fillColor: '#1E6F3D',
    borderColor: '#145A32',
    opacity: 0.22,
    description: 'High-rainfall tropical agro-ecological zone with perennial vegetative cover.'
  }
];

export const VERIFIED_FARMING_AREAS: AgriculturalZone[] = [
  // 1. Ethiopia - Teff Highlands (East Shewa / Arsi)
  {
    id: 'et-teff-arsi',
    name: "East Shewa & Arsi Teff Plateau (Ada'a Vertisol Plain)",
    cropId: 'teff',
    cropName: 'Teff (Eragrostis tef)',
    scientificName: 'Eragrostis tef',
    category: 'Cereal',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    polygon: [
      [8.35, 38.65],
      [8.95, 38.80],
      [9.15, 39.40],
      [8.70, 39.75],
      [8.20, 39.30],
      [8.35, 38.65]
    ],
    fillColor: '#B5CF78',
    borderColor: '#27AE60',
    areaHa: '3,120,000 ha',
    avgYield: '1.84 t/ha',
    season: 'Meher (July-Nov)',
    soil: 'Vertisols (Black clay)',
    ndvi: '0.68 - 0.76 (High Vigour)',
    description: 'Premier highland grain belt producing Magna & white teff under rainfed vertisol conditions.',
    provenanceClassification: 'DEMONSTRATION',
    geometrySourceNotice: 'Digitized regional macro-belt approximation (WGS84). Illustrative agro-ecological boundary, NOT an official property cadastral survey or individual farm parcel boundary.'
  },
  // 2. Ethiopia - Bale & Arsi Wheat Belt
  {
    provenanceClassification: 'DEMONSTRATION',
    geometrySourceNotice: 'Digitized regional macro-belt approximation (WGS84). Illustrative agro-ecological boundary, NOT an official property cadastral survey.',
    id: 'et-wheat-bale',
    name: 'Bale Highland Wheat & Barley Plains',
    cropId: 'wheat',
    cropName: 'Bread & Durum Wheat',
    scientificName: 'Triticum aestivum',
    category: 'Cereal',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    polygon: [
      [6.80, 39.50],
      [7.45, 39.65],
      [7.55, 40.35],
      [6.95, 40.40],
      [6.80, 39.50]
    ],
    fillColor: '#F39C12',
    borderColor: '#D68910',
    areaHa: '2,250,000 ha',
    avgYield: '3.11 t/ha',
    season: 'Meher (June-Dec)',
    soil: 'Nitisols & Cambisols',
    ndvi: '0.72 (Peak grain fill)',
    description: 'Highland commercial wheat and barley production corridor with combine-harvested tracts.'
  },
  // 3. Ethiopia - Jimma Montane Arabica Coffee Belt
  {
    provenanceClassification: 'DEMONSTRATION',
    geometrySourceNotice: 'Digitized regional macro-belt approximation (WGS84). Illustrative agro-ecological boundary, NOT an official property cadastral survey.',
    id: 'et-coffee-jimma',
    name: 'Jimma & Kaffa Montane Coffee Forests',
    cropId: 'coffee',
    cropName: 'Highland Arabica Coffee',
    scientificName: 'Coffea arabica',
    category: 'Cash Crop',
    countryCode: 'ET',
    countryName: 'Ethiopia',
    polygon: [
      [7.30, 36.40],
      [7.95, 36.55],
      [8.05, 37.15],
      [7.45, 37.10],
      [7.30, 36.40]
    ],
    fillColor: '#8E44AD',
    borderColor: '#71368A',
    areaHa: '810,000 ha',
    avgYield: '0.61 t/ha',
    season: 'Oct - Jan (Harvest)',
    soil: 'Humic Nitisols (Fertile volcanic)',
    ndvi: '0.82 (Dense Forest Canopy)',
    description: 'Ancestral home of Coffea arabica, grown under shade agroforestry systems.'
  },
  // 4. Kenya - Trans-Nzoia & Uasin Gishu Maize Belt
  {
    provenanceClassification: 'DEMONSTRATION',
    geometrySourceNotice: 'Digitized regional macro-belt approximation (WGS84). Illustrative agro-ecological boundary, NOT an official property cadastral survey.',
    id: 'ke-maize-grainbelt',
    name: 'Trans-Nzoia & Uasin Gishu Grain Belt',
    cropId: 'maize',
    cropName: 'White Grain Maize',
    scientificName: 'Zea mays',
    category: 'Cereal',
    countryCode: 'KE',
    countryName: 'Kenya',
    polygon: [
      [0.65, 34.85],
      [1.35, 34.90],
      [1.25, 35.50],
      [0.45, 35.45],
      [0.65, 34.85]
    ],
    fillColor: '#F1C40F',
    borderColor: '#D4AC0D',
    areaHa: '2,185,000 ha',
    avgYield: '1.57 t/ha',
    season: 'Long Rains (March-Sept)',
    soil: 'Nitisols & Ferralsols',
    ndvi: '0.71 (High Crop Vigour)',
    description: 'Kenya’s national breadbasket providing staple white maize to Nairobi and urban hubs.'
  },
  // 5. Kenya - Central Highlands (Kiambu/Nyeri) Coffee & Tea
  {
    provenanceClassification: 'DEMONSTRATION',
    geometrySourceNotice: 'Digitized regional macro-belt approximation (WGS84). Illustrative agro-ecological boundary, NOT an official property cadastral survey.',
    id: 'ke-coffee-central',
    name: 'Mount Kenya Volcanic Coffee Zone',
    cropId: 'coffee',
    cropName: 'Highland Arabica Coffee (SL28/SL34)',
    scientificName: 'Coffea arabica',
    category: 'Cash Crop',
    countryCode: 'KE',
    countryName: 'Kenya',
    polygon: [
      [-0.75, 36.70],
      [-0.20, 36.85],
      [-0.30, 37.30],
      [-0.85, 37.20],
      [-0.75, 36.70]
    ],
    fillColor: '#9B59B6',
    borderColor: '#884EA0',
    areaHa: '119,000 ha',
    avgYield: '0.43 t/ha',
    season: 'Main crop Oct-Dec',
    soil: 'Andosols (Rich Volcanic ash)',
    ndvi: '0.79 (Perennial evergreen)',
    description: 'World-renowned specialty coffee and washed Arabica smallholder cooperatives.'
  },
  // 6. Nigeria - Oyo / Ogun Root Crop Belt (Cassava)
  {
    provenanceClassification: 'DEMONSTRATION',
    geometrySourceNotice: 'Digitized regional macro-belt approximation (WGS84). Illustrative agro-ecological boundary, NOT an official property cadastral survey.',
    id: 'ng-cassava-southwest',
    name: 'Southwestern Cassava & Tuber Belt',
    cropId: 'cassava',
    cropName: 'Cassava Tubers (Fresh)',
    scientificName: 'Manihot esculenta',
    category: 'Tuber',
    countryCode: 'NG',
    countryName: 'Nigeria',
    polygon: [
      [6.90, 3.20],
      [7.85, 3.30],
      [7.95, 4.25],
      [6.80, 4.15],
      [6.90, 3.20]
    ],
    fillColor: '#16A085',
    borderColor: '#117A65',
    areaHa: '10,200,000 ha',
    avgYield: '5.96 t/ha',
    season: 'Year-Round (Bimodal rainfall)',
    soil: 'Ferric Luvisols',
    ndvi: '0.64 (Continuous canopy)',
    description: 'Largest cassava production region in West Africa feeding domestic gari and starch industries.'
  },
  // 7. Nigeria - Kano / Kaduna Grain & Legume Belt (Sorghum & Cowpea)
  {
    provenanceClassification: 'DEMONSTRATION',
    geometrySourceNotice: 'Digitized regional macro-belt approximation (WGS84). Illustrative agro-ecological boundary, NOT an official property cadastral survey.',
    id: 'ng-sorghum-kano',
    name: 'Kano-Kaduna Grain & Legume Basin',
    cropId: 'sorghum',
    cropName: 'Grain Sorghum & Cowpea',
    scientificName: 'Sorghum bicolor',
    category: 'Cereal',
    countryCode: 'NG',
    countryName: 'Nigeria',
    polygon: [
      [10.8, 7.3],
      [12.1, 7.5],
      [12.2, 8.8],
      [10.9, 8.6],
      [10.8, 7.3]
    ],
    fillColor: '#E67E22',
    borderColor: '#CA6F1E',
    areaHa: '5,600,000 ha',
    avgYield: '1.32 t/ha',
    season: 'Wet Season (May-Oct)',
    soil: 'Acrisols & Sandy Loams',
    ndvi: '0.55 (Seasonal flush)',
    description: 'Sudanian savanna cereal-legume intercropping zone producing sorghum, millet, and groundnuts.'
  },
  // 8. Ghana - Ashanti & Western Cocoa Belt
  {
    provenanceClassification: 'DEMONSTRATION',
    geometrySourceNotice: 'Digitized regional macro-belt approximation (WGS84). Illustrative agro-ecological boundary, NOT an official property cadastral survey.',
    id: 'gh-cocoa-ashanti',
    name: 'Ashanti & Western Evergreen Cocoa Belt',
    cropId: 'cocoa',
    cropName: 'Cocoa Beans (Theobroma cacao)',
    scientificName: 'Theobroma cacao',
    category: 'Cash Crop',
    countryCode: 'GH',
    countryName: 'Ghana',
    polygon: [
      [5.80, -2.40],
      [6.95, -2.25],
      [7.10, -1.30],
      [6.10, -1.20],
      [5.80, -2.40]
    ],
    fillColor: '#795548',
    borderColor: '#5D4037',
    areaHa: '1,820,000 ha',
    avgYield: '0.38 t/ha',
    season: 'Main crop Sept-Jan',
    soil: 'Forest Ochrosols',
    ndvi: '0.78 (Evergreen Tree Canopy)',
    description: 'Ghanaian national cocoa heartland managed by COCOBOD registered smallholder cooperatives.'
  },
  // 9. South Africa - Free State Maize Triangle
  {
    provenanceClassification: 'DEMONSTRATION',
    geometrySourceNotice: 'Digitized regional macro-belt approximation (WGS84). Illustrative agro-ecological boundary, NOT an official property cadastral survey.',
    id: 'za-maize-triangle',
    name: 'Free State Maize Triangle',
    cropId: 'maize',
    cropName: 'Commercial White & Yellow Maize',
    scientificName: 'Zea mays',
    category: 'Cereal',
    countryCode: 'ZA',
    countryName: 'South Africa',
    polygon: [
      [-28.5, 25.8],
      [-26.8, 26.2],
      [-26.9, 28.5],
      [-28.6, 28.1],
      [-28.5, 25.8]
    ],
    fillColor: '#F4D03F',
    borderColor: '#D4AC0D',
    areaHa: '2,600,000 ha',
    avgYield: '5.85 t/ha',
    season: 'Summer (Nov-May)',
    soil: 'Plinthic & Mispah Loams',
    ndvi: '0.70 (Center-pivot & dryland)',
    description: 'High-tech commercial agricultural basin supplying 60% of South Africa’s maize exports.'
  },
  // 10. South Africa - Western Cape Mediterranean Fruit & Wheat
  {
    provenanceClassification: 'DEMONSTRATION',
    geometrySourceNotice: 'Digitized regional macro-belt approximation (WGS84). Illustrative agro-ecological boundary, NOT an official property cadastral survey.',
    id: 'za-wheat-cape',
    name: 'Western Cape Mediterranean Wheat & Vine Belt',
    cropId: 'wheat',
    cropName: 'Winter Wheat & Table Grapes',
    scientificName: 'Triticum aestivum',
    category: 'Cereal',
    countryCode: 'ZA',
    countryName: 'South Africa',
    polygon: [
      [-34.2, 18.5],
      [-32.8, 18.6],
      [-33.2, 19.8],
      [-34.4, 19.5],
      [-34.2, 18.5]
    ],
    fillColor: '#E67E22',
    borderColor: '#D35400',
    areaHa: '540,000 ha',
    avgYield: '3.62 t/ha',
    season: 'Winter Rainfall (May-Nov)',
    soil: 'Sandy Glenrosa & Lithosols',
    ndvi: '0.62 (Winter flush)',
    description: 'Winter-rainfall agricultural region known for durum wheat, malt barley, and export vineyards.'
  }
];
