# AgriPulse AI 🌱

**Smart Irrigation Recommendation System** — Kiro AI-DLC Challenge

AgriPulse AI helps farmers decide when and how much to irrigate by combining real weather forecasts
with FAO-56 crop evapotranspiration formulas and manually entered soil moisture estimates.

## Features

- **Real weather data** — 7-day ET₀, rainfall, temperature, wind from [Open-Meteo](https://open-meteo.com) (free, no API key)
- **FAO-56 irrigation engine** — ETc = ET₀ × Kc; soil buffer = clamp(θ − PWP, 0, FC − PWP) × rootDepth
- **Transparent recommendations** — every calculation step shown with formulas, values, and units
- **Farm management** — multiple farms, geocoded locations, localStorage persistence
- **Irrigation planner** — create and track irrigation tasks; record actual volumes applied
- **History & analytics** — recommendation log, Recharts trend charts, CSV export
- **In-app notifications** — rain alerts, stale soil reading reminders, upcoming task alerts

## Reliability & Audit Improvements ✅

**Recent reliability audit completed (Oct 2026):**

### Critical Fixes
- **Rice crop distinction** — Added specific warning for paddy rice (flooded conditions differ)
- **VWC% validation** — Strict 0–100% range validation with user feedback
- **TypeScript cleanup** — All unused variable/import warnings eliminated
- **Build verification** — Zero TypeScript errors, production-ready builds
- **Test coverage** — 48/48 tests passing (100% test success rate)

### Formula Corrections
- **Soil moisture semantics** — VWC% properly interpreted as volumetric water content (θ = VWC%/100)
- **Soil buffer formula** — Fixed as: `clamp(θ − PWP, 0, FC − PWP) × rootDepth × 1000` [mm]
- **Units consistency** — All calculations verified for dimensional correctness

### Known Limitations & Disclaimers
- **Rice irrigation** — Same Kc treatment as other crops with warning about flooded conditions
- **Sensor data** — No real-time soil moisture integration (manual VWC% estimate only)
- **Validation scope** — Not a validated soil-water balance model; guide only
- **Real-world use** — Verify recommendations against on-farm conditions before applying

## Tech Stack

- React 18 + Vite + TypeScript (strict mode)
- Tailwind CSS v3 (forest-green palette)
- Recharts (analytics)
- Zod (validation)
- Vitest + Testing Library (unit tests)
- Open-Meteo APIs (weather + geocoding)
- localStorage (demo persistence)

## Local Development

```bash
npm install
npm run dev        # Dev server at localhost:5173
npm test           # Unit tests (48/48 passing)
npm run build      # Production build (zero TypeScript errors)
```

## Complete Workflow Test

1. **Add Farm** → Enter location, crop, field area
2. **Weather Check** → Verify 7-day forecast loads correctly
3. **Run Advisor** → Enter soil moisture (VWC%), get recommendation
4. **Create Task** → Schedule irrigation based on recommendation
5. **Record Event** → Mark task complete with actual volume applied
6. **View History** → Analyze trends, export CSV data

## Deployment (Vercel)

```bash
vercel deploy --prod
```

The `vercel.json` includes SPA rewrite rules for client-side routing.

## Formula Reference

```
ET₀_daily     = Σ hourly et0_fao_evapotranspiration    [mm/day]
ETc           = ET₀_daily × Kc(crop, stage)            [mm/day]
EffectiveRain = total_forecast_rain × 0.80             [mm]
SoilBuffer    = clamp(θ − PWP, 0, FC − PWP) × rootDepth × 1000  [mm]
NetDemand     = (ETc × horizonDays) − EffectiveRain − SoilBuffer  [mm]
Volume        = max(0, NetDemand) × fieldArea_ha × 10000           [L]
```

Where:
- `θ` = user-entered VWC% / 100 (m³/m³) — **validated 0–100%**
- `FC`, `PWP` = field capacity and permanent wilting point from FAO-56 Table 9
- `Kc` = crop coefficient from FAO-56 Table 12
- `rootDepth` = representative root depth from FAO-56 Table 22

## Test Status

✅ **All 48 tests passing**
- Engine tests: 31/31
- Data tests: 12/12  
- Component tests: 2/2
- Utility tests: 3/3

## Not Claimed

- Real soil sensor data — soil moisture is always a manual VWC% estimate
- IoT or hardware integration
- Trained ML/AI models — all recommendations are deterministic formula-based rules
- Validated soil-water balance modelling
- User authentication or cloud storage
- Multi-language support

**Reference:** Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998).
*Crop evapotranspiration — Guidelines for computing crop water requirements.*
FAO Irrigation and Drainage Paper No. 56. Rome.
