import { Farm, RotationEvaluation } from '../types';

export const evaluateRotationSequence = (
  farm: Farm,
  currentCrop: string,
  proposedCrops: string[]
): RotationEvaluation => {
  const nextCrop = proposedCrops[0] || 'Faba Bean';
  const isPulseFollowUp = (currentCrop.includes('Wheat') || currentCrop.includes('Teff') || currentCrop.includes('Maize')) &&
    nextCrop.includes('Faba Bean');
  const isCerealMonoculture = (currentCrop.includes('Wheat') && nextCrop.includes('Wheat')) ||
    (currentCrop.includes('Teff') && nextCrop.includes('Teff')) ||
    (currentCrop.includes('Maize') && nextCrop.includes('Maize'));
  const isCerealToCerealShift = !isPulseFollowUp && !isCerealMonoculture;

  let climateScore = 82;
  let soilScore = 80;
  let waterScore = 78;
  let diversityScore = 70;
  let nitrogenScore = 65;
  let summary = '';
  let assessment: RotationEvaluation['overallAssessment'] = 'Recommended';

  const positiveHighlights: string[] = [];
  const potentialRisks: string[] = [];
  const missingInformationNotes: string[] = [
    'Sub-seasonal micro-climate frost probabilities for high elevations pending field validation.',
    'Pest pressure history (e.g., chocolate spot in faba beans, rust in wheat) not included in current model run.',
  ];

  if (isPulseFollowUp) {
    climateScore = 88;
    soilScore = 92;
    waterScore = 85;
    diversityScore = 94;
    nitrogenScore = 96;
    assessment = 'Highly Recommended';
    summary = `Rotating from ${currentCrop} to ${nextCrop} introduces essential biological diversity, breaks cereal-specific fungal pathogen cycles (e.g. rusts and take-all), and rejuvenates soil nitrogen pools.`;
    positiveHighlights.push(
      'Biological nitrogen fixation adds up to 60-90 kg residual N/ha for subsequent cereal crops.',
      'Taproot system penetrates subsoil layers, opening drainage macropores in heavy soils.',
      'Interrupts cereal-borne weed dynamics and foliar fungal spores.'
    );
    potentialRisks.push(
      'Faba bean is susceptible to Chocolate Spot (Botrytis fabae) during exceptionally high humidity spells in August.',
      'Requires adequate drainage on vertisols during the peak rainy period.'
    );
  } else if (isCerealMonoculture) {
    climateScore = 65;
    soilScore = 48;
    waterScore = 60;
    diversityScore = 25;
    nitrogenScore = 30;
    assessment = 'Not Advised';
    summary = `Repeated cultivation of ${currentCrop} consecutive seasons leads to soil nutrient depletion, increases specialized weed seeds (e.g. wild oats), and intensifies pest pressure.`;
    positiveHighlights.push(
      'Familiarity with agronomic management practices and existing equipment.'
    );
    potentialRisks.push(
      'Continuous depletion of root-zone macronutrients (N & P) requiring heavier synthetic inputs.',
      'Accelerated buildup of soil-borne pathogens and specific nematodes.',
      'Degradation of soil microbial diversity and structure.'
    );
  } else {
    // Cereal to cereal shift (e.g. Maize to Teff, Wheat to Teff)
    climateScore = 75;
    soilScore = 72;
    waterScore = 74;
    diversityScore = 68;
    nitrogenScore = 55;
    assessment = 'Conditional / Moderate Risk';
    summary = `Transitioning between ${currentCrop} and ${nextCrop} offers moderate root-zone variation, but both crops remain net nitrogen extractors without a pulse legume break.`;
    positiveHighlights.push(
      'Varying rooting depths and seasonal moisture extraction profiles.',
      'Flexible planting and harvesting windows relative to primary rainfall peaks.'
    );
    potentialRisks.push(
      'Both crops extract substantial soil nitrogen without biological replenishment.',
      'Moderate risk of carry-over cereal root-rot organisms.'
    );
  }

  // Calculate weighted overall score
  // Weights: Climate 30%, Soil 25%, Water 20%, Diversity 15%, Nitrogen 10%
  const overallScore = Math.round(
    climateScore * 0.30 +
    soilScore * 0.25 +
    waterScore * 0.20 +
    diversityScore * 0.15 +
    nitrogenScore * 0.10
  );

  return {
    id: `eval-${Date.now()}`,
    farmId: farm.id,
    currentCrop,
    proposedSequence: proposedCrops,
    overallScore,
    overallAssessment: assessment,
    summaryExplanation: summary,
    factors: {
      climateSuitability: {
        name: 'Climate Suitability',
        weightPct: 30,
        score: climateScore,
        explanation: `Evaluated against temperature tolerance, thermal growing degree units, and seasonal rainfall alignment in ${farm.region}.`,
        positiveFactors: ['Growing season matches seasonal rainfall distribution.'],
        potentialRisks: ['Irregular onset of rains could shift sowing dates.'],
      },
      soilSuitability: {
        name: 'Soil Suitability',
        weightPct: 25,
        score: soilScore,
        explanation: `Analyzed against farm soil type (${farm.soilType}) and root penetration capacity.`,
        positiveFactors: ['Favorable root aeration characteristics.'],
        potentialRisks: ['Potential moisture stagnation during high-rainfall months.'],
      },
      waterRequirements: {
        name: 'Water Requirements',
        weightPct: 20,
        score: waterScore,
        explanation: `Comparison of crop evapotranspiration needs with historical rainfall (${farm.waterAvailability} context).`,
        positiveFactors: ['Water requirements are aligned with seasonal peak precipitation.'],
        potentialRisks: ['Terminal drought vulnerability if rains cease early.'],
      },
      cropDiversity: {
        name: 'Crop Diversity',
        weightPct: 15,
        score: diversityScore,
        explanation: 'Assesses rotation distance across botanical families and root morphological types.',
        positiveFactors: ['Diversification helps disrupt specialized pest lifecycles.'],
        potentialRisks: ['Marketing channel adjustments needed for secondary crop.'],
      },
      nitrogenFixation: {
        name: 'Nitrogen Fixation',
        weightPct: 10,
        score: nitrogenScore,
        explanation: 'Evaluates biological nitrogen contribution and legume residual fertility benefits.',
        positiveFactors: isPulseFollowUp ? ['Active Rhizobium symbiotic fixation.'] : ['Limited or neutral N contribution.'],
        potentialRisks: isPulseFollowUp ? [] : ['Requires synthetic or organic N input replenishment.'],
      },
    },
    positiveHighlights,
    potentialRisks,
    missingInformationNotes,
    countryCode: farm.countryCode || 'ET',
    provenance: {
      provider: 'FarmShield Demonstration Algorithm',
      source: 'NASA Agroclimatology & SoilGrids (Simulated)',
      retrievalDate: new Date().toISOString().split('T')[0],
      timePeriod: '2010–2024 historical reference',
      spatialResolution: 'Farm-level heuristic',
      measurementType: 'demonstration_simulation',
      limitations: 'Scores are mathematical heuristics for the NASA Space Apps Challenge prototype. Not validated against field trials.',
      isDemoData: true,
    },
    disclaimer:
      'DISCLAIMER: Recommendations are generated based on mathematical heuristics and demonstration datasets for the NASA Space Apps Challenge prototype. They do NOT constitute an absolute guarantee of harvest yield. Always consult local agricultural extension officers (DA) and site-specific soil tests.',
  };
};

