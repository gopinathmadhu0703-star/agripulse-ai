/**
 * Open-Meteo API Client
 *
 * Geocoding: https://geocoding-api.open-meteo.com/v1/search
 * Weather:   https://api.open-meteo.com/v1/forecast
 *
 * No API key required. Free and open.
 */

import type { GeoLocation, WeatherForecast, DailyWeather } from '../types'

// ── Custom error types ────────────────────────────────────────────────────────

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeocodingError'
  }
}

export class WeatherAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'WeatherAPIError'
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

// ── Geocoding ─────────────────────────────────────────────────────────────────

interface GeocodingApiResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  country_code: string
  admin1?: string
  timezone: string
}

interface GeocodingApiResponse {
  results?: GeocodingApiResult[]
  generationtime_ms: number
}

/**
 * Geocode a location name to lat/lon coordinates.
 * Returns up to 5 candidate results.
 * Throws GeocodingError if no results found.
 * Throws NetworkError on fetch failure.
 */
export async function geocodeLocation(name: string): Promise<GeoLocation[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`

  let response: Response
  try {
    response = await fetch(url)
  } catch (err) {
    throw new NetworkError(
      `Network request failed for geocoding "${name}": ${err instanceof Error ? err.message : String(err)}`
    )
  }

  if (!response.ok) {
    throw new WeatherAPIError(
      `Geocoding API returned ${response.status}: ${response.statusText}`,
      response.status
    )
  }

  const data = (await response.json()) as GeocodingApiResponse

  if (!data.results || data.results.length === 0) {
    throw new GeocodingError(
      `No locations found for "${name}". Try a nearby city or town name.`
    )
  }

  return data.results.map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    admin1: r.admin1,
    timezone: r.timezone,
    displayName: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
  }))
}

// ── Weather Forecast ──────────────────────────────────────────────────────────

interface WeatherApiResponse {
  latitude: number
  longitude: number
  timezone: string
  hourly: {
    time: string[]
    et0_fao_evapotranspiration: number[]
    precipitation: number[]
    precipitation_probability: number[]
    temperature_2m: number[]
    wind_speed_10m: number[]
    weather_code: number[]
  }
}

/**
 * Aggregate hourly values to daily summaries.
 * Each day covers 24 hourly slots.
 */
function aggregateHourlyToDaily(
  data: WeatherApiResponse['hourly'],
  days: number
): DailyWeather[] {
  const result: DailyWeather[] = []

  for (let d = 0; d < days; d++) {
    const start = d * 24
    const end = start + 24

    // Slices for this day
    const et0Slice = data.et0_fao_evapotranspiration.slice(start, end)
    const rainSlice = data.precipitation.slice(start, end)
    const probSlice = data.precipitation_probability.slice(start, end)
    const tempSlice = data.temperature_2m.slice(start, end)
    const windSlice = data.wind_speed_10m.slice(start, end)
    const codeSlice = data.weather_code.slice(start, end)

    if (et0Slice.length === 0) break

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
    const avg = (arr: number[]) => (arr.length > 0 ? sum(arr) / arr.length : 0)
    const max = (arr: number[]) => Math.max(...arr)
    const min = (arr: number[]) => Math.min(...arr)

    // Most frequent weather code for the day
    const codeFreq: Record<number, number> = {}
    for (const c of codeSlice) {
      codeFreq[c] = (codeFreq[c] ?? 0) + 1
    }
    const dominantCode = parseInt(
      Object.entries(codeFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '0'
    )

    // Date: extract YYYY-MM-DD from first slot of the day
    const dateStr = data.time[start]?.slice(0, 10) ?? ''

    result.push({
      date: dateStr,
      et0Mm: Math.round(sum(et0Slice) * 100) / 100,
      precipitationMm: Math.round(sum(rainSlice) * 100) / 100,
      precipProbabilityMax: Math.round(max(probSlice)),
      tempMaxC: Math.round(max(tempSlice) * 10) / 10,
      tempMinC: Math.round(min(tempSlice) * 10) / 10,
      windSpeedAvgKmh: Math.round(avg(windSlice) * 10) / 10,
      dominantWeatherCode: dominantCode,
    })
  }

  return result
}

/**
 * Fetch a 7-day hourly weather forecast and aggregate to daily summaries.
 * Retries once on NetworkError with a 1 s delay.
 * Always includes fetchedAt timestamp.
 * Throws WeatherAPIError on non-200 response.
 * Throws NetworkError if both attempts fail.
 */
export async function fetchWeatherForecast(
  lat: number,
  lon: number,
  days = 7
): Promise<WeatherForecast> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=et0_fao_evapotranspiration,precipitation,precipitation_probability,temperature_2m,wind_speed_10m,weather_code` +
    `&forecast_days=${days}` +
    `&timezone=auto`

  async function attemptFetch(): Promise<Response> {
    try {
      return await fetch(url)
    } catch (err) {
      throw new NetworkError(
        `Weather API network request failed: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  let response: Response
  try {
    response = await attemptFetch()
  } catch {
    // Retry once after 1 s
    await new Promise((r) => setTimeout(r, 1000))
    response = await attemptFetch()
  }

  if (!response.ok) {
    throw new WeatherAPIError(
      `Weather API returned ${response.status}: ${response.statusText}`,
      response.status
    )
  }

  const data = (await response.json()) as WeatherApiResponse

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    daily: aggregateHourlyToDaily(data.hourly, days),
    fetchedAt: new Date().toISOString(),
  }
}

// ── WMO Weather Code utilities ────────────────────────────────────────────────

export function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code <= 2) return 'Mainly clear'
  if (code === 3) return 'Overcast'
  if (code <= 49) return 'Fog'
  if (code <= 59) return 'Drizzle'
  if (code <= 69) return 'Rain'
  if (code <= 79) return 'Snow'
  if (code <= 82) return 'Rain showers'
  if (code <= 84) return 'Snow showers'
  if (code <= 99) return 'Thunderstorm'
  return 'Unknown'
}

export function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code <= 49) return '🌫️'
  if (code <= 59) return '🌦️'
  if (code <= 69) return '🌧️'
  if (code <= 79) return '❄️'
  if (code <= 82) return '🌦️'
  if (code <= 84) return '🌨️'
  if (code <= 99) return '⛈️'
  return '🌡️'
}
