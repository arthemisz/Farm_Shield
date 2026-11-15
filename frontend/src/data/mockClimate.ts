import { ClimateIntelligence, MonthlyClimatePoint } from '../types';

export const generateClimateDataForFarm = (farmId: string, year: number = 2025): ClimateIntelligence => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const baseRainfall = [12, 34, 58, 65, 78, 145, 260, 280, 150, 32, 10, 8];

  const monthlyData: MonthlyClimatePoint[] = months.map((month, idx) => {
    const rainfall = Math.round(baseRainfall[idx] * (0.85 + ((idx * 7) % 30) / 100));
    const tempVar = Math.sin((idx / 12) * Math.PI * 2) * 2;
    const tempMean = Number((19.0 + tempVar).toFixed(1));
    const tempMin = Number((tempMean - 5.0).toFixed(1));
    const tempMax = Number((tempMean + 6.0).toFixed(1));

    return {
      month,
      rainfallMm: rainfall,
      tempMeanC: tempMean,
      tempMinC: tempMin,
      tempMaxC: tempMax,
      solarRadiationKwh: Number((4.8 + ((idx % 4) * 0.4)).toFixed(2)),
      humidityPct: rainfall > 100 ? 78 : rainfall > 50 ? 62 : 45,
    };
  });

  const annualRainfall = monthlyData.reduce((acc, curr) => acc + curr.rainfallMm, 0);
  const avgTemp = Number((monthlyData.reduce((acc, curr) => acc + curr.tempMeanC, 0) / 12).toFixed(1));
  const minTemp = Math.min(...monthlyData.map(m => m.tempMinC));
  const maxTemp = Math.max(...monthlyData.map(m => m.tempMaxC));

  const historicalTrends = [
    { year: year - 4, annualRainfallMm: Math.round(annualRainfall * 0.92), avgTempC: Number((avgTemp - 0.4).toFixed(1)) },
    { year: year - 3, annualRainfallMm: Math.round(annualRainfall * 1.08), avgTempC: Number((avgTemp - 0.1).toFixed(1)) },
    { year: year - 2, annualRainfallMm: Math.round(annualRainfall * 0.88), avgTempC: Number((avgTemp + 0.3).toFixed(1)) },
    { year: year - 1, annualRainfallMm: Math.round(annualRainfall * 1.02), avgTempC: Number((avgTemp + 0.1).toFixed(1)) },
    { year, annualRainfallMm: annualRainfall, avgTempC: avgTemp },
  ];

  return {
    farmId,
    countryCode: 'ET',
    year,
    provenance: {
      provider: 'NASA POWER Agroclimatology',
      source: 'NASA Goddard / Langley Simulation',
      retrievalDate: new Date().toISOString().split('T')[0],
      timePeriod: `${year} Model Run`,
      spatialResolution: '0.5° x 0.5° (~50km)',
      measurementType: 'satellite_model',
      limitations: 'Interpolated demonstration grid.',
      isDemoData: true,
    },
    summary: {
      annualRainfallMm: annualRainfall,
      avgTempC: avgTemp,
      minTempC: minTemp,
      maxTempC: maxTemp,
      rainyDaysEstimated: Math.round(annualRainfall / 11),
      droughtRiskScore: annualRainfall < 700 ? 'High' : annualRainfall < 950 ? 'Moderate' : 'Low',
    },
    monthlyData,
    historicalTrends,
  };
};
