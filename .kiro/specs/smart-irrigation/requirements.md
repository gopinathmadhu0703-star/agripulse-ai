# AgriPulse AI — Requirements

## Functional Requirements

### P0 — Core (must ship)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-01 | User can add a farm with name, location, field area (ha), crop, growth stage, soil type, irrigation method | Farm is persisted; all fields validated; location geocoded to lat/lon |
| FR-02 | App geocodes location name to lat/lon via Open-Meteo geocoding API | Returns top 5 candidates; throws GeocodingError if no results |
| FR-03 | App fetches 7-day hourly ET₀, precipitation, temperature, wind, weather_code from Open-Meteo | Daily aggregates computed correctly; fetchedAt timestamp stored |
| FR-04 | Engine computes ETc, effective rainfall, soil buffer, net demand, irrigation volume — dimensionally consistent | All unit tests pass; formulas documented in JSDoc |
| FR-05 | Recommendation engine returns Irrigate / Wait / Collect Reading with full formula trace | All three actions covered by unit tests; formula trace has 10 steps |
| FR-06 | Dashboard shows active farm summary, today's weather, current recommendation status | Renders with real data; empty states shown when no farm |
| FR-07 | All inputs validated with Zod; API errors shown with retry; loading states everywhere | Validation errors shown inline; no silent failures |
| FR-08 | Unit tests cover all engine functions and recommendation rules | `npm test` passes with zero failures |

### P1 — Full Product

| ID | Requirement |
|----|-------------|
| FR-09 | Multiple farm profiles in localStorage; active farm selectable |
| FR-10 | Irrigation planner: create, complete, delete tasks; record actual volumes |
| FR-11 | History view: recommendation log and irrigation events |
| FR-12 | CSV export of recommendations and events |

### P2 — Polish

| ID | Requirement |
|----|-------------|
| FR-13 | Analytics charts (Recharts): ETc trend, rain vs demand |
| FR-14 | In-app notifications: rain alert, stale reading, upcoming tasks |
| FR-15 | Settings: unit preference, default horizon, reset data |

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | `npm run build` produces zero TypeScript errors |
| NFR-02 | All unit tests pass |
| NFR-03 | Responsive at 375px and 1440px |
| NFR-04 | No invented data — all values from API, engine, or user input |
| NFR-05 | WCAG AA color contrast on all text |

## Not Claimed

- **No real user authentication or cloud accounts.** All data is stored in browser localStorage.
- **No IoT or hardware sensor integration.** Soil moisture is always a manual VWC% estimate, never a sensor reading. The UI labels this explicitly.
- **No trained ML or AI models.** All recommendations are deterministic formula-based rules.
- **No validated soil-water balance model.** Soil buffer is a simplified estimate: available water = clamp(θ − PWP, 0, FC − PWP) × rootDepth. Assumes uniform moisture distribution. Not a validated water balance.
- **No payments or subscriptions.**
- **No multi-language support.** English only.
- **No backend server.** localStorage only.
- **Kc values are not site-calibrated.** They are tabulated FAO-56 values for representative conditions (RH_min ≈ 45%, u₂ ≈ 2 m/s).
