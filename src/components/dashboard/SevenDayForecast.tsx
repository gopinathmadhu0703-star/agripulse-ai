import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { getFarms, getActiveFarmId } from '../../store/farmStore'
import { fetchWeatherForecast } from '../../api/openMeteo'
import { getWeatherIcon, getWeatherDescription } from '../../api/openMeteo'
import { formatDate, formatTemp, formatMm } from '../../utils/formatters'
import type { WeatherForecast } from '../../types'

export function SevenDayForecast() {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const farms = getFarms()
    const activeId = getActiveFarmId()
    const farm = farms.find(f => f.id === activeId) ?? farms[0]
    if (!farm) { setError('No farm'); return }
    setLoading(true); setError(null)
    try {
      const data = await fetchWeatherForecast(farm.latitude, farm.longitude, 7)
      setForecast(data)
    } catch {
      setError('Weather unavailable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="bg-white border border-[#E0E5DD] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-[#202820]">7-Day Forecast</p>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="p-1 text-[#9AA49A] hover:text-[#24452D] transition-colors disabled:opacity-40"
            aria-label="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link to="/weather" className="text-xs text-[#527A45] hover:underline flex items-center gap-1">
            Full forecast <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {error && <p className="text-xs text-[#9AA49A]">{error}</p>}

      {loading && !forecast && (
        <div className="animate-pulse flex gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 h-20 bg-[#F7F8F5] rounded" />
          ))}
        </div>
      )}

      {forecast && (
        <div className="overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {forecast.daily.map((day, i) => (
              <div
                key={day.date}
                className={`flex flex-col items-center px-3 py-2.5 rounded-md min-w-[68px] ${
                  i === 0 ? 'bg-[#EAF0E6] border border-[#C8D9C2]' : 'bg-[#F7F8F5]'
                }`}
              >
                <p className="text-2xs font-semibold text-[#687168] uppercase">
                  {i === 0 ? 'Today' : formatDate(day.date).slice(0, 3)}
                </p>
                <span
                  className="text-xl my-1.5"
                  title={getWeatherDescription(day.dominantWeatherCode)}
                >
                  {getWeatherIcon(day.dominantWeatherCode)}
                </span>
                <p className="text-xs font-semibold text-[#202820]">
                  {formatTemp(day.tempMaxC, 'celsius').replace('°C', '')}°
                </p>
                <p className="text-2xs text-[#9AA49A]">
                  {formatTemp(day.tempMinC, 'celsius').replace('°C', '')}°
                </p>
                {day.precipitationMm > 0 && (
                  <p className="text-2xs text-blue-500 mt-1 tabular-nums">
                    {formatMm(day.precipitationMm)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
