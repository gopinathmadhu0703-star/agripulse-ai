/**
 * Crop Coefficients (Kc) and Root Depths
 *
 * Source: FAO Irrigation and Drainage Paper No. 56
 *   Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998)
 *   Table 12 — Single (time-averaged) crop coefficients Kc
 *   Table 22 — Root depths
 *
 * Growth stages:
 *   initial — from planting to ~10% ground cover
 *   mid     — from rapid development through full cover
 *   end     — from start of maturity to harvest
 *
 * Kc values are for sub-humid climates (RH_min ≈ 45%, u₂ ≈ 2 m/s).
 * Adjustments for local wind and humidity are not applied in this MVP.
 */

import type { CropType, GrowthStage } from '../types'

export interface CropData {
  label: string          // Human-readable name
  kc: Record<GrowthStage, number>   // dimensionless
  rootDepthMm: number    // mm — representative mid-season root depth
}

const CROP_TABLE: Record<CropType, CropData> = {
  wheat: {
    label: 'Wheat',
    kc: { initial: 0.30, mid: 1.15, end: 0.25 },
    rootDepthMm: 900,
  },
  maize: {
    label: 'Maize (Corn)',
    kc: { initial: 0.30, mid: 1.20, end: 0.35 },
    rootDepthMm: 600,
  },
  rice: {
    label: 'Rice (paddy)',
    kc: { initial: 1.05, mid: 1.20, end: 0.75 },
    rootDepthMm: 500,
  },
  tomato: {
    label: 'Tomato',
    kc: { initial: 0.40, mid: 1.15, end: 0.70 },
    rootDepthMm: 700,
  },
  potato: {
    label: 'Potato',
    kc: { initial: 0.45, mid: 1.15, end: 0.75 },
    rootDepthMm: 500,
  },
  soybean: {
    label: 'Soybean',
    kc: { initial: 0.40, mid: 1.15, end: 0.50 },
    rootDepthMm: 600,
  },
  cotton: {
    label: 'Cotton',
    kc: { initial: 0.35, mid: 1.15, end: 0.50 },
    rootDepthMm: 1000,
  },
  sugarcane: {
    label: 'Sugarcane',
    kc: { initial: 0.40, mid: 1.25, end: 0.75 },
    rootDepthMm: 1200,
  },
}

export function getCropList(): Array<{ value: CropType; label: string }> {
  return (Object.entries(CROP_TABLE) as [CropType, CropData][]).map(
    ([value, data]) => ({ value, label: data.label })
  )
}

export function getKc(crop: CropType, stage: GrowthStage): number {
  return CROP_TABLE[crop].kc[stage]
}

/**
 * Effective root depth for the selected growth stage.
 * Sugarcane uses AquaCrop's published effective-root-zone range:
 * minimum 0.30 m and maximum 1.80 m. Initial stage maps to the minimum;
 * established mid/end stages map to the maximum.
 * Other crops retain their representative lookup depth pending calibration.
 */
export function getRootDepthMm(crop: CropType, stage: GrowthStage = 'mid'): number {
  if (crop === 'sugarcane') return stage === 'initial' ? 300 : 1800
  return CROP_TABLE[crop].rootDepthMm
}

/**
 * Fraction of total available water that may be depleted before irrigation.
 * Sugarcane p=0.60 is based on published sugarcane scheduling guidance.
 * Other crops use a disclosed generic 0.50 fallback pending crop-specific calibration.
 */
export function getDepletionFraction(crop: CropType): number {
  return crop === 'sugarcane' ? 0.60 : 0.50
}

export function getCropLabel(crop: CropType): string {
  return CROP_TABLE[crop].label
}

export { CROP_TABLE }
