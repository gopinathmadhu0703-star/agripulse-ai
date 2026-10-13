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

export function getRootDepthMm(crop: CropType): number {
  return CROP_TABLE[crop].rootDepthMm
}

export function getCropLabel(crop: CropType): string {
  return CROP_TABLE[crop].label
}

export { CROP_TABLE }
