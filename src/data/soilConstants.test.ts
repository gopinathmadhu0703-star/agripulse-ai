import { describe, it, expect } from 'vitest'
import { getSoilConstants, getSoilList } from './soilConstants'

describe('getSoilConstants', () => {
  it('returns correct FC for loamy soil', () => {
    expect(getSoilConstants('loamy').fc).toBe(0.26)
  })
  it('returns correct PWP for loamy soil', () => {
    expect(getSoilConstants('loamy').pwp).toBe(0.10)
  })
  it('PAW = FC - PWP for all soil types', () => {
    const types = ['sandy', 'loamy', 'clay', 'silty'] as const
    for (const t of types) {
      const s = getSoilConstants(t)
      expect(Math.round((s.fc - s.pwp) * 100) / 100).toBe(s.paw)
    }
  })
})

describe('getSoilList', () => {
  it('returns 4 soil types', () => {
    expect(getSoilList()).toHaveLength(4)
  })
})
