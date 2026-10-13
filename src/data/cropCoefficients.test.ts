import { describe, it, expect } from 'vitest'
import { getKc, getRootDepthMm, getCropList, getCropLabel } from './cropCoefficients'

describe('getKc', () => {
  it('returns correct Kc for maize mid stage', () => {
    expect(getKc('maize', 'mid')).toBe(1.20)
  })
  it('returns correct Kc for wheat initial stage', () => {
    expect(getKc('wheat', 'initial')).toBe(0.30)
  })
  it('returns correct Kc for sugarcane end stage', () => {
    expect(getKc('sugarcane', 'end')).toBe(0.75)
  })
})

describe('getRootDepthMm', () => {
  it('returns 600 mm for maize', () => {
    expect(getRootDepthMm('maize')).toBe(600)
  })
  it('returns 1200 mm for sugarcane', () => {
    expect(getRootDepthMm('sugarcane')).toBe(1200)
  })
})

describe('getCropList', () => {
  it('returns 8 crops', () => {
    expect(getCropList()).toHaveLength(8)
  })
  it('returns objects with value and label', () => {
    const list = getCropList()
    expect(list[0]).toHaveProperty('value')
    expect(list[0]).toHaveProperty('label')
  })
})

describe('getCropLabel', () => {
  it('returns human-readable label for maize', () => {
    expect(getCropLabel('maize')).toBe('Maize (Corn)')
  })
})
