import { SoilType } from '../types';

export interface SoilTypeDoc {
  id: string;
  name: SoilType;
  shortName: string;
  localNameAmharic?: string;
  colorCode: string;
  description: string;
  farmerCharacteristics: string;
  texture: string;
  drainage: string;
  phRange: { min: number; max: number };
  waterHoldingCapacity: string;
  workability: string;
  recommendedCrops: string[];
  cropsToAvoidOrDrain: string[];
  managementTips: string[];
}

export const SOIL_TYPE_DOCUMENTATION: SoilTypeDoc[] = [
  {
    id: 'vertisols',
    name: 'Vertisols (Black clay)',
    shortName: 'Vertisols',
    localNameAmharic: 'የጥቁር አፈር (Koticha)',
    colorCode: '#2C3E50',
    description: 'Heavy, dark clay soils containing high proportions of expanding smectite/montmorillonite minerals. They expand dramatically when wet and crack open deeply when dry.',
    farmerCharacteristics: 'Sticky and unworkable when wet; deeply cracked into wide blocks when dry; holds water for weeks.',
    texture: 'Heavy Clay (>45% clay fraction)',
    drainage: 'Poor to imperfectly drained; high waterlogging risk during heavy rains',
    phRange: { min: 6.5, max: 8.2 },
    waterHoldingCapacity: 'Very High',
    workability: 'Difficult — narrow moisture window for plowing',
    recommendedCrops: [
      'Teff',
      'Bread Wheat',
      'Faba Bean',
      'Chickpea',
      'Sorghum',
      'Rice',
      'Barley',
      'Sunflower',
      'Sesame'
    ],
    cropsToAvoidOrDrain: ['Groundnut (pegging blocked by dense clay)', 'Root & Tuber crops without drainage ridges'],
    managementTips: [
      'Use Broadbed and Furrow (BBM) systems to drain surface water during peak rainfall.',
      'Sow chickpea or grass pea late in the season to utilize residual deep moisture.',
      'Incorporate organic manure or crop residues to improve soil tilth and ease plowing.'
    ]
  },
  {
    id: 'nitisols',
    name: 'Nitisols (Red basaltic)',
    shortName: 'Nitisols',
    localNameAmharic: 'የቀይ አፈር (Biyyee Diimaa)',
    colorCode: '#A93226',
    description: 'Deep, well-drained, reddish-brown tropical soils derived from weathered volcanic basalt. Known for excellent stable aggregate structure and high agricultural productivity.',
    farmerCharacteristics: 'Deep rich red soil; crumbles into fine nutty crumbs; easy to dig; absorbs heavy rain without waterlogging.',
    texture: 'Clay to Clay Loam with crumbly nutty (nitic) structure',
    drainage: 'Well-drained to excessive internal drainage',
    phRange: { min: 5.2, max: 6.5 },
    waterHoldingCapacity: 'High',
    workability: 'Excellent — workable over a wide moisture range',
    recommendedCrops: [
      'Teff',
      'Bread Wheat',
      'Maize',
      'Faba Bean',
      'Common Bean',
      'Coffee (Arabica / Robusta)',
      'Cooking & Dessert Banana'
    ],
    cropsToAvoidOrDrain: ['Crops sensitive to moderate acidity without soil amendment'],
    managementTips: [
      'Apply agricultural lime (CaCO3) if pH drops below 5.5 to mitigate aluminium toxicity.',
      'Apply phosphorus fertilizer (DAP/NPS) because red soils tend to fix and lock phosphate.',
      'Practice contour tillage and planting grass strips on slopes to stop topsoil erosion.'
    ]
  },
  {
    id: 'cambisols',
    name: 'Cambisols (Brown loamy)',
    shortName: 'Cambisols',
    localNameAmharic: 'ቡናማ ለም አፈር (Biyyee Buraa)',
    colorCode: '#7D6608',
    description: 'Moderately developed brown loamy soils with good natural mineral fertility. Widely distributed across mixed highland and mid-altitude agricultural zones.',
    farmerCharacteristics: 'Medium brown fertile soil; good balance of sand, silt, and clay; easy to cultivate and highly versatile.',
    texture: 'Loam, Sandy Loam, or Silt Loam',
    drainage: 'Well-drained to moderately well-drained',
    phRange: { min: 6.0, max: 7.5 },
    waterHoldingCapacity: 'Moderate to High',
    workability: 'Very Good — easily tilled by ox-plow or tractor',
    recommendedCrops: [
      'Teff',
      'Bread Wheat',
      'Maize',
      'Faba Bean',
      'Barley',
      'Chickpea',
      'Common Bean',
      'Sorghum',
      'Pearl Millet',
      'Cowpea',
      'Groundnut',
      'Soybean',
      'Sweet Potato',
      'Sunflower'
    ],
    cropsToAvoidOrDrain: ['None — highly versatile under balanced management'],
    managementTips: [
      'Maintain organic matter via compost and cover crops to prevent soil compaction.',
      'Rotate cereals with legumes like faba bean or soybean to sustain soil nitrogen.',
      'Apply balanced N-P-S fertilizer to support intensive multi-cropping.'
    ]
  },
  {
    id: 'luvisols',
    name: 'Luvisols',
    shortName: 'Luvisols',
    localNameAmharic: 'የደለል ሸክላ አፈር',
    colorCode: '#935116',
    description: 'Soils characterized by distinct clay accumulation in the subsoil (argic horizon) with high base saturation and fertility.',
    farmerCharacteristics: 'Lighter loamy topsoil over denser subsoil clay layer; fertile and responsive to fertilizers.',
    texture: 'Sandy Loam topsoil over Clay subsoil',
    drainage: 'Moderately well-drained; subsoil may impede rapid drainage',
    phRange: { min: 6.0, max: 7.2 },
    waterHoldingCapacity: 'High in subsoil, moderate in topsoil',
    workability: 'Good in topsoil; avoid subsoil compaction',
    recommendedCrops: [
      'Bread Wheat',
      'Maize',
      'Sorghum',
      'Barley',
      'Soybean',
      'Cowpea',
      'Groundnut',
      'White Yam / Water Yam',
      'Plantain'
    ],
    cropsToAvoidOrDrain: ['Deep taproot crops if subsoil clay pan is overly compact'],
    managementTips: [
      'Deep ripping or subsoiling can alleviate hard subsoil layers.',
      'Plant deep-rooting pigeon peas or sunflower to naturally open dense subsoils.'
    ]
  },
  {
    id: 'fluvisols',
    name: 'Fluvisols (Alluvial)',
    shortName: 'Fluvisols',
    localNameAmharic: 'የወንዝ ደለል አፈር (Biyyee Lagaa)',
    colorCode: '#117864',
    description: 'Young soils formed from recurring river flood deposits and alluvial sediment. Rich in nutrients and replenished regularly by river waters.',
    farmerCharacteristics: 'Soft riverbank or valley floor soil; layered silt and fine sand; moist near water courses.',
    texture: 'Stratified Silt Loam, Alluvial Sand, or River Clay',
    drainage: 'Variable — imperfect near rivers, well-drained on river terraces',
    phRange: { min: 6.2, max: 7.8 },
    waterHoldingCapacity: 'Very High',
    workability: 'Easy to plow and bed',
    recommendedCrops: [
      'Rice',
      'Plantain',
      'Sugarcane',
      'Cotton',
      'Maize',
      'Vegetables (Tomato, Onion, Cabbage)'
    ],
    cropsToAvoidOrDrain: ['Drought-adapted cereals during rainy season flood periods'],
    managementTips: [
      'Construct bunds or drainage channels to protect crops from uncontrolled river flooding.',
      'Capitalize on gravity irrigation and residual moisture for off-season vegetable production.'
    ]
  },
  {
    id: 'arenosols',
    name: 'Arenosols (Sandy)',
    shortName: 'Arenosols',
    localNameAmharic: 'የአሸዋማ አፈር (Biyyee Cirracha)',
    colorCode: '#D4AC0D',
    description: 'Deep, coarse sandy soils with low clay content, high porosity, and very rapid percolation. Common in arid, semi-arid, and coastal zones.',
    farmerCharacteristics: 'Gritty, loose sand; water sinks through immediately; requires frequent light rain; easy to dig.',
    texture: 'Sand to Loamy Sand (>70% sand fraction)',
    drainage: 'Excessively drained; very low runoff',
    phRange: { min: 5.5, max: 7.2 },
    waterHoldingCapacity: 'Very Low (holds little residual moisture)',
    workability: 'Extremely easy — loose and uncompacted',
    recommendedCrops: [
      'Pearl Millet',
      'Sorghum',
      'Groundnut',
      'Cowpea',
      'Cassava',
      'Sweet Potato',
      'Sesame'
    ],
    cropsToAvoidOrDrain: ['Wheat, Teff, Rice (require much higher water retention)'],
    managementTips: [
      'Apply organic compost or animal manure to improve moisture retention.',
      'Split fertilizer applications into multiple small doses to avoid nitrogen leaching.',
      'Intercrop pearl millet with cowpea to protect loose sand from wind erosion.'
    ]
  },
  {
    id: 'ferralsols',
    name: 'Ferralsols (Tropical red)',
    shortName: 'Ferralsols',
    localNameAmharic: 'የሐሩር ቀይ አፈር',
    colorCode: '#C0392B',
    description: 'Deep, strongly weathered, reddish or yellowish tropical soils rich in iron and aluminium oxides, typical of humid tropical regions.',
    farmerCharacteristics: 'Deep yellow-red porous soil; never sticky; water drains fast; needs fertilizer support for high yield.',
    texture: 'Friable Sandy Clay to Clay with low plasticity',
    drainage: 'Rapid internal drainage; highly permeable',
    phRange: { min: 4.5, max: 5.8 },
    waterHoldingCapacity: 'Moderate',
    workability: 'Very Good — friable even when wet',
    recommendedCrops: [
      'Cassava',
      'Maize',
      'Soybean',
      'Common Bean',
      'Sweet Potato',
      'White Yam / Water Yam',
      'Cooking & Dessert Banana',
      'Plantain',
      'Cocoa',
      'Coffee (Arabica / Robusta)'
    ],
    cropsToAvoidOrDrain: ['Crops requiring alkaline or high-calcium soils'],
    managementTips: [
      'Apply ground limestone or dolomitic lime to neutralize acidic pH.',
      'Maintain continuous mulch cover to protect organic matter from intense tropical heat.'
    ]
  },
  {
    id: 'acrisols',
    name: 'Acrisols',
    shortName: 'Acrisols',
    localNameAmharic: 'አሲዳማ ሸክላ አፈር',
    colorCode: '#884EA0',
    description: 'Acidic, deeply weathered tropical soils with a clay-enriched subsoil and low base saturation. Common in humid and sub-humid hilly terrain.',
    farmerCharacteristics: 'Pale or yellowish-red topsoil with firm clay underneath; easily eroded if cleared of trees.',
    texture: 'Loamy sand over acidic clay subsoil',
    drainage: 'Moderately well-drained',
    phRange: { min: 4.2, max: 5.5 },
    waterHoldingCapacity: 'Moderate',
    workability: 'Moderate to delicate — susceptible to surface sealing',
    recommendedCrops: [
      'Cassava',
      'White Yam / Water Yam',
      'Plantain',
      'Cocoa',
      'Sweet Potato',
      'Pineapple'
    ],
    cropsToAvoidOrDrain: ['High-input cereals without heavy liming'],
    managementTips: [
      'Incorporate agroforestry and tree cover to maintain soil organic layer.',
      'Use acid-tolerant crop varieties (cassava, yam, tea, rubber).'
    ]
  },
  {
    id: 'leptosols',
    name: 'Leptosols',
    shortName: 'Leptosols',
    localNameAmharic: 'የጠጠር እና ኮረብታ አፈር (Biyyee Cabbii)',
    colorCode: '#7F8C8D',
    description: 'Very shallow soils over continuous hard rock, extremely gravelly or stony, typical of steep slopes, escarpments, and eroded highlands.',
    farmerCharacteristics: 'Very thin soil full of rocks and stones; bedrock close to surface; hard to plow.',
    texture: 'Stony, gravelly loam or sandy skeleton',
    drainage: 'Excessive to rapid runoff; dry quickly',
    phRange: { min: 6.0, max: 7.8 },
    waterHoldingCapacity: 'Very Low (shallow root depth restricts moisture storage)',
    workability: 'Poor — stones damage plows; shallow bedrock prevents deep tillage',
    recommendedCrops: [
      'Barley (hardy high-altitude landraces)',
      'Teff (shallow rooting)',
      'Grazing Pasture / Forage Grasses',
      'Acacia / Agroforestry trees'
    ],
    cropsToAvoidOrDrain: ['Deep taproot legumes, Maize, Root & Tuber crops'],
    managementTips: [
      'Build stone bunds and soil terraces to catch runoff sediment.',
      'Prioritize perennial fodder bushes and rotational livestock grazing over intensive tillage.'
    ]
  }
];

export const getSoilDocByType = (soilType: SoilType | string): SoilTypeDoc | undefined => {
  return SOIL_TYPE_DOCUMENTATION.find(
    (s) => s.name.toLowerCase() === soilType.toLowerCase() ||
           soilType.toLowerCase().includes(s.shortName.toLowerCase()) ||
           s.id.toLowerCase() === soilType.toLowerCase()
  );
};
