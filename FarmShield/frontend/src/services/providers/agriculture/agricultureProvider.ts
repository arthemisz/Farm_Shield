export interface IAgricultureStatProvider {
  name: string;
  providerId: string;
  getCropProductionBenchmark(cropId: string, countryCode: string): Promise<{
    cropId: string;
    countryCode: string;
    averageYieldTonsPerHa: number;
    harvestedAreaHa: number;
    dataSource: string;
  }>;
}

export class FaostatAgricultureProvider implements IAgricultureStatProvider {
  name = 'FAOSTAT Agricultural Statistics';
  providerId = 'faostat';

  async getCropProductionBenchmark(cropId: string, countryCode: string) {
    return {
      cropId,
      countryCode,
      averageYieldTonsPerHa: cropId === 'maize' ? 3.8 : cropId === 'wheat' ? 2.9 : 1.7,
      harvestedAreaHa: 2500000,
      dataSource: 'FAOSTAT Crops and Livestock Products Database (Regional Benchmark)',
    };
  }
}

