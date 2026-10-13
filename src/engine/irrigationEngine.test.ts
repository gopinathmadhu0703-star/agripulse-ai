import { describe, it, expect } from 'vitest'
import {
  computeDailyET0,
  computeETc,
  computeEffectiveRain,
  computeSoilBuffer,
  computeNetDemand,
  computeIrrigationVolumeLiters,
} from './irrigationEngine'

describe('computeDailyET0', () => {
  it('sums hourly ET0 values', () => {
    // 24 hours of 0.25 mm/hr = 6 mm/day
    const hourly = Array.from({ length: 24 }, () => 0.25)
    expect(computeDailyET0(hourly)).toBe(6)
  })

  it('ignores negative values (clamps to 0)', () => {
    const hourly = [1, -0.5, 2, 0]
    expect(computeDailyET0(hourly)).toBe(3)
  })

  it('returns 0 for empty array', () => {
    expect(computeDailyET0([])).toBe(0)
  })
})

describe('computeETc', () => {
  it('multiplies ET0 by Kc correctly', () => {
    // ET0 = 5.0, Kc = 1.20 → ETc = 6.00
    expect(computeETc(5.0, 1.20)).toBe(6)
  })

  it('handles ET0 = 0', () => {
    expect(computeETc(0, 1.20)).toBe(0)
  })

  it('handles Kc < 1 (initial stage)', () => {
    // ET0 = 4.0, Kc = 0.30 → 1.20
    expect(computeETc(4.0, 0.30)).toBe(1.2)
  })
})

describe('computeEffectiveRain', () => {
  it('applies 80% efficiency factor', () => {
    expect(computeEffectiveRain(10)).toBe(8)
  })

  it('returns 0 for 0 rainfall', () => {
    expect(computeEffectiveRain(0)).toBe(0)
  })

  it('clamps negative rainfall to 0', () => {
    expect(computeEffectiveRain(-5)).toBe(0)
  })

  it('scales correctly for large rainfall', () => {
    expect(computeEffectiveRain(50)).toBe(40)
  })
})

describe('computeSoilBuffer', () => {
  // Loamy soil: FC = 0.26, PWP = 0.10, PAW = 0.16
  // Maize root depth: 600 mm

  it('computes available water correctly at mid-range VWC', () => {
    // θ = 0.18 m³/m³ (18%), loamy soil, maize
    // availFraction = clamp(0.18 - 0.10, 0, 0.16) = 0.08
    // buffer = 0.08 × 600 = 48 mm
    expect(computeSoilBuffer(18, 'loamy', 'maize')).toBe(48)
  })

  it('returns 0 when VWC is at or below PWP', () => {
    // θ = 10% = 0.10 = PWP → available = 0
    expect(computeSoilBuffer(10, 'loamy', 'maize')).toBe(0)
  })

  it('clamps at field capacity (FC)', () => {
    // θ = 40% > FC(26%) for loamy → clamp to PAW = 0.16
    // buffer = 0.16 × 600 = 96 mm
    expect(computeSoilBuffer(40, 'loamy', 'maize')).toBe(96)
  })

  it('returns 0 at 0% VWC', () => {
    expect(computeSoilBuffer(0, 'sandy', 'wheat')).toBe(0)
  })

  it('uses correct root depth for sugarcane (1200 mm)', () => {
    // Sandy: FC=0.10, PWP=0.04, PAW=0.06
    // θ = 7% = 0.07; availFraction = clamp(0.07 - 0.04, 0, 0.06) = 0.03
    // buffer = 0.03 × 1200 = 36 mm
    expect(computeSoilBuffer(7, 'sandy', 'sugarcane')).toBe(36)
  })
})

describe('computeNetDemand', () => {
  it('computes net demand correctly', () => {
    // ETc=5 mm/day × 3 days = 15 mm
    // 15 - 8 (rain) - 4 (soil) = 3 mm
    expect(computeNetDemand(5, 3, 8, 4)).toBe(3)
  })

  it('returns negative when supply exceeds demand', () => {
    // ETc=3 × 2 = 6; 6 - 10 - 5 = -9
    expect(computeNetDemand(3, 2, 10, 5)).toBe(-9)
  })

  it('returns 0 demand when ETc = 0', () => {
    expect(computeNetDemand(0, 3, 5, 10)).toBe(-15)
  })
})

describe('computeIrrigationVolumeLiters', () => {
  it('converts net demand to litres correctly', () => {
    // 10 mm over 1 ha = 10 mm × 10,000 m² = 100,000 L
    expect(computeIrrigationVolumeLiters(10, 1)).toBe(100000)
  })

  it('returns 0 for zero or negative demand', () => {
    expect(computeIrrigationVolumeLiters(0, 2)).toBe(0)
    expect(computeIrrigationVolumeLiters(-5, 2)).toBe(0)
  })

  it('scales with field area', () => {
    // 5 mm over 2.5 ha = 5 × 25,000 = 125,000 L
    expect(computeIrrigationVolumeLiters(5, 2.5)).toBe(125000)
  })

  it('handles fractional demand correctly', () => {
    // 2.5 mm over 0.5 ha = 2.5 × 5,000 = 12,500 L
    expect(computeIrrigationVolumeLiters(2.5, 0.5)).toBe(12500)
  })
})
