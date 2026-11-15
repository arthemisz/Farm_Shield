# FarmShield — Country Configuration Guide

This guide explains how to author a complete country configuration for FarmShield.

---

## Step 1 — Create the country file

Create `src/data/countries/<iso2>.ts`. Use `ethiopia.ts` as the reference implementation.

### Minimum required fields

```typescript
import { CountryConfig } from '../../types';

export const KENYA_CONFIG: CountryConfig = {
  code: 'KE',
  name: 'Kenya',
  flag: '🇰🇪',
  currency: 'KES',
  defaultLanguage: 'sw',
  supportedLanguages: ['sw', 'en'],
  measurementPreferences: {
    area: 'hectares',
    temperature: 'celsius',
    rainfall: 'mm',
  },
  adminLevels: [
    { level: 1, name: 'County',       namePlural: 'Counties',      required: true,  options: ['Nairobi', 'Mombasa', /* ... */] },
    { level: 2, name: 'Sub-county',   namePlural: 'Sub-counties',  required: false, options: [] },
    { level: 3, name: 'Ward',         namePlural: 'Wards',         required: false, options: [] },
  ],
  supportedCrops: [],             // Fill once crop data is validated
  climateProviders: ['nasa-power'],
  soilProviders: ['soilgrids'],
  agriculturalProviders: ['faostat'],
  mappingProviders: ['openstreetmap'],
  bounds: { north: 5.0, south: -4.7, east: 42.0, west: 33.9 },
  supportStatus: 'planned',
  supportNote: 'Administrative structure configured. Crop database and agricultural rules pending validation.',
};
```

---

## Step 2 — Register the country

In `src/data/countries/index.ts`:

```typescript
import { KENYA_CONFIG } from './kenya';

export const COUNTRIES: Record<string, CountryConfig> = {
  ET: ETHIOPIA_CONFIG,
  KE: KENYA_CONFIG,   // ← Add here
  // ...
};
```

---

## Step 3 — Add locale strings

Add Swahili translations to `src/locales/sw/common.json`:

```json
{
  "nav": {
    "dashboard": "Dashibodi",
    "myFarms": "Mashamba Yangu"
  }
}
```

---

## Step 4 — Add recommendation profile

In `src/services/recommendations/recommendationProfiles.ts`:

```typescript
export const RECOMMENDATION_PROFILES: Record<string, RecommendationProfile> = {
  ET: { /* existing */ },
  KE: {
    countryCode: 'KE',
    weights: {
      climateSuitability: 0.30,
      soilSuitability:    0.25,
      waterRequirements:  0.20,
      cropDiversity:      0.15,
      nitrogenFixation:   0.10,
    },
    notes: 'Kenya profile — pending field validation with KALRO data.',
  },
  DEFAULT: { /* fallback */ },
};
```

---

## Step 5 — Validate before promoting to MVP

A country **must not** be set to `supportStatus: 'mvp'` until:

- [ ] All `adminLevels[1].options` are complete and verified
- [ ] At least 4 crops have full `CountryApplicability` entries for this country code
- [ ] `RECOMMENDATION_PROFILES[code]` weights have been reviewed by an agronomist
- [ ] Demo data generates without TypeScript errors
- [ ] A domain expert has reviewed the suitability logic

---

## Administrative Level Design

Ethiopia uses three levels: **Region → Zone → Woreda**
Kenya uses: **County → Sub-county → Ward**
Uganda uses: **Region → District → Sub-county**
Tanzania uses: **Mkoa (Region) → Wilaya (District) → Kata (Ward)**
Rwanda uses: **Province → District → Sector**

The `adminLevels` array drives:
- Form labels in Add/Edit Farm
- Filter dropdowns in My Farms
- Map tooltip display
- Reports header

Always provide at least `level: 1` with `required: true`.

