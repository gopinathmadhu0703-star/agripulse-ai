import { useTranslation } from 'react-i18next'
import { RefreshCw, MapPin } from 'lucide-react'
import { DashboardLayout } from '../components/DashboardLayout'
import type { Farm, WeatherForecast, TemperatureUnit } from '../types'
import { WeatherCard } from '../components/WeatherCard'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { SkeletonCard } from '../components/ui/Skeleton'
import { timeAgo } from '../utils/formatters'

interface WeatherPageProps {
  activeFarm: Farm | undefined
  forecast: WeatherForecast | undefined
  loading: boolean
  error: string | undefined
  onRefresh: () => void
  temperatureUnit: TemperatureUnit
}

export function WeatherPage({ activeFarm, forecast, loading, error, onRefresh, temperatureUnit }: WeatherPageProps) {
  const { t } = useTranslation()

  if (!activeFarm) {
    return (
      <DashboardLayout title={t('weather.title')} subtitle={t('weather.subtitle')}>
        <div className="max-w-md mx-auto py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#EAF0E6] flex items-center justify-center mx-auto mb-3">
            <MapPin size={18} className="text-[#527A45]" />
          </div>
          <p className="text-sm font-medium text-[#202820] mb-1">{t('weather.noFarmSelected')}</p>
          <p className="text-xs text-[#9AA49A] mb-4">{t('farms.noFarms')}</p>
          <Button href="/farms" variant="primary" size="sm">
            {t('farms.addFarm')}
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title={t('weather.title')}
      subtitle={activeFarm.locationDisplayName}
      actions={
        <Button variant="secondary" size="sm" onClick={onRefresh} loading={loading} disabled={loading}>
          <RefreshCw size={13} />
          {t('common.refresh')}
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Location metadata row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#687168]">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {activeFarm.latitude.toFixed(4)}°, {activeFarm.longitude.toFixed(4)}°
          </span>
          {forecast && (
            <span>Updated {timeAgo(forecast.fetchedAt)}</span>
          )}
        </div>

        {error && !loading && (
          <Alert variant="error" title={t('common.error')}>
            <div className="space-y-2">
              <p>{error}</p>
              <Button variant="secondary" size="sm" onClick={onRefresh}>{t('common.refresh')}</Button>
            </div>
          </Alert>
        )}

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && forecast && (
          <div className="space-y-5">
            {/* 7-day grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {forecast.daily.map((day, i) => (
                <WeatherCard key={day.date} day={day} unit={temperatureUnit} isToday={i === 0} />
              ))}
            </div>

            {/* ET₀ explanation */}
            <div className="bg-white border border-[#E0E5DD] rounded-lg p-5">
              <p className="text-sm font-semibold text-[#202820] mb-2">About Reference Evapotranspiration (ET₀)</p>
              <p className="text-sm text-[#687168] leading-relaxed">
                ET₀ is the water used by a well-irrigated grass reference surface, provided by
                Open-Meteo using FAO-56 Penman-Monteith equations. Multiply by your crop
                coefficient (Kc) to estimate actual crop water demand: ETc = ET₀ × Kc.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && !forecast && (
          <div className="text-center py-12">
            <p className="text-sm text-[#9AA49A] mb-3">{t('common.noData')}</p>
            <Button variant="secondary" size="sm" onClick={onRefresh}>
              <RefreshCw size={13} /> {t('common.refresh')}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
