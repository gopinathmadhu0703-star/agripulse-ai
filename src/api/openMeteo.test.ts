import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchWeatherForecast, WeatherAPIError } from './openMeteo'

const dailyPayload = {
  time: ['2026-11-15', '2026-11-16'],
  et0_fao_evapotranspiration: [5.2, 4.8],
  precipitation_sum: [1.5, 0],
  precipitation_probability_max: [60, 10],
  temperature_2m_max: [32.4, 33],
  temperature_2m_min: [22.1, 21.8],
  wind_speed_10m_max: [18.5, 20],
  weather_code: [61, 0],
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchWeatherForecast', () => {
  it('requests and maps calendar-day forecast summaries', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        latitude: 12.5,
        longitude: 78.2,
        timezone: 'Asia/Kolkata',
        daily: dailyPayload,
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchWeatherForecast(12.5, 78.2, 2)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string)
    expect(requestedUrl.searchParams.get('daily')).toContain('et0_fao_evapotranspiration')
    expect(requestedUrl.searchParams.has('hourly')).toBe(false)
    expect(result.daily).toHaveLength(2)
    expect(result.daily[0]).toMatchObject({
      date: '2026-11-15',
      et0Mm: 5.2,
      precipitationMm: 1.5,
      precipProbabilityMax: 60,
      tempMaxC: 32.4,
      tempMinC: 22.1,
      windSpeedMaxKmh: 18.5,
      dominantWeatherCode: 61,
    })
  })

  it('rejects invalid farm coordinates before making a request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchWeatherForecast(100, 78, 2)).rejects.toBeInstanceOf(WeatherAPIError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects mismatched daily arrays instead of returning misleading data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        latitude: 12.5,
        longitude: 78.2,
        timezone: 'Asia/Kolkata',
        daily: { ...dailyPayload, precipitation_sum: [1.5] },
      }),
    }))

    await expect(fetchWeatherForecast(12.5, 78.2, 2)).rejects.toBeInstanceOf(WeatherAPIError)
  })

  it('rejects incomplete requested forecast horizons', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        latitude: 12.5,
        longitude: 78.2,
        timezone: 'Asia/Kolkata',
        daily: { ...dailyPayload, time: ['2026-11-15'], et0_fao_evapotranspiration: [5.2], precipitation_sum: [1.5], precipitation_probability_max: [60], temperature_2m_max: [32.4], temperature_2m_min: [22.1], wind_speed_10m_max: [18.5], weather_code: [61] },
      }),
    }))

    await expect(fetchWeatherForecast(12.5, 78.2, 2)).rejects.toBeInstanceOf(WeatherAPIError)
  })
})
