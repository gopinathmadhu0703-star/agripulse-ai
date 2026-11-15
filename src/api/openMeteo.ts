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
  daily: {
    time: string[]
    et0_fao_evapotranspiration: number[]
    precipitation_sum: number[]
    precipitation_probability_max: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    wind_speed_10m_max: number[]
    weather_code: number[]
  }
}

/**
 * Map Open-Meteo's calendar-day aggregates into the app's weather model.
 * Using the API's daily endpoint avoids treating a partial first forecast day
 * as a full 24-hour day when a request is made after midnight.
 */
function mapDailyWeather(data: WeatherApiResponse['daily']): DailyWeather[] {
  if (!data || !Array.isArray(data.time)) {
    throw new WeatherAPIError('Weather API returned an invalid daily forecast structure.')
  }

  const fields = [
    data.et0_fao_evapotranspiration,
    data.precipitation_sum,
    data.precipitation_probability_max,
    data.temperature_2m_max,
    data.temperature_2m_min,
    data.wind_speed_10m_max,
    data.weather_code,
  ]
  const expectedLength = data.time.length

  if (expectedLength === 0 || fields.some((values) => !Array.isArray(values) || values.length !== expectedLength)) {
    throw new WeatherAPIError('Weather API returned incomplete daily forecast data.')
  }

  return data.time.map((date, index) => {
    const values = fields.map((items) => items[index])
    if (!values.every((value) => Number.isFinite(value))) {
      throw new WeatherAPIError(`Weather API returned invalid forecast values for ${date}.`)
    }

    const [
      et0Mm,
      precipitationMm,
      precipProbabilityMax,
      tempMaxC,
      tempMinC,
      windSpeedMaxKmh,
      weatherCode,
    ] = values

    if (
      typeof date !== 'string' ||
      date.length !== 10 ||
      tempMaxC < tempMinC ||
      weatherCode < 0 ||
      weatherCode > 99 ||
      et0Mm < 0 ||
      precipitationMm < 0 ||
      precipProbabilityMax < 0 ||
      precipProbabilityMax > 100 ||
      windSpeedMaxKmh < 0
    ) {
      throw new WeatherAPIError(`Weather API returned out-of-range forecast values for ${date}.`)
    }

    return {
      date,
      et0Mm: Math.round(et0Mm * 100) / 100,
      precipitationMm: Math.round(precipitationMm * 100) / 100,
      precipProbabilityMax: Math.round(precipProbabilityMax),
      tempMaxC: Math.round(tempMaxC * 10) / 10,
      tempMinC: Math.round(tempMinC * 10) / 10,
      windSpeedMaxKmh: Math.round(windSpeedMaxKmh * 10) / 10,
      dominantWeatherCode: Math.round(weatherCode),
    }
  })
}

/**
 * Fetch calendar-day weather summaries from Open-Meteo.
 * Retries once on network failure and validates the returned daily series.
 */
export async function fetchWeatherForecast(
  lat: number,
  lon: number,
  days = 7
): Promise<WeatherForecast> {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new WeatherAPIError('Farm coordinates are invalid.')
  }
  if (!Number.isInteger(days) || days < 1 || days > 16) {
    throw new WeatherAPIError('Forecast length must be between 1 and 16 days.')
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=et0_fao_evapotranspiration,precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,weather_code` +
    `&forecast_days=${days}` +
    `&timezone=auto&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm`

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
    await new Promise((resolve) => setTimeout(resolve, 1000))
    response = await attemptFetch()
  }

  if (!response.ok) {
    throw new WeatherAPIError(
      `Weather API returned ${response.status}: ${response.statusText}`,
      response.status
    )
  }

  let data: WeatherApiResponse
  try {
    data = (await response.json()) as WeatherApiResponse
  } catch {
    throw new WeatherAPIError('Weather API returned an unreadable response.')
  }

  if (
    !data ||
    !Number.isFinite(data.latitude) ||
    !Number.isFinite(data.longitude) ||
    typeof data.timezone !== 'string' ||
    !data.daily
  ) {
    throw new WeatherAPIError('Weather API response is missing required location or daily forecast data.')
  }

  const daily = mapDailyWeather(data.daily)
  if (daily.length !== days) {
    throw new WeatherAPIError(`Weather API returned ${daily.length} of ${days} requested forecast days.`)
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    daily,
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
