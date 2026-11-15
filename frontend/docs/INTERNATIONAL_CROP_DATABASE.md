# FarmShield — International Crop Database

## Overview

FarmShield's crop model distinguishes between universal botanical attributes and country-specific agricultural realities. A single crop entry holds botanical, physiological, and soil tolerance baselines, while regional suitability, local naming, and agroecological zones are attached per country.

---

## Data Schema

### Crop Interface (`src/types/index.ts`)

```typescript
export interface Crop {
  id: string;
  name: string;
  scientificName: string;
  category: 'Cereal' | 'Legume / Pulse' | 'Oilseed' | 'Vegetable' | 'Root / Tuber';
  localNames: Record<string, string>; // e.g. { am: 'ጤፍ', sw: 'Ufuta' }
  growingPeriodDays: { min: number; max: number };
  waterRequirementMm: { min: number; max: number };
  optimalTemperatureC: { min: number; max: number };
  optimalAltitudeM: { min: number; max: number };
  soilSuitability: {
    preferredTypes: SoilType[];
    phTolerance: { min: number; max: number; optimalMin: number; optimalMax: number };
    drainageRequirement: 'Good' | 'Moderate' | 'Tolerant of waterlogging';
    salinityTolerance: 'Low' | 'Moderate' | 'High';
  };
  rotationRole: {
    nitrogenFixation: boolean;
    nitrogenCreditKgPerHa?: number;
    breakCropFor: string[];
    vulnerabilityAfter: string[];
    synergisticPreceding: string[];
  };
  countryApplicability: Record<string, CountryApplicability>;
  provenance: DataProvenance;
}
```

---

## Country Applicability

For each country where the crop is cataloged:

```typescript
export interface CountryApplicability {
  countryCode: string;
  primarySeasonName: string;      // e.g. "Meher" (ET), "Long Rains" (KE)
  secondarySeasonName?: string;    // e.g. "Belg" (ET), "Short Rains" (KE)
  regionalSuitability: {
    regionName: string;
    suitabilityScore: number;     // 0-100
    notes: string;
  }[];
  validationStatus: 'validated' | 'provisional' | 'untested';
}
```

### Initial Crops in MVP

1. **Teff (*Eragrostis tef*)**
   - Category: Cereal
   - Fully detailed for Ethiopia (`ET` validation: `validated`).
   - Flagged as `untested` / `provisional` for neighboring nations.

2. **Wheat (*Triticum aestivum*)**
   - Category: Cereal
   - Validated for Ethiopian highlands (`ET`), planned evaluation for Kenyan Rift Valley (`KE`).

3. **Maize (*Zea mays*)**
   - Category: Cereal
   - High-yield staple with extensive profiles for both mid-altitude Ethiopia and East African sub-humid zones.

4. **Faba Bean (*Vicia faba*)**
   - Category: Legume / Pulse
   - Primary nitrogen fixer (adds ~60–90 kg residual N/ha). Breaks cereal root pathogen cycles.

---

## Adding New Crops for International Expansion

To add a new crop:
1. Define the universal botanical properties in `src/data/mockData.ts`.
2. Add entries in `localNames` for relevant languages.
3. Configure `countryApplicability` for each target country with realistic ecological parameters and clear `validationStatus`.
4. Ensure the crop is linked under `supportedCrops` in each appropriate country configuration file (`src/data/countries/*.ts`).

