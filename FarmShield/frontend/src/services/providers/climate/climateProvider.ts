import { ClimateIntelligence, MonthlyClimatePoint } from '../../../types';

export interface ClimateProviderRequest {
  latitude: number;
  longitude: number;
  year?: number;
  countryCode?: string;
}

export interface IClimateProvider {
  name: string;
  providerId: string;
  getMonthlyClimate(req: ClimateProviderRequest): Promise<ClimateIntelligence>;
}

/**
 * Standard NASA POWER Agroclimatology Simulation Provider
 * Simulates standard daily-aggregated NASA POWER agroclimate parameters
 * (T2M, T2M_MIN, T2M_MAX, PRECTOTCORR, ALLSKY_SFC_SW_DWN)
 */
export class NasaPowerClimateProvider implements IClimateProvider {
  name = 'NASA POWER Agroclimatology';
  providerId = 'nasa-power';

  async getMonthlyClimate(req: ClimateProviderRequest): Promise<ClimateIntelligence> {
    const year = req.year || 2025;
    const isHighland = req.latitude > 7.5 && req.latitude < 10.0;
    const baseTempMean = isHighland ? 17.5 : 21.0;
    const rainMultiplier = req.latitude > 8.0 ? 1.15 : 1.0;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseRainfall = [12, 34, 58, 65, 78, 145, 260, 280, 150, 32, 10, 8];

    const monthlyData: MonthlyClimatePoint[] = months.map((month, idx) => {
      const rainfall = Math.round(baseRainfall[idx] * rainMultiplier * (0.85 + ((idx * 7) % 30) / 100));
      const tempVar = Math.sin((idx / 12) * Math.PI * 2) * 2;
      const tempMean = Number((baseTempMean + tempVar).toFixed(1));
      const tempMin = Number((tempMean - 5.5).toFixed(1));
      const tempMax = Number((tempMean + 6.5).toFixed(1));

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
      farmId: `coords-${req.latitude.toFixed(2)}-${req.longitude.toFixed(2)}`,
      countryCode: req.countryCode || 'ET',
      year,
      provenance: {
        provider: 'NASA POWER Agroclimatology API',
        source: 'NASA Langley Research Center (LaRC) / GSFC',
        retrievalDate: new Date().toISOString().split('T')[0],
        timePeriod: `${year} Annual Cycle (30-yr Climatology Baseline)`,
        spatialResolution: '0.5° x 0.5° latitude/longitude grid (~50km)',
        measurementType: 'satellite_model',
        limitations:
          'Satellite-derived solar & precipitation estimates interpolated over 0.5-degree cells. Micro-climate topography variations may not replace on-farm rain gauges.',
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
  }
}

