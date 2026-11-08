import type { DailyWeather, TemperatureUnit } from '../types'
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
        'rounded-lg border p-3.5 flex flex-col gap-2 bg-white',
        isToday ? 'border-[#527A45] ring-1 ring-[#EAF0E6]' : 'border-[#E0E5DD]',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#687168] uppercase tracking-wide">
          {isToday ? 'Today' : formatDate(day.date)}
        </p>
        {isToday && (
          <span className="text-2xs bg-[#EAF0E6] text-[#24452D] px-1.5 py-0.5 rounded font-medium">
            Today
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span
          className="text-2xl"
          title={getWeatherDescription(day.dominantWeatherCode)}
          aria-label={getWeatherDescription(day.dominantWeatherCode)}
        >
          {getWeatherIcon(day.dominantWeatherCode)}
        </span>
        <div className="text-right">
          <p className="text-sm font-bold text-[#202820]">{formatTemp(day.tempMaxC, unit)}</p>
          <p className="text-xs text-[#9AA49A]">{formatTemp(day.tempMinC, unit)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#E0E5DD]">
        <Metric label="Rain" value={formatMm(day.precipitationMm)} />
        <Metric label="ET₀" value={formatMm(day.et0Mm)} />
        <Metric label="Wind" value={`${day.windSpeedAvgKmh} km/h`} />
        <Metric label="Rain%" value={`${day.precipProbabilityMax}%`} />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xs text-[#9AA49A]">{label}</p>
      <p className="text-xs font-medium text-[#202820] tabular-nums">{value}</p>
    </div>
  )
}
