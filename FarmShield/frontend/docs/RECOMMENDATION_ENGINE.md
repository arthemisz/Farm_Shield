# FarmShield — Recommendation Engine

The FarmShield recommendation engine evaluates proposed crop rotation sequences and produces a scored `RotationEvaluation` object.

---

## Architecture

```
RecommendationEngine.evaluateRotation()
        │
        ├── Load RecommendationProfile for countryCode (or DEFAULT)
        │
        ├── Score 5 factors:
        │       1. Climate Suitability      (default weight: 30%)
        │       2. Soil Suitability         (default weight: 25%)
        │       3. Water Requirements       (default weight: 20%)
        │       4. Crop Diversity           (default weight: 15%)
        │       5. Nitrogen Fixation        (default weight: 10%)
        │
        ├── Compute weighted overall score (0–100)
        │
        ├── Assign overallAssessment:
        │       ≥ 85  → "Highly Recommended"
        │       ≥ 70  → "Recommended"
        │       ≥ 55  → "Conditional / Moderate Risk"
        │       < 55  → "Not Advised"
        │
        └── Attach DataProvenance (isDemoData: true)
```

---

## Scoring Factors

### 1. Climate Suitability
Evaluates whether the proposed crop's thermal and moisture requirements match the farm's climate zone. Uses historical rainfall alignment and temperature envelope data.

### 2. Soil Suitability
Matches crop root requirements against the farm's soil type, pH range, drainage class, and organic carbon content.

### 3. Water Requirements
Compares the crop's evapotranspiration profile against seasonal rainfall availability and water source reliability.

### 4. Crop Diversity
Measures botanical family distance between the outgoing and incoming crop. A legume-to-cereal or cereal-to-legume transition scores higher than within-family rotations.

### 5. Nitrogen Fixation
Rewards legume inclusion in the rotation for biological nitrogen fixation potential.

---

## Recommendation Profiles

Each country can override the default scoring weights:

```typescript
// src/services/recommendations/recommendationProfiles.ts
{
  ET: {
    weights: { climateSuitability: 0.30, soilSuitability: 0.28, waterRequirements: 0.22, cropDiversity: 0.12, nitrogenFixation: 0.08 }
  },
  KE: {
    weights: { climateSuitability: 0.30, soilSuitability: 0.25, waterRequirements: 0.20, cropDiversity: 0.15, nitrogenFixation: 0.10 }
  },
  DEFAULT: {
    weights: { climateSuitability: 0.30, soilSuitability: 0.25, waterRequirements: 0.20, cropDiversity: 0.15, nitrogenFixation: 0.10 }
  }
}
```

---

## Important Disclaimers

> ⚠️ **The recommendation engine uses mathematical heuristics applied to demonstration datasets. It does NOT use real validated field-trial data.**
>
> All outputs carry `provenance.isDemoData: true` and display the yellow DEMO badge in the UI.
>
> Scores should NOT be treated as agronomic guarantees. Always consult local agricultural extension officers and site-specific soil tests.

---

## Future Improvements (Phase 2+)

- Replace heuristic scores with ML model trained on FAOSTAT yield data
- Integrate real NASA POWER climate API calls
- Integrate real SoilGrids API calls
- Add pest pressure and disease risk factors
- Add market price and supply chain factors
- Regional sub-model calibration per administrative zone

