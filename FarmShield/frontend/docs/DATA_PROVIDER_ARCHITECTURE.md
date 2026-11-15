# FarmShield — Data Provider Architecture

FarmShield uses a **provider pattern** to decouple data retrieval from business logic. Each data domain (climate, soil, agriculture, mapping) has a provider interface and one or more concrete implementations.

---

## Provider Interfaces

### IClimateProvider (`src/services/providers/climate/climateProvider.ts`)

```typescript
interface IClimateProvider {
  id: string;
  name: string;
  getMonthlyClimate(lat: number, lon: number, year: number): Promise<MonthlyClimatePoint[]>;
  getHistoricalTrend(lat: number, lon: number, years: number): Promise<HistoricalTrendPoint[]>;
  getSummary(lat: number, lon: number, year: number): Promise<ClimateSummary>;
}
```

**Current implementation:** `NasaPowerClimateProvider`
- API base: `https://power.larc.nasa.gov/api/temporal/monthly/point`
- Parameters: `T2M`, `PRECTOTCORR`, `RH2M`
- Resolution: 0.5° × 0.5° (~50 km)
- **Phase 1 note:** All calls return demonstration-simulated data. Real API integration is planned for Phase 2 backend.

---

### ISoilProvider (`src/services/providers/soil/soilProvider.ts`)

```typescript
interface ISoilProvider {
  id: string;
  name: string;
  getSoilProperties(lat: number, lon: number): Promise<SoilProperties>;
}
```

**Current implementation:** `SoilGridsProvider`
- API base: `https://rest.isric.org/soilgrids/v2.0/properties/query`
- Properties: `phh2o`, `soc`, `clay`, `sand`, `silt`, `bdod`
- **Phase 1 note:** Demonstration data only.

---

### IAgricultureProvider (`src/services/providers/agriculture/agricultureProvider.ts`)

```typescript
interface IAgricultureProvider {
  id: string;
  name: string;
  getCropProductionStats(countryCode: string, cropId: string): Promise<ProductionStats>;
}
```

**Current implementation:** `FaostatAgricultureProvider`
- Data source: FAOSTAT bulk download files
- **Phase 1 note:** Static demonstration data embedded in frontend.

---

### IMappingProvider (`src/services/providers/mapping/mappingProvider.ts`)

```typescript
interface IMappingProvider {
  id: string;
  name: string;
  getTileUrl(): string;
  getAttribution(): string;
  geocode(query: string): Promise<GeocodingResult[]>;
}
```

**Current implementation:** `OpenStreetMapProvider`
- Tile URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Geocoding: Nominatim (rate limited — 1 req/s)

---

## Data Provenance

Every data object returned from a provider carries a `DataProvenance` struct:

```typescript
interface DataProvenance {
  provider: string;
  source: string;
  retrievalDate: string;
  timePeriod: string;
  spatialResolution: string;
  measurementType: 'measured' | 'satellite_model' | 'reanalysis' | 'demonstration_simulation';
  limitations: string;
  isDemoData: boolean;
}
```

> **UI rule:** When `isDemoData === true`, the UI **must** display a yellow "DEMO DATA" badge. This is enforced in `ClimateIntelligencePage`, `SoilInformationPage`, and `CropRotationPlannerPage`.

---

## Adding a New Provider

1. Create the implementation file under `src/services/providers/<domain>/`.
2. Implement the interface.
3. Register the provider ID string in the country config's `climateProviders` / `soilProviders` etc. array.
4. Update `src/services/api.ts` to instantiate the correct provider based on country config.

---

## Security Notes

- **No API keys are stored in frontend code.** All keys must go in environment variables (`VITE_NASA_API_KEY`, etc.) loaded at build time.
- **Never expose secret keys in `src/` files or commit `.env.local`.**
- All real API calls will go through the backend proxy (Phase 2) to prevent CORS issues and key exposure.

