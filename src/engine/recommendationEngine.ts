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
  computeIrrigationVolumeLiters,
  computeCurrentDepletionMm,
  computeReadilyAvailableWaterMm,
  computeTriggeredNetDemandMm,
  getApplicationEfficiency,
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
    'Sugarcane root depth uses FAO AquaCrop minimum/maximum effective depths mapped approximately to the selected stage; other crops use representative lookup depths.',
    'Soil hydraulic constants (FC, PWP) are generic textural-class averages; actual field values can differ substantially.',
    'ET₀ is from Open-Meteo FAO-56 Penman-Monteith model — reflects reference grass surface.',
    'Soil moisture input is a manual volumetric estimate, NOT a sensor reading.',
    'Application efficiency is an indicative method-level assumption; field performance must be measured locally.',
    'Sugarcane allowable depletion p=0.65 is a scheduling assumption; other crops use generic p=0.50 pending local calibration.',
    'This recommendation is an estimate and does not substitute for professional agronomic advice.',
  ]

  // ── Rule 1 & 2: insufficient soil moisture data ───────────────────────────

  if (soilMoistureVwcPct === undefined || soilMoistureVwcPct === null) {
    warnings.push('Soil moisture not provided. Cannot estimate soil water buffer.')
    return buildResult('collect-reading', input, forecast, 0, 0, 0, 0, 0, 0, [], assumptions, warnings)
  }

  // Validate VWC% range
  if (!Number.isFinite(soilMoistureVwcPct) || soilMoistureVwcPct < 0 || soilMoistureVwcPct > 100) {
    warnings.push(`VWC% (${soilMoistureVwcPct}%) is outside valid range (0–100%). Cannot compute soil buffer.`)
    return buildResult('collect-reading', input, forecast, 0, 0, 0, 0, 0, 0, [], assumptions, warnings)
  }

  if (soilReadingAgeHours !== undefined && (!Number.isFinite(soilReadingAgeHours) || soilReadingAgeHours < 0)) {
    warnings.push('Soil moisture reading age must be a valid non-negative number of hours.')
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

  if (horizonDaily.length !== horizonDays) {
    warnings.push(`Incomplete forecast: expected ${horizonDays} days but received ${horizonDaily.length}. Cannot make a reliable recommendation.`)
    return buildResult('collect-reading', input, forecast, 0, 0, 0, 0, 0, 0, [], assumptions, warnings)
  }

  const hasInvalidForecastValue = horizonDaily.some((day) =>
    !Number.isFinite(day.et0Mm) ||
    day.et0Mm < 0 ||
    !Number.isFinite(day.precipitationMm) ||
    day.precipitationMm < 0
  )
  if (hasInvalidForecastValue) {
    warnings.push('Forecast contains missing or invalid ET₀/rainfall values. Cannot make a reliable recommendation.')
    return buildResult('collect-reading', input, forecast, 0, 0, 0, 0, 0, 0, [], assumptions, warnings)
  }

  const avgET0Daily =
    horizonDaily.reduce((sum, d) => sum + d.et0Mm, 0) / horizonDaily.length
  const totalRainMm = horizonDaily.reduce((sum, d) => sum + d.precipitationMm, 0)

  // ── Run calculations ──────────────────────────────────────────────────────

  const kc = getKc(crop, growthStage)
  const etcDaily = computeETc(avgET0Daily, kc)
  const effectiveRain = computeEffectiveRain(totalRainMm)
  const rootDepthMm = getRootDepthMm(crop, growthStage)
  const currentDepletion = computeCurrentDepletionMm(soilMoistureVwcPct, soilType, crop, growthStage)
  const readilyAvailableWater = computeReadilyAvailableWaterMm(soilType, crop, growthStage)
  const soilBuffer = readilyAvailableWater
  const netDemand = computeTriggeredNetDemandMm(
    currentDepletion,
    etcDaily * horizonDays,
    effectiveRain,
    readilyAvailableWater
  )
  const applicationEfficiency = getApplicationEfficiency(farm.irrigationMethod)
  const irrigationVolume = computeIrrigationVolumeLiters(netDemand, fieldAreaHa, applicationEfficiency)

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

  const { fc, pwp } = getSoilConstants(soilType)
  const theta = soilMoistureVwcPct / 100
  const taw = (fc - pwp) * rootDepthMm

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
      label: 'Current Root-Zone Depletion',
      formulaStr: 'Dr = clamp(FC − θ, 0, FC − PWP) × rootDepth',
      substitution: `= clamp(${fc} − ${theta.toFixed(3)}, 0, ${fc - pwp}) × ${rootDepthMm} mm`,
      result: currentDepletion,
      unit: 'mm',
    },
    {
      label: 'Readily Available Water (RAW)',
      formulaStr: 'RAW = p × TAW',
      substitution: `= ${crop === 'sugarcane' ? 0.65 : 0.50} × ${taw.toFixed(2)} mm`,
      result: soilBuffer,
      unit: 'mm',
    },
    {
      label: 'Net Irrigation Demand',
      formulaStr: 'NetDemand = max(0, Dr + (ETc × days) − EffectiveRain − RAW)',
      substitution: `= max(0, ${currentDepletion} + (${etcDaily} × ${horizonDays}) − ${effectiveRain} − ${soilBuffer})`,
      result: netDemand,
      unit: 'mm',
    },
    {
      label: 'Irrigation Volume',
      formulaStr: 'GrossVolume = NetDemand ÷ applicationEfficiency × fieldArea_ha × 10,000',
      substitution: `= ${netDemand} mm ÷ ${Math.round(applicationEfficiency * 100)}% × ${fieldAreaHa} ha × 10,000 m²/ha`,
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
    warnings,
    applicationEfficiency
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
  warnings: string[],
  applicationEfficiency = 1
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
      input.farm.fieldAreaHa,
      applicationEfficiency
    ),
    applicationEfficiencyPct: Math.round(applicationEfficiency * 100),
    formulaTrace,
    assumptions,
    warnings,
    generatedAt: new Date().toISOString(),
  }
}
