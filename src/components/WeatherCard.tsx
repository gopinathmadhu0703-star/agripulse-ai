
import type { DailyWeather } from '../types'
import type { TemperatureUnit } from '../types'
import { formatDate, formatTemp, formatMm } from '../utils/formatters'
import { getWeatherIcon, getWeatherDescription } from '../api/openMeteo'

interface WeatherCardProps {
  day: DailyWeather
  unit: TemperatureUnit
  isToday?: boolean
}

export function WeatherCard({ day, unit, isToday }: WeatherCardProps) {
  return (
    <div
      className={[
        'bg-white rounded-xl border p-4 flex flex-col gap-2',
        isToday ? 'border-forest-300 ring-1 ring-forest-200' : 'border-stone-200',
      ].join(' ')}
    >
      {/* Date */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
          {isToday ? 'Today' : formatDate(day.date)}
        </p>
        {isToday && (
          <span className="text-xs bg-forest-100 text-forest-700 rounded-full px-2 py-0.5 font-medium">
            Today
          </span>
        )}
      </div>

      {/* Icon + temp */}
      <div className="flex items-center justify-between">
        <span className="text-3xl" title={getWeatherDescription(day.dominantWeatherCode)} aria-label={getWeatherDescription(day.dominantWeatherCode)}>
          {getWeatherIcon(day.dominantWeatherCode)}
        </span>
        <div className="text-right">
          <p className="text-base font-bold text-stone-800">
            {formatTemp(day.tempMaxC, unit)}
          </p>
          <p className="text-xs text-stone-400">
            {formatTemp(day.tempMinC, unit)}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-stone-100">
        <Metric icon="🌧️" label="Rain" value={formatMm(day.precipitationMm)} />
        <Metric icon="💧" label="ET₀" value={formatMm(day.et0Mm)} />
        <Metric icon="💨" label="Wind" value={`${day.windSpeedAvgKmh} km/h`} />
        <Metric icon="🌂" label="Rain %%" value={`${day.precipProbabilityMax}%`} />
      </div>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-stone-400 flex items-center gap-1">
        <span aria-hidden>{icon}</span> {label}
      </p>
      <p className="text-xs font-medium text-stone-700 tabular-nums">{value}</p>
    </div>
  )
}
