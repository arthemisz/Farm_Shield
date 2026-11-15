import { Farm, RotationEvaluation } from '../../types';
import { getRecommendationProfile, RecommendationWeights } from './recommendationProfiles';

/**
 * Country-Independent Crop Rotation Decision-Support Recommendation Engine
 */
export class RecommendationEngine {
  static evaluateRotation(
    farm: Farm,
    currentCrop: string,
    proposedCrops: string[],
    customWeights?: Partial<RecommendationWeights>
  ): RotationEvaluation {
    const profile = getRecommendationProfile(farm.countryCode || 'ET');
    const weights: RecommendationWeights = {
      ...profile.defaultWeights,
      ...customWeights,
    };

    const nextCrop = proposedCrops[0] || 'Faba Bean';
    const currLower = currentCrop.toLowerCase();
    const nextLower = nextCrop.toLowerCase();

    // Botanical family grouping
    const isCereal = (c: string) =>
      c.includes('wheat') || c.includes('teff') || c.includes('maize') || c.includes('barley') || c.includes('sorghum') || c.includes('millet') || c.includes('rice');
    const isLegume = (c: string) =>
      c.includes('faba') || c.includes('bean') || c.includes('chickpea') || c.includes('soybean') || c.includes('groundnut') || c.includes('cowpea') || c.includes('lentil');
    const isTuber = (c: string) =>
      c.includes('potato') || c.includes('yam') || c.includes('cassava');
    const isOilseed = (c: string) =>
      c.includes('sunflower') || c.includes('sesame');

    const currIsCereal = isCereal(currLower);
    const currIsLegume = isLegume(currLower);
    const nextIsCereal = isCereal(nextLower);
    const nextIsLegume = isLegume(nextLower);
    const nextIsTuber = isTuber(nextLower);
    const nextIsOilseed = isOilseed(nextLower);

    const isSameCrop = currLower === nextLower ||
      (currLower.includes('wheat') && nextLower.includes('wheat')) ||
      (currLower.includes('teff') && nextLower.includes('teff')) ||
      (currLower.includes('maize') && nextLower.includes('maize')) ||
      (currLower.includes('faba') && nextLower.includes('faba'));

    const isSameFamily = (currIsCereal && nextIsCereal) || (currIsLegume && nextIsLegume);

    let climateScore = 80;
    let soilScore = 78;
    let waterScore = 82;
    let diversityScore = 75;
    let nitrogenScore = 60;
    let summary = '';
    let assessment: RotationEvaluation['overallAssessment'] = 'Recommended';

    const positiveHighlights: string[] = [];
    const potentialRisks: string[] = [];
    const missingInformationNotes: string[] = [
      'Sub-seasonal micro-climate frost probabilities for high elevations pending field validation.',
      'Farm-level historical pathogen soil spore assay (e.g. Fusarium, Botrytis) not included in current model run.',
    ];

    if (isSameCrop) {
      // Continuous Monoculture
      climateScore = 65;
      soilScore = 48;
      waterScore = 60;
      diversityScore = 25;
      nitrogenScore = 30;
      assessment = 'Not Advised';
      summary = `Continuous monoculture repetition of ${currentCrop} intensifies root pest pressure, exhausts identical soil horizons, and degrades rhizosphere biology.`;
      positiveHighlights.push('Familiarity with agronomic management practices and harvest machinery.');
      potentialRisks.push(
        'Severe accumulation of host-specific root rot and foliar rust pathogens.',
        'Continuous depletion of specific micronutrient and macronutrient pools (N & P).',
        'Weed communities rapidly adapt to single-canopy crop competition.'
      );
    } else if (currIsCereal && nextIsLegume) {
      // Cereal -> Legume Break (Ideal rotation)
      climateScore = 88;
      soilScore = 90;
      waterScore = 86;
      diversityScore = 92;
      nitrogenScore = 94;
      assessment = 'Highly Recommended';
      summary = `Rotating from cereal ${currentCrop} to pulse legume ${nextCrop} introduces vital biological diversity, disrupts fungal pathogen cycles, and fixes atmospheric nitrogen.`;
      positiveHighlights.push(
        `Symbiotic Rhizobium fixation adds significant biological nitrogen reserves for subsequent crops.`,
        `Breaks cereal root rot (Fusarium, Gaeumannomyces) and foliar rust cycles.`,
        `Taproot architecture creates soil biopores, improving aeration in compact subsoils.`
      );
      potentialRisks.push(
        `Legumes may face fungal blights (Chocolate Spot/Ascochyta) under prolonged canopy humidity.`,
        `Requires well-drained beds if planted on swelling clay Vertisols during peak rains.`
      );
    } else if (currIsLegume && nextIsCereal) {
      // Legume -> Cereal (Utilizing fixed N)
      climateScore = 86;
      soilScore = 88;
      waterScore = 84;
      diversityScore = 88;
      nitrogenScore = 90;
      assessment = 'Highly Recommended';
      summary = `Planting cereal ${nextCrop} after legume ${currentCrop} leverages soil residual nitrogen and benefits from improved soil structure.`;
      positiveHighlights.push(
        `Cereal feeder roots rapidly assimilate residual organic nitrate left by legume nodules.`,
        `Diverse root architecture minimizes nutrient stratification in upper soil layers.`,
        `Lowers initial synthetic nitrogen fertilizer requirements by 30-40%.`
      );
      potentialRisks.push(
        `Ensure adequate starter phosphorus to stimulate early cereal seedling vigor.`
      );
    } else if (nextIsOilseed) {
      // Rotation to Oilseed (Sunflower / Sesame)
      climateScore = 84;
      soilScore = 85;
      waterScore = 80;
      diversityScore = 90;
      nitrogenScore = 52;
      assessment = 'Recommended';
      summary = `Introducing oilseed ${nextCrop} provides deep taproot exploration (down to 1.5m), scavenging subsoil nutrients that shallow cereals missed.`;
      positiveHighlights.push(
        `Deep penetrating taproot breaks plow pan and mobilizes leached subsoil nutrients.`,
        `Botanical family shift completely disrupts grass and legume weed spectrums.`
      );
      potentialRisks.push(
        `Sunflower is a heavy potassium and moisture extractor; balance post-harvest fertility.`,
        `Residual nitrogen contribution is neutral to negative.`
      );
    } else if (nextIsTuber) {
      // Rotation to Tuber (Sweet potato / Yam)
      const isVertisol = (farm.soilType || '').toLowerCase().includes('vertisol') || (farm.soilType || '').toLowerCase().includes('clay');
      climateScore = 80;
      soilScore = isVertisol ? 62 : 86;
      waterScore = 82;
      diversityScore = 88;
      nitrogenScore = 52;
      assessment = isVertisol ? 'Conditional / Moderate Risk' : 'Recommended';
      summary = `Rotating to tuber ${nextCrop} provides root zone restructuring, though tuber bulking requires careful soil physical condition management.`;
      positiveHighlights.push(
        `Broad canopy provides complete soil coverage, suppressing broadleaf weeds.`,
        `Diversifies farm enterprise and household nutrition.`
      );
      if (isVertisol) {
        potentialRisks.push(
          `Swelling and shrinking clay Vertisols can compress developing tubers and make mechanical harvest difficult.`
        );
      }
      potentialRisks.push(`Extracts moderate soil potash; does not fix atmospheric nitrogen.`);
    } else if (isSameFamily) {
      // Cereal to cereal shift (e.g. Wheat -> Teff, Maize -> Barley)
      climateScore = 78;
      soilScore = 75;
      waterScore = 80;
      diversityScore = 55;
      nitrogenScore = 52;
      assessment = 'Conditional / Moderate Risk';
      summary = `Transitioning between cereals (${currentCrop} → ${nextCrop}) provides modest canopy difference, but both share fibrous root morphology and extract soil nitrogen.`;
      positiveHighlights.push(
        `Different seasonal maturity windows and drought resilience profiles.`,
        `Compatible with existing cereal harvesting and storage infrastructure.`
      );
      potentialRisks.push(
        `Both crops extract substantial nitrogen and phosphorus without biological replenishment.`,
        `Moderate risk of carry-over cereal root rot and common aphid pest vectors.`
      );
    } else {
      // General cross-category rotation
      climateScore = 82;
      soilScore = 80;
      waterScore = 78;
      diversityScore = 85;
      nitrogenScore = 60;
      assessment = 'Recommended';
      summary = `Rotating from ${currentCrop} to ${nextCrop} offers positive family diversification and balanced moisture utilization across the seasonal cycle.`;
      positiveHighlights.push(
        `Botanical family shift reduces consecutive pest lifecycle pressure.`,
        `Varied rooting depths exploit different soil nutrient zones.`
      );
      potentialRisks.push(
        `Monitor soil moisture transition between harvest and succeeding planting dates.`
      );
    }

    // Weighted Overall Score based on configured profile
    const overallScore = Math.round(
      climateScore * (weights.climateWeightPct / 100) +
        soilScore * (weights.soilWeightPct / 100) +
        waterScore * (weights.waterWeightPct / 100) +
        diversityScore * (weights.diversityWeightPct / 100) +
        nitrogenScore * (weights.nitrogenWeightPct / 100)
    );

    return {
      id: `eval-${Date.now()}`,
      farmId: farm.id,
      countryCode: farm.countryCode || 'ET',
      currentCrop,
      proposedSequence: proposedCrops,
      overallScore,
      overallAssessment: assessment,
      summaryExplanation: summary,
      factors: {
        climateSuitability: {
          name: 'Climate Suitability',
          weightPct: weights.climateWeightPct,
          score: climateScore,
          explanation: `Evaluated against temperature tolerance, thermal growing degree units, and seasonal rainfall alignment in ${farm.adminLevel1 || farm.region}.`,
          positiveFactors: ['Growing season matches seasonal rainfall distribution.'],
          potentialRisks: ['Irregular onset of rains could shift sowing dates.'],
        },
        soilSuitability: {
          name: 'Soil Suitability',
          weightPct: weights.soilWeightPct,
          score: soilScore,
          explanation: `Analyzed against farm soil type (${farm.soilType}) and root penetration capacity.`,
          positiveFactors: ['Favorable root aeration characteristics.'],
          potentialRisks: ['Potential moisture stagnation during high-rainfall months.'],
        },
        waterRequirements: {
          name: 'Water Requirements',
          weightPct: weights.waterWeightPct,
          score: waterScore,
          explanation: `Comparison of crop evapotranspiration needs with historical rainfall (${farm.waterAvailability} context).`,
          positiveFactors: ['Water requirements are aligned with seasonal peak precipitation.'],
          potentialRisks: ['Terminal drought vulnerability if rains cease early.'],
        },
        cropDiversity: {
          name: 'Crop Diversity',
          weightPct: weights.diversityWeightPct,
          score: diversityScore,
          explanation: 'Assesses rotation distance across botanical families and root morphological types.',
          positiveFactors: ['Diversification helps disrupt specialized pest lifecycles.'],
          potentialRisks: ['Marketing channel adjustments needed for secondary crop.'],
        },
        nitrogenFixation: {
          name: 'Nitrogen Fixation',
          weightPct: weights.nitrogenWeightPct,
          score: nitrogenScore,
          explanation: 'Evaluates biological nitrogen contribution and legume residual fertility benefits.',
          positiveFactors: nextIsLegume
            ? ['Active Rhizobium symbiotic fixation.']
            : ['Limited or neutral N contribution.'],
          potentialRisks: nextIsLegume
            ? []
            : ['Requires synthetic or organic N input replenishment.'],
        },
      },
      positiveHighlights,
      potentialRisks,
      missingInformationNotes,
      provenance: {
        provider: 'FarmShield Recommendation Engine',
        source: `${profile.name} (${farm.country})`,
        retrievalDate: new Date().toISOString().split('T')[0],
        timePeriod: 'Simulated Season Model',
        spatialResolution: 'Field-level heuristic evaluation',
        measurementType: 'demonstration_simulation',
        limitations:
          'Decision algorithm uses calibrated multi-criteria weighting. Scores do not constitute yield guarantees.',
        isDemoData: true,
      },
      disclaimer:
        'DISCLAIMER: Recommendations are generated based on mathematical heuristics and demonstration datasets for the NASA Space Apps Challenge prototype. They do NOT constitute an absolute guarantee of harvest yield. Always consult local agricultural extension officers and site-specific soil tests.',
    };
  }
}

