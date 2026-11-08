import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getFarms, getActiveFarmId } from '../../store/farmStore'
import { fetchWeatherForecast } from '../../api/openMeteo'
import type { WeatherForecast } from '../../types'
import { formatTemp, formatMm } from '../../utils/formatters'
import { getWeatherIcon, getWeatherDescription } from '../../api/openMeteo'

export function TodaysWeather() {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const farms = getFarms()
    const activeId = getActiveFarmId()
    const farm = farms.find(f => f.id === activeId) ?? farms[0]
    if (!farm) { setError('No farm selected'); return }

    setLoading(true)
    setError(null)
    try {
      const data = await fetchWeatherForecast(farm.latitude, farm.longitude, 1)
      setForecast(data)
    } catch {
      setError('Weather unavailable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const today = forecast?.daily[0]

  return (
    <div className="bg-white border border-[#E0E5DD] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-[#202820]">Today's Weather</p>
        <button
          onClick={load}
          disabled={loading}
          className="p-1 text-[#9AA49A] hover:text-[#24452D] transition-colors disabled:opacity-40"
          aria-label="Refresh weather"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <p className="text-xs text-[#9AA49A] py-6 text-center">{error}</p>
      )}

      {loading && !today && (
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-[#F7F8F5] rounded w-24" />
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-[#F7F8F5] rounded" />
            ))}
          </div>
        </div>
      )}

      {today && (
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-[#202820] tabular-nums">
                  {formatTemp(today.tempMaxC, 'celsius').replace('°C', '')}
                </span>
                <span className="text-base text-[#687168]">°C</span>
              </div>
              <p className="text-xs text-[#687168] mt-0.5">
                {getWeatherDescription(today.dominantWeatherCode)}
              </p>
            </div>
            <span
              className="text-4xl"
              aria-label={getWeatherDescription(today.dominantWeatherCode)}
            >
              {getWeatherIcon(today.dominantWeatherCode)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Rainfall', value: formatMm(today.precipitationMm) },
              { label: 'ET₀', value: formatMm(today.et0Mm) },
              { label: 'Wind', value: `${today.windSpeedAvgKmh} km/h` },
              { label: 'Rain chance', value: `${today.precipProbabilityMax}%` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#F7F8F5] rounded-md px-3 py-2">
                <p className="text-2xs text-[#9AA49A] uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-[#202820] tabular-nums mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
