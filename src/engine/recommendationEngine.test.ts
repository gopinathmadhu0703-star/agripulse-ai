import { describe, it, expect } from 'vitest'
import { generateRecommendation } from './recommendationEngine'
import type { IrrigationInput, WeatherForecast, Farm } from '../types'

const mockFarm: Farm = {
  id: 'test-farm',
  name: 'Test Farm',
  locationName: 'Bangalore',
  latitude: 12.97,
  longitude: 77.59,
  locationDisplayName: 'Bangalore, Karnataka, India',
  fieldAreaHa: 1,
  crop: 'maize',
  growthStage: 'mid',
  soilType: 'loamy',
  irrigationMethod: 'drip',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
}

// Dry forecast: 6 mm/day ET0, no rain
const dryForecast: WeatherForecast = {
  latitude: 12.97,
  longitude: 77.59,
  timezone: 'Asia/Kolkata',
  daily: Array.from({ length: 7 }, (_, i) => ({
    date: `2026-10-0${i + 1}`,
    et0Mm: 6,
    precipitationMm: 0,
    precipProbabilityMax: 5,
    tempMaxC: 32,
    tempMinC: 22,
    windSpeedAvgKmh: 10,
    dominantWeatherCode: 0,
  })),
  fetchedAt: '2026-10-01T06:00:00.000Z',
}

// Rainy forecast: low ET0, heavy rain
const rainyForecast: WeatherForecast = {
  ...dryForecast,
  daily: Array.from({ length: 7 }, (_, i) => ({
    date: `2026-10-0${i + 1}`,
    et0Mm: 2,
    precipitationMm: 15,
    precipProbabilityMax: 90,
    tempMaxC: 25,
    tempMinC: 18,
    windSpeedAvgKmh: 8,
    dominantWeatherCode: 61,
  })),
}

describe('generateRecommendation', () => {
  describe('collect-reading action', () => {
    it('returns collect-reading when soil moisture is undefined', () => {
      const input: IrrigationInput = {
        farm: mockFarm,
        soilMoistureVwcPct: undefined,
        horizonDays: 2,
      }
      const result = generateRecommendation(input, dryForecast)
      expect(result.action).toBe('collect-reading')
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('returns collect-reading when reading age > 48h', () => {
      const input: IrrigationInput = {
        farm: mockFarm,
        soilMoistureVwcPct: 15,
        soilReadingAgeHours: 72,
        horizonDays: 2,
      }
      const result = generateRecommendation(input, dryForecast)
      expect(result.action).toBe('collect-reading')
      expect(result.warnings[0]).toContain('72 hours old')
    })

    it('does NOT return collect-reading when reading age = 48h exactly', () => {
      const input: IrrigationInput = {
        farm: mockFarm,
        soilMoistureVwcPct: 15,
        soilReadingAgeHours: 48,
        horizonDays: 2,
      }
      const result = generateRecommendation(input, dryForecast)
      // 48h is at the threshold — should not trigger stale
      expect(result.action).not.toBe('collect-reading')
    })
  })

  describe('irrigate action', () => {
    it('returns irrigate when demand is positive and soil is low', () => {
      // Dry forecast, low soil moisture (12% VWC < PWP for loamy is 10% so buffer = 12mm)
      // ETc = 6 × 1.20 = 7.2 mm/day × 2 days = 14.4 mm
      // effectiveRain = 0, soilBuffer = (0.12 - 0.10) × 600 = 12 mm
      // netDemand = 14.4 - 0 - 12 = 2.4 mm > 0 → irrigate
      const input: IrrigationInput = {
        farm: mockFarm,
        soilMoistureVwcPct: 12,
        soilReadingAgeHours: 6,
        horizonDays: 2,
      }
      const result = generateRecommendation(input, dryForecast)
      expect(result.action).toBe('irrigate')
      expect(result.netDemandMm).toBeGreaterThan(0)
      expect(result.irrigationVolumeLiters).toBeGreaterThan(0)
    })

    it('returns positive irrigation volume', () => {
      const input: IrrigationInput = {
        farm: mockFarm,
        soilMoistureVwcPct: 10,
        soilReadingAgeHours: 0,
        horizonDays: 3,
      }
      const result = generateRecommendation(input, dryForecast)
      expect(result.action).toBe('irrigate')
      expect(result.irrigationVolumeLiters).toBeGreaterThan(0)
    })
  })

  describe('wait action', () => {
    it('returns wait when rain + soil buffer covers demand', () => {
      // Rainy forecast: ETc = 2 × 1.20 = 2.4 mm/day × 2 = 4.8 mm demand
      // effectiveRain = 15 × 2 × 0.8 = 24 mm
      // With good soil moisture (20%) → soilBuffer = (0.20 - 0.10) × 600 = 60 mm
      // netDemand = 4.8 - 24 - 60 → very negative → wait
      const input: IrrigationInput = {
        farm: mockFarm,
        soilMoistureVwcPct: 20,
        soilReadingAgeHours: 12,
        horizonDays: 2,
      }
      const result = generateRecommendation(input, rainyForecast)
      expect(result.action).toBe('wait')
      expect(result.netDemandMm).toBeLessThanOrEqual(0)
    })
  })

  describe('formula trace', () => {
    it('includes all required steps when soil data is provided', () => {
      const input: IrrigationInput = {
        farm: mockFarm,
        soilMoistureVwcPct: 15,
        soilReadingAgeHours: 6,
        horizonDays: 2,
      }
      const result = generateRecommendation(input, dryForecast)
      const labels = result.formulaTrace.map((s) => s.label)
      expect(labels).toContain('Average daily ET₀ (Reference Evapotranspiration)')
      expect(labels).toContain('Crop Coefficient (Kc)')
      expect(labels).toContain('Crop Evapotranspiration (ETc)')
      expect(labels).toContain('Effective Rainfall')
      expect(labels).toContain('Soil Water Buffer')
      expect(labels).toContain('Net Irrigation Demand')
      expect(labels).toContain('Irrigation Volume')
    })

    it('has empty formula trace when collect-reading', () => {
      const input: IrrigationInput = {
        farm: mockFarm,
        soilMoistureVwcPct: undefined,
        horizonDays: 2,
      }
      const result = generateRecommendation(input, dryForecast)
      expect(result.formulaTrace).toHaveLength(0)
    })

    it('includes generatedAt as ISO string', () => {
      const input: IrrigationInput = {
        farm: mockFarm,
        soilMoistureVwcPct: 15,
        horizonDays: 1,
      }
      const result = generateRecommendation(input, dryForecast)
      expect(() => new Date(result.generatedAt)).not.toThrow()
      expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })
})
