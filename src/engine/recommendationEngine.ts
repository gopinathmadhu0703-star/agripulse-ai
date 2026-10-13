/**
 * Recommendation Engine
 *
 * Deterministic rules that combine the irrigation engine outputs with
 * soil reading age and forecast data to produce a typed recommendation.
 *
 * All intermediate values are exposed via a formula trace so the UI can
 * show the user exactly how the recommendation was derived.
 */

import type {
  IrrigationInput,
  WeatherForecast,
  RecommendationResult,
  FormulaStep,
} from '../types'
import {
  computeETc,
  computeEffectiveRain,
  computeSoilBuffer,
  computeNetDemand,
  computeIrrigationVolumeLiters,
} from './irrigationEngine'
import { getKc, getRootDepthMm } from '../data/cropCoefficients'
import { getSoilConstants } from '../data/soilConstants'

const STALE_READING_THRESHOLD_HOURS = 48

/**
 * Generate an irrigation recommendation with a full, human-readable formula trace.
 *
 * Decision rules (applied in order):
 *  1. If soilMoistureVwcPct is undefined → "collect-reading"
 *  2. If soilReadingAgeHours > 48h       → "collect-reading"
 *  3. If netDemand ≤ 0                   → "wait"
 *  4. Otherwise                          → "irrigate"
 */
export function generateRecommendation(
  input: IrrigationInput,
  forecast: WeatherForecast
): RecommendationResult {
  const { farm, soilMoistureVwcPct, soilReadingAgeHours, horizonDays } = input
  const { crop, growthStage, soilType, fieldAreaHa } = farm

  const warnings: string[] = []
  const assumptions: string[] = [
    'Single crop coefficient (Kc) approach used — not dual Kc (FAO-56 Ch. 6).',
    'Kc values are for sub-humid conditions (RH_min ≈ 45%, u₂ ≈ 2 m/s); local adjustment not applied.',
    'Effective rainfall = 80% of forecast precipitation (FAO simplified method for events < 40 mm/day).',
    'Soil moisture distribution is assumed uniform throughout the root zone.',
    'Root depth is a representative mid-season value from FAO-56 Table 22.',
    'Soil hydraulic constants (FC, PWP) are textural-class averages from FAO-56 Table 9.',
    'ET₀ is from Open-Meteo FAO-56 Penman-Monteith model — reflects reference grass surface.',
    'Soil moisture input is a manual volumetric estimate, NOT a sensor reading.',
    'This recommendation is an estimate and does not substitute for professional agronomic advice.',
  ]

  // ── Rule 1 & 2: insufficient soil moisture data ───────────────────────────

  if (soilMoistureVwcPct === undefined || soilMoistureVwcPct === null) {
    warnings.push('Soil moisture not provided. Cannot estimate soil water buffer.')
    return buildResult('collect-reading', input, forecast, 0, 0, 0, 0, 0, 0, [], assumptions, warnings)
  }

  // Validate VWC% range
  if (soilMoistureVwcPct < 0 || soilMoistureVwcPct > 100) {
    warnings.push(`VWC% (${soilMoistureVwcPct}%) is outside valid range (0–100%). Cannot compute soil buffer.`)
    return buildResult('collect-reading', input, forecast, 0, 0, 0, 0, 0, 0, [], assumptions, warnings)
  }

  if (
    soilReadingAgeHours !== undefined &&
    soilReadingAgeHours > STALE_READING_THRESHOLD_HOURS
  ) {
    warnings.push(
      `Soil moisture reading is ${soilReadingAgeHours} hours old (threshold: ${STALE_READING_THRESHOLD_HOURS} h). A fresh estimate is needed for a reliable recommendation.`
    )
    return buildResult('collect-reading', input, forecast, 0, 0, 0, 0, 0, 0, [], assumptions, warnings)
  }

  // ── Compute ET₀: average daily ET₀ across horizon ────────────────────────

  const horizonDaily = forecast.daily.slice(0, horizonDays)

  if (horizonDaily.length === 0) {
    warnings.push('No forecast data available for selected horizon.')
    return buildResult('collect-reading', input, forecast, 0, 0, 0, 0, 0, 0, [], assumptions, warnings)
  }

  const avgET0Daily =
    horizonDaily.reduce((sum, d) => sum + d.et0Mm, 0) / horizonDaily.length
  const totalRainMm = horizonDaily.reduce((sum, d) => sum + d.precipitationMm, 0)

  // ── Run calculations ──────────────────────────────────────────────────────

  const kc = getKc(crop, growthStage)
  const etcDaily = computeETc(avgET0Daily, kc)
  const effectiveRain = computeEffectiveRain(totalRainMm)
  const soilBuffer = computeSoilBuffer(soilMoistureVwcPct, soilType, crop)
  const netDemand = computeNetDemand(etcDaily, horizonDays, effectiveRain, soilBuffer)
  const irrigationVolume = computeIrrigationVolumeLiters(netDemand, fieldAreaHa)

  // ── Additional warnings ───────────────────────────────────────────────────

  if (soilMoistureVwcPct > getSoilConstants(soilType).fc * 100) {
    warnings.push(
      `Entered VWC% (${soilMoistureVwcPct}%) exceeds the field capacity for ${soilType} soil (${(getSoilConstants(soilType).fc * 100).toFixed(0)}%). This may indicate an overestimate.`
    )
  }

  if (totalRainMm > 40) {
    warnings.push(
      `Forecast rainfall (${totalRainMm.toFixed(1)} mm) exceeds 40 mm. The 80% efficiency factor may underestimate effective rainfall — consider the USDA SCS method for heavy rain events.`
    )
  }

  // ── Crop-specific warnings ────────────────────────────────────────────────

  if (crop === 'rice') {
    warnings.push(
      '⚠ Rice (paddy) is a flooded crop with different water management requirements. ' +
      'This tool uses standard FAO-56 Kc values, but actual irrigation practice for flooded rice differs ' +
      'significantly from dryland crops. Consult local extension services for rice-specific advice.'
    )
  }

  // ── Build formula trace ───────────────────────────────────────────────────

  const rootDepthMm = getRootDepthMm(crop)
  const { fc, pwp } = getSoilConstants(soilType)
  const theta = soilMoistureVwcPct / 100
  const availableFraction = Math.min(Math.max(theta - pwp, 0), fc - pwp)

  const formulaTrace: FormulaStep[] = [
    {
      label: 'Average daily ET₀ (Reference Evapotranspiration)',
      formulaStr: 'ET₀ = Σ(daily ET₀) ÷ horizonDays',
      substitution: `= ${horizonDaily.map((d) => d.et0Mm.toFixed(2)).join(' + ')} ÷ ${horizonDays}`,
      result: Math.round(avgET0Daily * 100) / 100,
      unit: 'mm/day',
    },
    {
      label: 'Crop Coefficient (Kc)',
      formulaStr: 'Kc = lookup(crop, growthStage) — FAO-56 Table 12',
      substitution: `= lookup(${crop}, ${growthStage})`,
      result: kc,
      unit: 'dimensionless',
    },
    {
      label: 'Crop Evapotranspiration (ETc)',
      formulaStr: 'ETc = ET₀ × Kc',
      substitution: `= ${avgET0Daily.toFixed(2)} mm/day × ${kc}`,
      result: etcDaily,
      unit: 'mm/day',
    },
    {
      label: 'Total Forecast Precipitation',
      formulaStr: 'Rain = Σ(daily precipitation over horizon)',
      substitution: `= ${horizonDaily.map((d) => d.precipitationMm.toFixed(2)).join(' + ')}`,
      result: Math.round(totalRainMm * 100) / 100,
      unit: 'mm',
    },
    {
      label: 'Effective Rainfall',
      formulaStr: 'EffectiveRain = totalRain × 0.80',
      substitution: `= ${totalRainMm.toFixed(2)} mm × 0.80`,
      result: effectiveRain,
      unit: 'mm',
    },
    {
      label: 'Current VWC (θ)',
      formulaStr: 'θ = soilMoistureVWC% ÷ 100',
      substitution: `= ${soilMoistureVwcPct}% ÷ 100`,
      result: Math.round(theta * 1000) / 1000,
      unit: 'm³/m³',
    },
    {
      label: 'Plant-Available Water (above PWP, clamped)',
      formulaStr: 'AvailFraction = clamp(θ − PWP, 0, FC − PWP)',
      substitution: `= clamp(${theta.toFixed(3)} − ${pwp}, 0, ${fc} − ${pwp}) = clamp(${(theta - pwp).toFixed(3)}, 0, ${(fc - pwp).toFixed(3)})`,
      result: Math.round(availableFraction * 1000) / 1000,
      unit: 'm³/m³',
    },
    {
      label: 'Soil Water Buffer',
      formulaStr: 'SoilBuffer = availFraction × rootDepth',
      substitution: `= ${availableFraction.toFixed(3)} m³/m³ × ${rootDepthMm} mm`,
      result: soilBuffer,
      unit: 'mm',
    },
    {
      label: 'Net Irrigation Demand',
      formulaStr: 'NetDemand = (ETc × horizonDays) − EffectiveRain − SoilBuffer',
      substitution: `= (${etcDaily} mm/day × ${horizonDays} days) − ${effectiveRain} mm − ${soilBuffer} mm`,
      result: netDemand,
      unit: 'mm',
    },
    {
      label: 'Irrigation Volume',
      formulaStr: 'Volume = max(0, NetDemand) × fieldArea_ha × 10,000',
      substitution: `= max(0, ${netDemand} mm) × ${fieldAreaHa} ha × 10,000 m²/ha`,
      result: irrigationVolume,
      unit: 'litres',
    },
  ]

  // ── Decision rules 3 & 4 ──────────────────────────────────────────────────

  const action = netDemand <= 0 ? 'wait' : 'irrigate'

  return buildResult(
    action,
    input,
    forecast,
    avgET0Daily,
    kc,
    etcDaily,
    effectiveRain,
    soilBuffer,
    netDemand,
    formulaTrace,
    assumptions,
    warnings
  )
}

function buildResult(
  action: RecommendationResult['action'],
  input: IrrigationInput,
  _forecast: WeatherForecast,
  et0DailyMm: number,
  kcUsed: number,
  etcDailyMm: number,
  effectiveRainMm: number,
  soilBufferMm: number,
  netDemandMm: number,
  formulaTrace: FormulaStep[],
  assumptions: string[],
  warnings: string[]
): RecommendationResult {
  return {
    action,
    et0DailyMm,
    kcUsed,
    etcDailyMm,
    effectiveRainMm,
    soilBufferMm,
    netDemandMm,
    irrigationVolumeLiters: computeIrrigationVolumeLiters(
      netDemandMm,
      input.farm.fieldAreaHa
    ),
    formulaTrace,
    assumptions,
    warnings,
    generatedAt: new Date().toISOString(),
  }
}
