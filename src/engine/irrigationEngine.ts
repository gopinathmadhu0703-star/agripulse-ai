/**
 * Irrigation Calculation Engine
 *
 * All functions are pure (no side effects, no API calls).
 * Every formula is dimensionally consistent and documented.
 *
 * Primary reference:
 *   FAO Irrigation and Drainage Paper No. 56
 *   Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998)
 *   "Crop Evapotranspiration — Guidelines for computing crop water requirements"
 */

import type { SoilType, CropType } from '../types'
import { getKc, getRootDepthMm } from '../data/cropCoefficients'
import { getSoilConstants } from '../data/soilConstants'

// ── Step 1: Daily ET₀ from hourly Open-Meteo data ────────────────────────────

/**
 * Sum hourly ET₀ values to a daily total.
 *
 * Formula:  ET₀_daily (mm/day) = Σ et0_hourly (mm/hr) for 24 hours
 * Source:   Open-Meteo `et0_fao_evapotranspiration` field
 *           (FAO-56 Penman-Monteith, computed server-side)
 * Units:    Input: mm/hr per slot  →  Output: mm/day
 *
 * @param hourlyET0 Array of 24 hourly ET₀ values in mm
 * @returns Daily ET₀ in mm/day
 */
export function computeDailyET0(hourlyET0: number[]): number {
  if (hourlyET0.length === 0) return 0
  const total = hourlyET0.reduce((sum, v) => sum + Math.max(0, v), 0)
  return Math.round(total * 100) / 100
}

// ── Step 2: Crop Evapotranspiration ──────────────────────────────────────────

/**
 * Compute crop evapotranspiration (ETc) for a given day.
 *
 * Formula:  ETc (mm/day) = ET₀ (mm/day) × Kc (dimensionless)
 * Source:   FAO-56 Equation 56, Table 12
 * Units:    mm/day × dimensionless = mm/day
 *
 * Assumption: single crop coefficient Kc is used (not dual Kc).
 *             Kc values are for sub-humid conditions (RH_min ≈ 45%, u₂ ≈ 2 m/s).
 *
 * @param et0Daily  Reference ET₀ in mm/day
 * @param kc        Crop coefficient (dimensionless, from FAO-56 Table 12)
 * @returns         ETc in mm/day
 */
export function computeETc(et0Daily: number, kc: number): number {
  return Math.round(et0Daily * kc * 100) / 100
}

// ── Step 3: Effective Rainfall ────────────────────────────────────────────────

/**
 * Estimate effective rainfall from forecast total precipitation.
 *
 * Formula:  EffectiveRain (mm) = totalRain (mm) × 0.80
 * Source:   FAO-56 simplified method for small rainfall events (< 40 mm/day)
 * Units:    mm × dimensionless = mm
 *
 * Assumption: 80% efficiency factor is a conservative estimate suitable
 *             for rainfall events < 40 mm/day. For heavy rainfall the
 *             USDA SCS method would be more accurate (not implemented here).
 *
 * @param totalRainMm  Total forecast precipitation over the horizon in mm
 * @returns            Effective rainfall in mm
 */
export function computeEffectiveRain(totalRainMm: number): number {
  return Math.round(Math.max(0, totalRainMm) * 0.80 * 100) / 100
}

// ── Step 4: Soil Water Buffer ─────────────────────────────────────────────────

/**
 * Estimate the current plant-available water in the root zone.
 *
 * This uses the user's manual VWC estimate (Volumetric Water Content %)
 * which represents the fraction of soil volume occupied by water.
 *
 * Formula:
 *   θ (m³/m³)           = soilMoistureVwcPct / 100
 *   AvailableWater (mm)  = clamp(θ − PWP, 0, FC − PWP) × rootDepth_mm
 *
 * Dimensional analysis:
 *   (m³/m³ − m³/m³) × mm = mm  ✓
 *
 * Where:
 *   θ       — current VWC from user manual estimate
 *   PWP     — Permanent Wilting Point (m³/m³), from soil type lookup
 *   FC      — Field Capacity (m³/m³), from soil type lookup
 *   FC−PWP  — Plant-Available Water capacity (PAW, dimensionless)
 *   clamp   — ensures result ≥ 0 and ≤ total PAW × rootDepth
 *
 * Source:
 *   FAO-56 Chapter 3, Eq. 87; soil constants from FAO-56 Table 9
 *
 * IMPORTANT LIMITATIONS:
 *   - Assumes uniform moisture distribution throughout root zone
 *   - VWC% is a manual estimate, NOT a sensor reading
 *   - Does not account for spatial variability within the field
 *   - Root depth is a representative value for the crop/stage, not measured
 *
 * @param soilMoistureVwcPct  Volumetric Water Content % (0–100), manual estimate
 * @param soilType            Soil textural class
 * @param crop                Crop type (for root depth lookup)
 * @returns                   Estimated plant-available water in root zone (mm)
 */
export function computeSoilBuffer(
  soilMoistureVwcPct: number,
  soilType: SoilType,
  crop: CropType
): number {
  const { fc, pwp } = getSoilConstants(soilType)
  const rootDepthMm = getRootDepthMm(crop)

  const theta = Math.min(Math.max(soilMoistureVwcPct / 100, 0), 1)
  const paw = fc - pwp  // Plant-Available Water capacity (m³/m³)

  // Available water above PWP, clamped to [0, PAW] range
  const availableFraction = Math.min(Math.max(theta - pwp, 0), paw)

  const bufferMm = availableFraction * rootDepthMm
  return Math.round(bufferMm * 100) / 100
}

// ── Step 5: Net Irrigation Demand ─────────────────────────────────────────────

/**
 * Compute net irrigation demand over the forecast horizon.
 *
 * Formula:
 *   NetDemand (mm) = (ETc_daily × horizonDays) − EffectiveRain − SoilBuffer
 *
 * Units:
 *   (mm/day × days) − mm − mm = mm  ✓
 *
 * A negative result means existing soil water + rain covers crop demand.
 * The irrigation volume function applies max(0, ...) to handle this.
 *
 * @param etcDaily          Crop ET in mm/day
 * @param horizonDays       Planning horizon (1–3 days)
 * @param effectiveRainMm   Effective rainfall over horizon in mm
 * @param soilBufferMm      Estimated available soil water in mm
 * @returns                 Net demand in mm (may be negative)
 */
export function computeNetDemand(
  etcDaily: number,
  horizonDays: number,
  effectiveRainMm: number,
  soilBufferMm: number
): number {
  const totalDemand = etcDaily * horizonDays
  const net = totalDemand - effectiveRainMm - soilBufferMm
  return Math.round(net * 100) / 100
}

// ── Step 6: Irrigation Volume ─────────────────────────────────────────────────

/**
 * Convert net irrigation demand (mm) to irrigation volume (litres).
 *
 * Formula:
 *   IrrigationVolume (L) = max(0, netDemand_mm) × fieldArea_m²
 *
 * Dimensional analysis:
 *   1 mm over 1 m² = 1 litre  (by definition: 0.001 m × 1 m² = 0.001 m³ = 1 L)
 *   mm × m² = L  ✓
 *
 * Where:
 *   fieldArea_m² = fieldArea_ha × 10,000
 *
 * @param netDemandMm   Net irrigation demand in mm (negative values → 0 volume)
 * @param fieldAreaHa   Field area in hectares
 * @returns             Required irrigation volume in litres
 */
export function computeIrrigationVolumeLiters(
  netDemandMm: number,
  fieldAreaHa: number
): number {
  const fieldAreaM2 = fieldAreaHa * 10000
  const volume = Math.max(0, netDemandMm) * fieldAreaM2
  return Math.round(volume)
}

// ── Convenience: compute all steps for a given crop + soil + forecast ─────────

export interface EngineInputs {
  crop: CropType
  growthStage: import('../types').GrowthStage
  soilType: SoilType
  fieldAreaHa: number
  soilMoistureVwcPct: number
  horizonDays: 1 | 2 | 3
  dailyET0Mm: number      // from Open-Meteo daily summary
  totalRainMm: number     // sum of precipitation over horizon (mm)
}

export interface EngineOutputs {
  kcUsed: number
  etcDailyMm: number
  effectiveRainMm: number
  soilBufferMm: number
  netDemandMm: number
  irrigationVolumeLiters: number
}

export function runEngine(inputs: EngineInputs): EngineOutputs {
  const kc = getKc(inputs.crop, inputs.growthStage)
  const etcDaily = computeETc(inputs.dailyET0Mm, kc)
  const effectiveRain = computeEffectiveRain(inputs.totalRainMm)
  const soilBuffer = computeSoilBuffer(
    inputs.soilMoistureVwcPct,
    inputs.soilType,
    inputs.crop
  )
  const netDemand = computeNetDemand(
    etcDaily,
    inputs.horizonDays,
    effectiveRain,
    soilBuffer
  )
  const irrigationVolume = computeIrrigationVolumeLiters(
    netDemand,
    inputs.fieldAreaHa
  )

  return {
    kcUsed: kc,
    etcDailyMm: etcDaily,
    effectiveRainMm: effectiveRain,
    soilBufferMm: soilBuffer,
    netDemandMm: netDemand,
    irrigationVolumeLiters: irrigationVolume,
  }
}
