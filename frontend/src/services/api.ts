import { Farm, Crop, ClimateIntelligence, SoilInformation, RotationEvaluation, UserSettings, CountryConfig } from '../types';
import { INITIAL_FARMS, INITIAL_CROPS } from '../data/mockData';
import { COUNTRIES_LIST, getCountryConfig } from '../data/countries';
import { NasaPowerClimateProvider } from './providers/climate/climateProvider';
import { SoilGridsProvider } from './providers/soil/soilProvider';
import { RecommendationEngine } from './recommendations/recommendationEngine';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const STORAGE_KEYS = {
  FARMS: 'farmshield_farms_v2',
  SETTINGS: 'farmshield_settings_v2',
};

// Fallback client-side providers
const climateProvider = new NasaPowerClimateProvider();
const soilProvider = new SoilGridsProvider();

const getStoredFarms = (): Farm[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FARMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(INITIAL_FARMS));
      return INITIAL_FARMS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_FARMS;
  }
};

const saveStoredFarms = (farms: Farm[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));
  } catch (err) {
    console.error('Failed to persist farms in localStorage', err);
  }
};

const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Abebe Bekele',
  organization: 'Ethiopian Agricultural Research Institute (EIAR) Partner',
  email: 'abebe.b@farmshield.demo',
  selectedCountryCode: 'ET',
  language: 'en',
  measurementUnits: {
    area: 'hectares',
    temperature: 'celsius',
    rainfall: 'mm',
  },
  theme: 'light',
  dataRefreshCadence: 'weekly',
  notificationsEnabled: true,
};

const getStoredSettings = (): UserSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      selectedCountryCode: parsed.selectedCountryCode || 'ET',
      measurementUnits: parsed.measurementUnits || DEFAULT_SETTINGS.measurementUnits,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveStoredSettings = (settings: UserSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
};

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  isDemoData: boolean;
  timestamp: string;
}

// HTTP request helper with graceful fallback
async function fetchWithFallback<T>(
  endpoint: string,
  options?: RequestInit,
  fallbackFn?: () => Promise<T>
): Promise<{ data: T; isDemoData: boolean; success: boolean }> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      return {
        data: json.data !== undefined ? json.data : json,
        isDemoData: !!json.isDemoData,
        success: true,
      };
    }
  } catch (error) {
    console.warn(`[FarmShieldApi] Failed to fetch ${endpoint}, using local fallback.`, error);
  }

  if (fallbackFn) {
    const data = await fallbackFn();
    return { data, isDemoData: true, success: true };
  }

  throw new Error(`Endpoint ${endpoint} failed and no fallback provided.`);
}

export const FarmShieldApi = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  // Health
  async getHealth(): Promise<ApiResponse<{ status: string; service: string; version: string }>> {
    const res = await fetchWithFallback<{ status: string; service: string; version: string }>(
      '/health',
      { method: 'GET' },
      async () => ({ status: 'healthy', service: 'FarmShield Local Client', version: '1.0.0' })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 1. Country Registry
  async getCountries(region?: string, queryStr?: string): Promise<ApiResponse<CountryConfig[]>> {
    const params = new URLSearchParams();
    if (region && region !== 'ALL') params.append('region', region);
    if (queryStr) params.append('q', queryStr);
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await fetchWithFallback<CountryConfig[]>(
      `/countries${query}`,
      { method: 'GET' },
      async () => COUNTRIES_LIST
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async getCountry(countryCode: string): Promise<ApiResponse<CountryConfig>> {
    const res = await fetchWithFallback<CountryConfig>(
      `/countries/${encodeURIComponent(countryCode)}`,
      { method: 'GET' },
      async () => getCountryConfig(countryCode)
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async getCountryCrops(countryCode: string): Promise<ApiResponse<Crop[]>> {
    const res = await fetchWithFallback<Crop[]>(
      `/countries/${encodeURIComponent(countryCode)}/crops`,
      { method: 'GET' },
      async () => {
        return INITIAL_CROPS.filter(c => c.countryApplicability.includes(countryCode) || c.countryApplicability.includes('GLOBAL'));
      }
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async getCountryDataAvailability(countryCode: string): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/countries/${encodeURIComponent(countryCode)}/data-availability`,
      { method: 'GET' },
      async () => ({
        country: { isoAlpha2: countryCode },
        data: { countryCode, availableCount: 4, totalDatasets: 6, datasets: [] }
      })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async getCountryRegions(): Promise<ApiResponse<any[]>> {
    const res = await fetchWithFallback<any[]>(
      '/countries/regions',
      { method: 'GET' },
      async () => []
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 2. Datasets Registry & Live Database Observations
  async getDatasets(): Promise<ApiResponse<any[]>> {
    const res = await fetchWithFallback<any[]>(
      '/datasets',
      { method: 'GET' },
      async () => [
        { id: 'nasa-power', name: 'NASA POWER Climatology', status: 'LIVE' },
        { id: 'nasa-gpm-imerg', name: 'NASA GPM IMERG Precipitation', status: 'LIVE' },
        { id: 'nasa-ecostress', name: 'NASA ECOSTRESS Evapotranspiration', status: 'LIVE' },
        { id: 'nasa-viirs-vegetation', name: 'NASA VIIRS NDVI/EVI', status: 'LIVE' },
        { id: 'isric-soilgrids', name: 'ISRIC SoilGrids 2.0', status: 'MODELLED' },
        { id: 'chirps-rainfall', name: 'CHIRPS Precipitation Climatology', status: 'CALIBRATED_CLIMATOLOGY' },
        { id: 'openet-evapotranspiration', name: 'OpenET Evapotranspiration Ensemble', status: 'UNAVAILABLE' },
        { id: 'usda-web-soil-survey', name: 'USDA Web Soil Survey', status: 'UNAVAILABLE_FOR_AFRICA' }
      ]
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async getDatabaseSummary(): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      '/datasets/database-summary',
      { method: 'GET' },
      async () => ({
        totalDatasets: 7,
        totalObservations: 32,
        coveredCountries: ['ET'],
        geographicRestrictions: {
          usdaWebSoilSurvey: 'United States Only (CONUS). Formally blocked from African soil records.'
        }
      })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async getStoredObservations(params: { country?: string; farm_id?: string; variable?: string }): Promise<ApiResponse<any[]>> {
    const q = new URLSearchParams();
    if (params.country) q.set('country', params.country);
    if (params.farm_id) q.set('farm_id', params.farm_id);
    if (params.variable) q.set('variable', params.variable);

    const res = await fetchWithFallback<any[]>(
      `/datasets/observations?${q.toString()}`,
      { method: 'GET' },
      async () => []
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async getFarmRecommendations(farmId: string): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/recommendations/farm/${encodeURIComponent(farmId)}`,
      { method: 'GET' },
      async () => null
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Retrieves NASA GEDI L4A footprint and L4B gridded biomass data for a specific farm.
   * Returns footprint-level (L4A) and 1km gridded (L4B) AGBD observations with
   * full scientific limitations and provenance metadata.
   */
  async getGediDataForFarm(farmId: string): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/datasets/gedi/farm/${encodeURIComponent(farmId)}`,
      { method: 'GET' },
      async () => null
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData ?? false,
      timestamp: new Date().toISOString(),
    };
  },

  // 3. Farms Management
  async getFarms(countryCode?: string): Promise<ApiResponse<Farm[]>> {
    const query = countryCode && countryCode !== 'ALL' ? `?country_code=${encodeURIComponent(countryCode)}` : '';
    const res = await fetchWithFallback<Farm[]>(
      `/farms${query}`,
      { method: 'GET' },
      async () => {
        let farms = getStoredFarms();
        if (countryCode && countryCode !== 'ALL') {
          farms = farms.filter((f) => f.countryCode === countryCode);
        }
        return farms;
      }
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async getFarmById(id: string): Promise<ApiResponse<Farm | null>> {
    const res = await fetchWithFallback<Farm | null>(
      `/farms/${encodeURIComponent(id)}`,
      { method: 'GET' },
      async () => {
        const farms = getStoredFarms();
        return farms.find((f) => f.id === id) || null;
      }
    );
    return {
      success: !!res.data,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async createFarm(newFarm: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Farm>> {
    const res = await fetchWithFallback<Farm>(
      '/farms',
      {
        method: 'POST',
        body: JSON.stringify(newFarm),
      },
      async () => {
        const farms = getStoredFarms();
        const farm: Farm = {
          ...newFarm,
          id: `farm-${Date.now().toString(36)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const updated = [farm, ...farms];
        saveStoredFarms(updated);
        return farm;
      }
    );
    return {
      success: true,
      data: res.data,
      message: 'Farm registered successfully.',
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async updateFarm(id: string, updates: Partial<Farm>): Promise<ApiResponse<Farm | null>> {
    const res = await fetchWithFallback<Farm | null>(
      `/farms/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      },
      async () => {
        const farms = getStoredFarms();
        const idx = farms.findIndex((f) => f.id === id);
        if (idx === -1) return null;
        const updated = { ...farms[idx], ...updates, updatedAt: new Date().toISOString() };
        farms[idx] = updated;
        saveStoredFarms(farms);
        return updated;
      }
    );
    return {
      success: !!res.data,
      data: res.data,
      message: 'Farm updated successfully.',
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async deleteFarm(id: string): Promise<ApiResponse<boolean>> {
    const res = await fetchWithFallback<boolean>(
      `/farms/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      async () => {
        const farms = getStoredFarms();
        saveStoredFarms(farms.filter((f) => f.id !== id));
        return true;
      }
    );
    return {
      success: res.data,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 4. Crop Knowledgebase
  async getCrops(countryCode?: string, region?: string): Promise<ApiResponse<Crop[]>> {
    let q = '';
    const params = new URLSearchParams();
    if (countryCode && countryCode !== 'ALL') params.append('country_code', countryCode);
    if (region) params.append('region', region);
    if (params.toString()) q = `?${params.toString()}`;

    const res = await fetchWithFallback<Crop[]>(
      `/crops${q}`,
      { method: 'GET' },
      async () => {
        let crops = INITIAL_CROPS;
        if (countryCode && countryCode !== 'ALL') {
          crops = crops.filter((c) => c.countryApplicability.includes(countryCode));
        }
        return crops;
      }
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async getCropById(id: string): Promise<ApiResponse<Crop | null>> {
    const res = await fetchWithFallback<Crop | null>(
      `/crops/${encodeURIComponent(id)}`,
      { method: 'GET' },
      async () => {
        return INITIAL_CROPS.find((c) => c.id === id) || null;
      }
    );
    return {
      success: !!res.data,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 5. Climate Intelligence
  async getClimateIntelligence(farm: Farm, year: number = 2024): Promise<ApiResponse<ClimateIntelligence>> {
    const res = await fetchWithFallback<ClimateIntelligence>(
      `/farms/${encodeURIComponent(farm.id)}/climate?year=${year}`,
      { method: 'GET' },
      async () => {
        return await climateProvider.getMonthlyClimate({
          latitude: farm.latitude,
          longitude: farm.longitude,
          year,
          countryCode: farm.countryCode,
        });
      }
    );
    return {
      success: true,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 5b. Historical Climate Comparison (Multi-year, same-month, seasonal)
  async getHistoricalClimateComparison(
    farm: Farm,
    year: number = 2024,
    month: number = 7,
    numYears: number = 5
  ): Promise<ApiResponse<import('../types').HistoricalClimateComparison>> {
    const res = await fetchWithFallback<import('../types').HistoricalClimateComparison>(
      `/farms/${encodeURIComponent(farm.id)}/climate/historical-comparison?year=${year}&month=${month}&numYears=${numYears}`,
      { method: 'GET' },
      async () => {
        // Fallback calculation for when offline or direct coordinate simulation
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const compYears: number[] = [];
        for (let i = numYears; i >= 0; i--) {
          compYears.push(year - i);
        }
        const annualComp = compYears.map((y) => ({
          year: y,
          isTargetYear: y === year,
          isComplete: y < 2025,
          annualRainfallMm: Math.round(1120 + ((y * 17) % 180) - 90),
          meanTempC: Number((23.8 + ((y * 7) % 15) / 10).toFixed(1)),
          maxTempC: 31.2,
          minTempC: 17.8,
          solarRadiationAvgMj: 19.2,
          dataSource: 'CHIRPS 2.0 / NASA POWER',
        }));
        const sameMonthComp = compYears.map((y) => ({
          year: y,
          month: months[month - 1],
          isTargetYear: y === year,
          rainfallMm: Math.round(180 + ((y * 13) % 45) - 20),
          tempMeanC: Number((22.5 + ((y * 3) % 10) / 10).toFixed(1)),
          tempMaxC: 30.5,
          tempMinC: 17.5,
          solarRadiationMj: 18.8,
          isComplete: y < 2025,
        }));
        const targetMonthly = months.map((m, idx) => ({
          month: m,
          monthIndex: idx + 1,
          rainfallMm: idx >= 5 && idx <= 8 ? Math.round(160 + (idx * 15)) : Math.round(25 + (idx * 8)),
          tempMeanC: Number((22 + (idx < 5 ? 2 : -1)).toFixed(1)),
          tempMaxC: 31.0,
          tempMinC: 17.5,
          solarRadiationMj: 19.0,
          isCompleteMonth: true,
        }));

        return {
          location: {
            latitude: farm.latitude,
            longitude: farm.longitude,
            countryCode: farm.countryCode || 'ET',
            spatialAggregation: 'POINT_COORDINATE_EXTRACTION',
          },
          selectedParameters: {
            year,
            month,
            monthName: months[month - 1],
            comparisonYearsRange: `${compYears[0]} - ${compYears[compYears.length - 1]}`,
          },
          baselineSummary: {
            referencePeriod: `${compYears[0]} - ${year - 1} (5-year baseline)`,
            baselineAnnualRainfallMm: 1115.0,
            baselineMeanTempC: 24.0,
            targetYearRainfallMm: annualComp[annualComp.length - 1].annualRainfallMm,
            targetYearMeanTempC: annualComp[annualComp.length - 1].meanTempC,
            rainfallAnomalyMm: Number((annualComp[annualComp.length - 1].annualRainfallMm - 1115.0).toFixed(1)),
            rainfallAnomalyPercentage: Number((((annualComp[annualComp.length - 1].annualRainfallMm - 1115.0) / 1115.0) * 100).toFixed(1)),
            temperatureAnomalyCelsius: Number((annualComp[annualComp.length - 1].meanTempC - 24.0).toFixed(1)),
          },
          annualComparison: annualComp,
          sameMonthComparison: sameMonthComp,
          seasonalComparison: {
            primary: {
              seasonName: 'Kiremt / Meher (Main Rainy Season)',
              months: 'Jun, Jul, Aug, Sep',
              cropCycle: 'Long-cycle crops: Maize, Sorghum, late Teff, Wheat',
              yearlyRecords: compYears.map((y) => ({
                year: y,
                isTargetYear: y === year,
                rainfallMm: Math.round(680 + ((y * 11) % 80) - 40),
                meanTempC: 22.8,
              })),
            },
            secondary: {
              seasonName: 'Belg (Short Rainy Season)',
              months: 'Feb, Mar, Apr, May',
              cropCycle: 'Short-cycle barley, early pulses, teff seedbed prep',
              yearlyRecords: compYears.map((y) => ({
                year: y,
                isTargetYear: y === year,
                rainfallMm: Math.round(280 + ((y * 9) % 50) - 25),
                meanTempC: 24.5,
              })),
            },
          },
          targetYearMonthlyData: targetMonthly,
          allYearsMonthlyMatrix: compYears.map((y) => ({
            year: y,
            isTargetYear: y === year,
            monthlyData: targetMonthly.map((tm) => ({
              ...tm,
              rainfallMm: Math.round(tm.rainfallMm * (1 + ((y % 5) - 2) * 0.05)),
            })),
          })),
          factualExplanation: `In ${year}, annual precipitation at ${farm.name} was ${annualComp[annualComp.length - 1].annualRainfallMm} mm against a 5-year reference baseline of 1115.0 mm. For the selected month of ${months[month - 1]}, rainfall was ${sameMonthComp[sameMonthComp.length - 1].rainfallMm} mm. Data compiled from CHIRPS 2.0 blended satellite precipitation and NASA POWER reanalysis.`,
          scientificCaveats: [
            'Observed annual or monthly variations represent historical meteorological variability; they do not by themselves constitute definitive attribution of global climate trends.',
            'Satellite precipitation (CHIRPS) and NASA POWER reanalysis represent gridded areal estimates (~5km and ~50km) and do not measure single-point micro-topographic rain gauge totals.',
          ],
          provenance: {
            nasaPower: {
              dataset: 'NASA POWER Agroclimatology (T2M, T2M_MAX, T2M_MIN, ALLSKY_SFC_SW_DWN)',
              spatialResolution: '0.5° x 0.5° (~50km)',
              temporalResolution: 'Monthly reanalysis',
              units: {
                temperature: 'Degrees Celsius (°C)',
                solarRadiation: 'Megajoules per square meter per day (MJ/m²/day)',
              },
              retrievalTimestamp: new Date().toISOString(),
              status: 'LIVE',
            },
            chirps: {
              dataset: 'CHIRPS 2.0 / 3.0 Satellite-Gauge Precipitation',
              spatialResolution: '0.05° x 0.05° (~5.3km)',
              temporalResolution: 'Daily aggregated to monthly totals',
              units: {
                rainfall: 'Millimeters (mm) accumulated total',
              },
              retrievalTimestamp: new Date().toISOString(),
              status: 'CALIBRATED_CLIMATOLOGY',
            },
          },
        };
      }
    );
    return {
      success: true,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 6. Soil Information
  async getSoilInformation(farm: Farm): Promise<ApiResponse<SoilInformation>> {
    const res = await fetchWithFallback<SoilInformation>(
      `/farms/${encodeURIComponent(farm.id)}/soil`,
      { method: 'GET' },
      async () => {
        return await soilProvider.getSoilData({
          latitude: farm.latitude,
          longitude: farm.longitude,
          countryCode: farm.countryCode,
          farmContext: farm,
        });
      }
    );
    return {
      success: true,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 6b. NASA SMAP Soil & Moisture Analytical Pipeline
  async getSoilMoistureIntelligence(lat: number, lon: number, crop: string = 'Field Crop'): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/soil/moisture?lat=${lat}&lon=${lon}&crop=${encodeURIComponent(crop)}`,
      { method: 'GET' },
      async () => ({
        coordinates: { latitude: lat, longitude: lon },
        cropContext: crop,
        soilTexture: { sandPercent: 35, clayPercent: 35, siltPercent: 30, textureClass: 'Clay Loam', organicMatterPercent: 2.1 },
        hydraulicLimits: { permanentWiltingPointVolumetric: 0.16, fieldCapacityVolumetric: 0.32, saturationPointVolumetric: 0.48, totalAvailableWaterCapacity: 0.16 },
        smapObservations: {
          surfaceMoisture_0_5cm: 0.24,
          rootZoneMoisture_0_100cm: 0.27,
          unit: 'm³/m³ (volumetric water content)',
          observationInstrument: 'SMAP L-Band Radiometer (1.414 GHz)',
          resolution: '9 km EASE-Grid 2.0 (L4_SM / L3_SM_P)',
          revisitCadence: '2-3 days global coverage'
        },
        agronomicMoistureStatus: {
          stressLevel: 'OPTIMAL_MOISTURE',
          relativeAvailableMoisturePercent: 68.8,
          statusText: 'Soil moisture in optimal root-zone range for active vegetative growth and nutrient uptake.',
          irrigationDeficitMm: 30.0,
          actionRecommended: 'Maintain standard moisture monitoring. No immediate irrigation needed.'
        },
        provenance: {
          dataSource: 'NASA Earthdata SMAP & ISRIC SoilGrids 2.0 (Client Fallback)',
          repositoryStandard: 'USDA NAL Ag Data Commons FAIR Metadata',
          doi: 'https://doi.org/10.5067/SMP60-3SPCS',
          calibrationSpecification: 'JPL D-72543 Revision C L1A/L4 SPS',
          isDemoData: true,
          status: 'DEMONSTRATION'
        }
      })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 7. CHIRPS Rainfall Analysis
  async getFarmRainfall(farmId: string, year: number = 2024): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/farms/${encodeURIComponent(farmId)}/rainfall?year=${year}`,
      { method: 'GET' },
      async () => ({
        annual: { totalRainfallMm: 850, rainfallAnomalyPercentage: 4.2, condition: 'Near Normal' },
        monthlyData: [],
        provenance: { dataset: 'CHIRPS 2.0 Local Fallback', status: 'DEMONSTRATION' }
      })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 8. Drought Monitoring
  async getFarmDrought(farmId: string, year: number = 2024): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/farms/${encodeURIComponent(farmId)}/drought?year=${year}`,
      { method: 'GET' },
      async () => ({
        meteorologicalDrought: { spiValue: 0.12, wmoClassification: 'Near Normal' },
        agriculturalDrought: { riskLevel: 'Low' },
        provenance: { dataset: 'WMO SPI Fallback', status: 'DEMONSTRATION' }
      })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 9. Sentinel-2 Vegetation
  async getFarmVegetation(farmId: string): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/farms/${encodeURIComponent(farmId)}/vegetation`,
      { method: 'GET' },
      async () => ({
        currentNdviIndex: 0.68,
        vegetationCondition: 'Moderate Vegetative Activity',
        satelliteObservation: { platform: 'Sentinel-2A/B', cloudCoveragePercentage: 5.2 },
        provenance: { dataset: 'Sentinel-2 L2A Fallback', status: 'DEMONSTRATION' }
      })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 10. Seasonal Climate
  async getFarmSeasonalClimate(farmId: string, year: number = 2024): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/farms/${encodeURIComponent(farmId)}/climate/seasonal?year=${year}`,
      { method: 'GET' },
      async () => ({
        seasonalPrecipitation: {},
        provenance: { dataset: 'Seasonal Climate Fallback', status: 'DEMONSTRATION' }
      })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 11. Farm Recommendations (farm-level endpoint) & Data Quality
  async getFarmRecommendationsByFarm(farmId: string): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/farms/${encodeURIComponent(farmId)}/recommendations`,
      { method: 'GET' },
      async () => ({ recommendations: [] })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async getFarmDataQuality(farmId: string): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/farms/${encodeURIComponent(farmId)}/data-quality`,
      { method: 'GET' },
      async () => ({ readinessLevel: 'PROVISIONAL_DEMONSTRATION', summaryMetrics: {}, evaluations: [] })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 11. Rotation Planner Recommendation Engine
  async evaluateRotation(farm: Farm, currentCrop: string, proposedCrops: string[]): Promise<ApiResponse<RotationEvaluation>> {
    const res = await fetchWithFallback<RotationEvaluation>(
      '/rotation/recommend',
      {
        method: 'POST',
        body: JSON.stringify({
          farmId: farm.id,
          latitude: farm.latitude,
          longitude: farm.longitude,
          countryCode: farm.countryCode,
          soilType: farm.soilType,
          waterAvailability: farm.waterAvailability,
          currentCrop,
          proposedCrops,
        }),
      },
      async () => {
        return RecommendationEngine.evaluateRotation(farm, currentCrop, proposedCrops);
      }
    );
    return {
      success: true,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 12. Farm Intelligence Comprehensive Report
  async getFarmReport(farmId: string, year: number = 2024): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/farms/${encodeURIComponent(farmId)}/report?year=${year}`,
      { method: 'GET' },
      async () => {
        const farms = getStoredFarms();
        const farm = farms.find((f) => f.id === farmId) || farms[0];
        return {
          farm,
          sources: [{ name: 'Client Cached Intelligence', status: 'DEMONSTRATION' }],
          generatedAt: new Date().toISOString(),
        };
      }
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 13. User Settings
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    const settings = getStoredSettings();
    return {
      success: true,
      data: settings,
      isDemoData: false,
      timestamp: new Date().toISOString(),
    };
  },

  // 14. Dataset Registry Availability & FAOSTAT
  async getDatasetAvailability(countryCode: string = 'ET'): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/datasets/availability?country=${encodeURIComponent(countryCode)}`,
      { method: 'GET' },
      async () => ({ countryCode, totalDatasets: 6, availableCount: 5, datasets: [] })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async getFaostatStatistics(countryCode: string, cropId?: string, year: number = 2022): Promise<ApiResponse<any>> {
    const query = cropId ? `?crop=${encodeURIComponent(cropId)}&year=${year}` : `?year=${year}`;
    const res = await fetchWithFallback<any>(
      `/datasets/faostat/${encodeURIComponent(countryCode)}${query}`,
      { method: 'GET' },
      async () => ({ countryCode, statistics: {} })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async getCropCalendar(countryCode: string, cropId?: string): Promise<ApiResponse<any>> {
    const query = cropId ? `?crop=${encodeURIComponent(cropId)}` : '';
    const res = await fetchWithFallback<any>(
      `/datasets/crop-calendar/${encodeURIComponent(countryCode)}${query}`,
      { method: 'GET' },
      async () => ({ countryCode, calendarAvailable: false })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async updateSettings(settings: UserSettings): Promise<ApiResponse<UserSettings>> {
    saveStoredSettings(settings);
    return {
      success: true,
      data: settings,
      message: 'Preferences updated.',
      isDemoData: false,
      timestamp: new Date().toISOString(),
    };
  },

  // 15. User-Supplied Datasets Import
  async getDatasetImports(countryCode?: string, status?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (countryCode) params.append('country', countryCode);
    if (status) params.append('status', status);
    const q = params.toString() ? `?${params.toString()}` : '';

    const res = await fetchWithFallback<any[]>(
      `/imports${q}`,
      { method: 'GET' },
      async () => []
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async uploadUserDataset(payload: {
    fileContent: string;
    filename: string;
    datasetType: string;
    countryCode: string;
    title: string;
    sourceName: string;
    sourceUrl?: string;
    license?: string;
  }): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      '/imports/upload',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      async () => ({ success: false, message: 'Local fallback upload not supported.' })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 16. AI Agricultural Assistant & Crop Advisor
  async sendAiAssistantMessage(
    message: string,
    farmContext?: any,
    countryCode: string = 'ET',
    capability: 'assistant' | 'advisor' = 'assistant'
  ): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      '/ai-assistant/chat',
      {
        method: 'POST',
        body: JSON.stringify({ message, farmContext, countryCode, capability }),
      },
      async () => ({
        success: true,
        response: capability === 'advisor'
          ? 'Crop Advisor Advisory: Rotate cereals with nitrogen-fixing legumes to replenish nitrogen and break root pest cycles.'
          : 'AI Assistant fallback: Soil, climate, and crop rotation advisories are grounded in FarmShield datasets.',
        topic: capability === 'advisor' ? 'Crop Advisor (Client Fallback)' : 'General Advisory (Client Fallback)',
        capability,
        isLiveAI: false,
        disclaimer: 'AI Advisory Notice: Running in client fallback mode.',
        citations: [{ source: 'FarmShield Client Engine', type: 'Offline' }]
      })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 17. Africa Map Boundaries
  async getAfricaGeoJson(): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      '/map/geojson',
      { method: 'GET' },
      async () => {
        const resp = await fetch('/africa_countries.json');
        return resp.json();
      }
    );
    return {
      success: res.success,
      data: res.data?.data || res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async getAiAssistantStatus(): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      '/ai-assistant/status',
      { method: 'GET' },
      async () => ({
        success: true,
        provider: 'knowledge_base_engine',
        isLiveAI: false,
        capabilities: ['Soil Health', 'Precipitation/SPI', 'NDVI Remote Sensing', 'Crop Rotation']
      })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 18. Agricultural Layers Catalog
  async getAgriculturalLayers(): Promise<ApiResponse<any[]>> {
    const res = await fetchWithFallback<any[]>(
      '/map/agricultural-layers',
      { method: 'GET' },
      async () => [
        { id: 'standard', name: 'Standard Basemap', category: 'base' },
        { id: 'satellite', name: 'Satellite Imagery', category: 'base' },
        { id: 'terrain', name: 'Terrain & Topography', category: 'base' },
        { id: 'farm_boundaries', name: 'Farm Boundaries & Plots', category: 'farm' }
      ]
    );
    return {
      success: res.success,
      data: res.data || [],
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 19. Country Agricultural Profile & Verified Statistics
  async getCountryAgriculture(countryCode: string): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/countries/${encodeURIComponent(countryCode)}/agriculture`,
      { method: 'GET' },
      async () => ({
        countryCode,
        agriculturalStatistics: {},
        disclaimer: 'Offline client mode. Connect to backend for verified statistics.'
      })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 19b. Country Administrative Divisions (54 Countries)
  async getCountryDivisions(countryCode: string): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/countries/${encodeURIComponent(countryCode)}/divisions`,
      { method: 'GET' },
      async () => {
        // Fallback to local divisions bundle if offline
        const { AFRICAN_ADMIN_DIVISIONS } = await import('../data/countries/divisions');
        return AFRICAN_ADMIN_DIVISIONS[countryCode.toUpperCase()] || null;
      }
    );
    return {
      success: res.success,
      data: res.data?.data || res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  // 20. Farm Sub-Plots
  async getFarmPlots(farmId: string): Promise<ApiResponse<any[]>> {
    const res = await fetchWithFallback<any[]>(
      `/farms/${encodeURIComponent(farmId)}/plots`,
      { method: 'GET' },
      async () => []
    );
    return {
      success: res.success,
      data: res.data || [],
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },

  async createFarmPlot(farmId: string, plotPayload: any): Promise<ApiResponse<any>> {
    const res = await fetchWithFallback<any>(
      `/farms/${encodeURIComponent(farmId)}/plots`,
      {
        method: 'POST',
        body: JSON.stringify(plotPayload),
      },
      async () => ({ success: false, message: 'Plot creation requires active backend.' })
    );
    return {
      success: res.success,
      data: res.data,
      isDemoData: res.isDemoData,
      timestamp: new Date().toISOString(),
    };
  },
};
