# AgriPulse AI — Technical Design

## Architecture

```
Browser (React SPA — Vite + TypeScript + Tailwind CSS)
│
├── API Layer (src/api/)
│   └── openMeteo.ts          Geocoding + weather fetch; typed; error-handled
│
├── Engine Layer (src/engine/)  ← Pure functions, no side effects
│   ├── irrigationEngine.ts   Step-by-step formula functions
│   └── recommendationEngine.ts  Deterministic rules → RecommendationResult
│
├── Data Layer (src/data/)
│   ├── cropCoefficients.ts   Kc + root depths (FAO-56 Table 12, 22)
│   └── soilConstants.ts      FC, PWP per soil type (FAO-56 Table 9)
│
├── Store Layer (src/store/)  ← localStorage with Zod validation on read
│   ├── farmStore.ts
│   ├── irrigationStore.ts
│   ├── historyStore.ts
│   └── settingsStore.ts
│
├── Components (src/components/)
│   ├── Layout.tsx            Sidebar + mobile nav
│   ├── FarmForm.tsx          Geocoding + validated farm form
│   ├── RecommendationPanel.tsx  Color-coded action with metrics
│   ├── ExplainabilityPanel.tsx  Collapsible formula trace table
│   ├── WeatherCard.tsx       Daily weather card
│   └── ui/                   Button, Card, Badge, Input, Select, Alert, Dialog, Skeleton
│
└── Pages (src/pages/)
    ├── Dashboard.tsx
    ├── FarmManagement.tsx
    ├── WeatherPage.tsx
    ├── IrrigationAdvisor.tsx
    ├── IrrigationPlanner.tsx
    ├── HistoryPage.tsx
    └── SettingsPage.tsx
```

## Corrected Hybrid Formula

### Soil Moisture Input Semantics

The user enters **Volumetric Water Content (VWC%)** — the percentage of soil volume occupied by water. This is a manual field estimate, not a sensor reading.

```
θ (m³/m³) = soilMoistureVwcPct / 100
```

This maps to the standard soil physics notation where θ represents m³ water per m³ soil.

### Step-by-Step Calculation

```
# Step 1: Daily ET₀ (from Open-Meteo)
ET₀_daily (mm/day) = Σ et0_fao_evapotranspiration (mm/hr) over 24 hours
Source: Open-Meteo API, FAO-56 Penman-Monteith computed server-side

# Step 2: Crop Evapotranspiration
ETc (mm/day) = ET₀_daily × Kc(crop, growthStage)
Kc: dimensionless, from FAO-56 Table 12
Assumption: single Kc, not dual Kc (Kcb + Ke)

# Step 3: Effective Rainfall
EffectiveRain (mm) = Σ(daily precipitation) × 0.80
Assumption: 80% efficiency for rainfall events < 40 mm/day (FAO simplified method)
Warning issued if rain > 40 mm

# Step 4: Soil Water Buffer (dimensionally correct)
θ (m³/m³)            = soilMoistureVwcPct / 100
availFraction (m³/m³) = clamp(θ − PWP, 0, FC − PWP)
SoilBuffer (mm)       = availFraction × rootDepth_mm

Dimensional analysis: (m³/m³ − m³/m³) × mm = mm ✓

where:
  FC, PWP: from soil type lookup (FAO-56 Table 9, m³/m³)
  rootDepth: from crop lookup (FAO-56 Table 22, mm)
  clamp: ensures result ≥ 0 and ≤ total PAW × rootDepth

LIMITATIONS:
  - Assumes uniform moisture through root zone
  - VWC% is manual estimate only
  - Does not model gravitational drainage or capillary rise

# Step 5: Net Irrigation Demand
NetDemand (mm) = (ETc × horizonDays) − EffectiveRain − SoilBuffer
Units: (mm/day × days) − mm − mm = mm ✓

# Step 6: Irrigation Volume
IrrigationVolume (L) = max(0, NetDemand_mm) × fieldArea_ha × 10,000
Units: mm × m² = L (1 mm over 1 m² = 1 litre) ✓
```

### Recommendation Rules (deterministic, in order)

```
1. IF soilMoistureVwcPct is undefined          → "collect-reading"
2. IF soilReadingAgeHours > 48                 → "collect-reading"
3. IF NetDemand ≤ 0                            → "wait"
4. ELSE                                         → "irrigate"
```

## Soil Type Constants (FAO-56 Table 9)

| Soil Type | FC (m³/m³) | PWP (m³/m³) | PAW (m³/m³) |
|-----------|------------|-------------|-------------|
| Sandy     | 0.10       | 0.04        | 0.06        |
| Loamy     | 0.26       | 0.10        | 0.16        |
| Clay      | 0.36       | 0.18        | 0.18        |
| Silty     | 0.30       | 0.12        | 0.18        |

## Crop Coefficients (FAO-56 Table 12)

| Crop      | Kc_ini | Kc_mid | Kc_end | RootDepth (mm) |
|-----------|--------|--------|--------|----------------|
| Wheat     | 0.30   | 1.15   | 0.25   | 900            |
| Maize     | 0.30   | 1.20   | 0.35   | 600            |
| Rice      | 1.05   | 1.20   | 0.75   | 500            |
| Tomato    | 0.40   | 1.15   | 0.70   | 700            |
| Potato    | 0.45   | 1.15   | 0.75   | 500            |
| Soybean   | 0.40   | 1.15   | 0.50   | 600            |
| Cotton    | 0.35   | 1.15   | 0.50   | 1000           |
| Sugarcane | 0.40   | 1.25   | 0.75   | 1200           |

Source: Allen et al. (1998). FAO-56. These are for sub-humid reference conditions
(RH_min ≈ 45%, u₂ ≈ 2 m/s). Site-specific adjustment is not performed in this MVP.

## Open-Meteo API

- **Geocoding:** `https://geocoding-api.open-meteo.com/v1/search`
- **Weather:** `https://api.open-meteo.com/v1/forecast`
- **Variables used:** `et0_fao_evapotranspiration`, `precipitation`, `precipitation_probability`, `temperature_2m`, `wind_speed_10m`, `weather_code`
- **No API key required.** Free and open.
- **ET₀ note:** Open-Meteo computes FAO-56 Penman-Monteith ET₀ server-side — we do not re-implement Penman-Monteith.

## Data Assumptions and Limitations

1. **ET₀ from weather model:** Reflects a well-irrigated grass reference surface, not the actual field surface.
2. **Single Kc approach:** Uses time-averaged Kc for each stage. Does not use dual Kc (Kcb + Ke) which separates transpiration and soil evaporation.
3. **Kc sub-humid reference:** Values are for RH_min ≈ 45%, u₂ ≈ 2 m/s. High wind or low humidity locations may need adjustment (not implemented).
4. **Soil uniformity:** Assumes moisture is uniformly distributed throughout the root zone.
5. **Effective rainfall:** 80% factor is a simplification; valid for events < 40 mm/day. The USDA SCS method is more accurate for heavy rain.
6. **Root depth:** Representative values from FAO-56 Table 22; actual root depth varies by cultivar, irrigation history, and soil compaction.
7. **VWC input:** A manual estimate with inherent uncertainty. The user must assess this themselves; no sensor data is used.
