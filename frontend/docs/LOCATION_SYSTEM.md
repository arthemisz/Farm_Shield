# FarmShield — Location and Administrative Boundary System

## Overview

FarmShield replaces static single-country location fields (e.g. fixed "Region / Zone / Woreda") with a dynamic, country-driven hierarchy specified in each country's configuration.

---

## Data Model

Each country configuration (`CountryConfig`) defines an array of administrative division levels:

```typescript
export interface AdministrativeLevelConfig {
  level: number;         // 1, 2, 3
  name: string;          // e.g. "Region", "County", "District", "Mkoa"
  namePlural: string;    // e.g. "Regions", "Counties", "Districts"
  required: boolean;     // Level 1 is always required
  options?: string[];    // Predefined options (if known/configured)
}
```

### Country Comparison

| Country | Code | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Ethiopia** | `ET` | Region (e.g., Oromia, Amhara) | Zone | Woreda |
| **Kenya** | `KE` | County (e.g., Nakuru, Uasin Gishu) | Sub-county | Ward |
| **Uganda** | `UG` | Region | District | Sub-county |
| **Tanzania** | `TZ` | Mkoa | Wilaya | Kata |
| **Rwanda** | `RW` | Province | District | Sector |

---

## Farm Model Compatibility

In `Farm` (`src/types/index.ts`):

- `countryCode`: ISO 3166-1 alpha-2 code (`ET`, `KE`, etc.)
- `country`: Full country name
- `adminLevel1`: Level 1 division value
- `adminLevel2`: Level 2 division value (optional)
- `adminLevel3`: Level 3 division value (optional)

### Backward Compatibility
For legacy Ethiopian records, the accessors `region`, `zone`, and `woreda` remain populated and mapped directly to `adminLevel1`, `adminLevel2`, and `adminLevel3`.

---

## Coordinate Bounds & Validation

Each country configuration provides geographic bounding coordinates:

```typescript
bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}
```

When users select a country or click on the map, coordinates can be checked against these bounds, and the interactive map auto-focuses on the selected country's boundary envelope.

