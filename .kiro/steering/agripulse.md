---
inclusion: always
---

# AgriPulse AI — Project Steering

## Never Invent Data
- All displayed values must come from the Open-Meteo API, the irrigation engine, or explicit user input.
- Never hardcode fake weather values, sample recommendations, or made-up usage statistics.
- If data is unavailable, show an explicit empty state or error — not fabricated data.

## Soil Moisture Labelling
- Soil moisture input is always labelled as "Volumetric Water Content (VWC%) — manual estimate".
- Never refer to it as a "sensor reading" or "measurement".
- The UI disclaimer must appear on every page that accepts or displays soil moisture.

## Formula Documentation
- Every engine function must have a JSDoc comment with: formula string, units of all parameters and return value, source reference (FAO-56 chapter/table), and assumptions list.
- Formula trace in recommendations must show all 10 calculation steps.

## TypeScript Rules
- Strict mode on. No `any` types.
- All localStorage reads validated with Zod before use.
- API errors always shown to user with recovery action — never swallowed silently.

## Naming Conventions
- Engine functions: `compute*` prefix (e.g. `computeETc`)
- Store functions: verb-noun (e.g. `saveFarm`, `getFarms`)
- Page components: PascalCase matching route (e.g. `FarmManagement`, `WeatherPage`)
- Types: PascalCase interfaces only; no type aliases for objects

## Build Gate
- `npm run build` must pass after every milestone.
- `npm test` must pass after every milestone.
- Never commit with failing tests.
