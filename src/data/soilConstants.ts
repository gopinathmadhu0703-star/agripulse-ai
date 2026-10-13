/**
 * Soil Hydraulic Constants
 *
 * Source: FAO Irrigation and Drainage Paper No. 56
 *   Allen et al. (1998), Table 9 — Soil water characteristics
 *   Also consistent with FAO Soils Bulletin 10 (van Genuchten parameters)
 *
 * FC  — Field Capacity (m³/m³): volumetric water content at −0.033 MPa
 * PWP — Permanent Wilting Point (m³/m³): water content at −1.5 MPa
 * PAW — Plant-Available Water = FC − PWP (m³/m³, dimensionless)
 *
 * These are representative mid-range values for each textural class.
 * Actual values vary by soil structure, organic matter content, and depth.
 */

import type { SoilType } from '../types'

export interface SoilConstants {
  label: string
  fc: number    // m³/m³ — field capacity
  pwp: number   // m³/m³ — permanent wilting point
  paw: number   // m³/m³ — plant-available water (fc − pwp)
}

const SOIL_TABLE: Record<SoilType, SoilConstants> = {
  sandy: {
    label: 'Sandy',
    fc: 0.10,
    pwp: 0.04,
    paw: 0.06,
  },
  loamy: {
    label: 'Loamy',
    fc: 0.26,
    pwp: 0.10,
    paw: 0.16,
  },
  clay: {
    label: 'Clay',
    fc: 0.36,
    pwp: 0.18,
    paw: 0.18,
  },
  silty: {
    label: 'Silty',
    fc: 0.30,
    pwp: 0.12,
    paw: 0.18,
  },
}

export function getSoilConstants(soilType: SoilType): SoilConstants {
  return SOIL_TABLE[soilType]
}

export function getSoilList(): Array<{ value: SoilType; label: string }> {
  return (Object.entries(SOIL_TABLE) as [SoilType, SoilConstants][]).map(
    ([value, data]) => ({ value, label: data.label })
  )
}

export { SOIL_TABLE }
