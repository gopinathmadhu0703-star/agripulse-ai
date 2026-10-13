# AgriPulse AI — Architecture Decisions

## ADR-01: Use Open-Meteo ET₀ directly
**Decision:** Use the `et0_fao_evapotranspiration` variable from Open-Meteo rather than reimplementing FAO-56 Penman-Monteith.
**Reason:** Open-Meteo already implements FAO-56 Penman-Monteith server-side using real meteorological data. Reimplementing it from scratch would require solar radiation, psychrometric, and atmospheric data and introduce additional error. Delegating to the model is more accurate and simpler.

## ADR-02: Corrected soil buffer formula (VWC-based)
**Decision:** Accept soil moisture as Volumetric Water Content (VWC%) and compute available water as `clamp(θ − PWP, 0, FC − PWP) × rootDepth_mm`.
**Reason:** An arbitrary percentage cannot be treated as a fraction of plant-available water without knowing whether it is VWC or PAW%. By using VWC directly, we apply the standard soil physics formula. The clamp prevents non-physical results when VWC < PWP (no water available to plants) or VWC > FC (entry point — unlikely in field but possible from user input error).

## ADR-03: localStorage over backend
**Decision:** Use browser localStorage for all persistence.
**Reason:** 3-day deadline, demo scope, no infrastructure cost. All data is stored client-side only. Max 500 recommendation records to prevent quota issues.

## ADR-04: Zod validation on all localStorage reads
**Decision:** Every store read parses with a Zod schema before use and returns a safe default on failure.
**Reason:** localStorage can contain corrupt, truncated, or schema-mismatched data from previous app versions or manual edits. Zod prevents runtime errors from propagating into the UI.

## ADR-05: Single crop coefficient (Kc) — not dual Kc
**Decision:** Use single Kc from FAO-56 Table 12, not the dual Kc approach.
**Reason:** The dual Kc approach (Kcb for transpiration + Ke for soil evaporation) requires daily soil evaporation tracking and a more complex model. For a 3-day MVP with manually entered data, single Kc is appropriate and well-documented. The assumption is clearly stated in the formula trace.

## ADR-06: React Router for navigation
**Decision:** Use `react-router-dom` v6 for client-side routing.
**Reason:** Standard, well-supported, compatible with Vite SPA build. `vercel.json` rewrites handle direct URL access.

## ADR-07: Recharts for analytics
**Decision:** Recharts for charts (LineChart, BarChart).
**Reason:** React-native, composable, good TypeScript types, lightweight. Recharts composes with Tailwind styling.
