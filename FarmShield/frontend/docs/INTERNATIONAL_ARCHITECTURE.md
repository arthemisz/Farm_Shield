# FarmShield — International Architecture

## Overview

FarmShield is designed as a **multi-country agricultural intelligence platform**. The architecture separates country-specific configuration from generic application logic, allowing new countries to be added without modifying core components.

---

## Country Support Tiers

| Tier | Status | Description |
|------|--------|-------------|
| **MVP** | ✅ Fully Supported | Country has crops, administrative divisions, climate & soil providers configured. Demo data is available. |
| **Planned** | 🟡 Coming Soon | Country configuration exists (administrative levels, bounds, flag) but no crop data or validated agricultural rules yet. |
| **Future** | ⬜ Not Started | Country not yet in registry. |

### Current Status

| Country | Code | Tier |
|---------|------|------|
| Ethiopia | ET | ✅ MVP |
| Kenya | KE | 🟡 Planned |
| Uganda | UG | 🟡 Planned |
| Tanzania | TZ | 🟡 Planned |
| Rwanda | RW | 🟡 Planned |

---

## Directory Structure

```
frontend/src/
├── data/
│   └── countries/
│       ├── ethiopia.ts        # Full MVP configuration
│       ├── kenya.ts           # Planned — admin levels only
│       ├── uganda.ts          # Planned — admin levels only
│       ├── tanzania.ts        # Planned — admin levels only
│       ├── rwanda.ts          # Planned — admin levels only
│       └── index.ts           # Registry, exports, helper functions
├── services/
│   ├── providers/
│   │   ├── climate/           # IClimateProvider + NasaPowerClimateProvider
│   │   ├── soil/              # ISoilProvider + SoilGridsProvider
│   │   ├── agriculture/       # IAgricultureProvider + FaostatAgricultureProvider
│   │   └── mapping/           # IMappingProvider + OpenStreetMapProvider
│   └── recommendations/
│       ├── recommendationProfiles.ts   # Per-country scoring weights
│       └── recommendationEngine.ts     # Pluggable evaluation engine
├── utils/
│   └── unitConverter.ts       # Area, temperature, rainfall, currency formatting
├── i18n.ts                    # i18next configuration
└── locales/
    ├── en/common.json
    ├── am/common.json         # Amharic (Ethiopia)
    ├── sw/common.json         # Swahili (Kenya, Tanzania, Uganda, Rwanda)
    ├── fr/common.json         # French (Rwanda)
    └── ar/common.json         # Arabic (future)
```

---

## Country Configuration Object

Each country file exports a `CountryConfig` object:

```typescript
interface CountryConfig {
  code: string;                    // ISO 3166-1 alpha-2
  name: string;
  flag: string;                    // Emoji flag
  currency: string;                // ISO 4217
  defaultLanguage: string;         // BCP 47 language tag
  supportedLanguages: string[];
  measurementPreferences: MeasurementPreferences;
  adminLevels: AdministrativeLevelConfig[];
  supportedCrops: string[];        // Crop IDs
  climateProviders: string[];      // Provider IDs
  soilProviders: string[];
  agriculturalProviders: string[];
  mappingProviders: string[];
  bounds: { north: number; south: number; east: number; west: number };
  supportStatus: 'mvp' | 'planned' | 'future';
  supportNote?: string;
}
```

---

## Adding a New Country

1. Create `src/data/countries/<iso_code>.ts` following the `CountryConfig` interface.
2. Add the import and entry to `src/data/countries/index.ts`.
3. Add locale translations to `src/locales/<lang>/common.json`.
4. Add a `RECOMMENDATION_PROFILES` entry in `src/services/recommendations/recommendationProfiles.ts`.
5. Set `supportStatus: 'planned'` until crops and agricultural rules are validated.
6. Update `supportedCrops` once crop data is authored and reviewed.

> ⚠️ **Never set a country to `'mvp'` status until its crop database entries and administrative divisions have been reviewed by an agricultural domain expert.**

---

## Country Switching

The active country is stored in:
- **React Context:** `FarmShieldContext.selectedCountry` (a `CountryConfig` object)
- **localStorage key:** `farmshield_settings` → `selectedCountryCode`
- **UI:** `CountrySelector` dropdown in `TopNavbar`

When the country changes:
1. Context re-renders all subscribed components.
2. Admin level labels update (e.g., "Region/Zone/Woreda" → "County/Sub-county/Ward").
3. Farm form validates against the new country's admin levels.
4. Map pans to the new country's bounding box.
5. i18n language may switch to the country's default language.

