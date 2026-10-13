import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '../components/DashboardLayout'
import type { Farm, WeatherForecast } from '../types'
import type { TemperatureUnit } from '../types'
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

export function WeatherPage({
  activeFarm,
  forecast,
  loading,
  error,
  onRefresh,
  temperatureUnit,
}: WeatherPageProps) {
  const { t } = useTranslation()

  if (!activeFarm) {
    return (
      <DashboardLayout
        title={t('weather.title')}
        subtitle={t('weather.subtitle')}
      >
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
            <span className="text-3xl">🌍</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('weather.noFarmSelected')}
          </h3>
          <p className="text-gray-500 mb-6">
            {t('farms.noFarms')}
          </p>
          <Button href="/farms" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {t('nav.farms')}
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title={t('weather.title')}
      subtitle={t('weather.subtitle')}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeFarm.locationDisplayName}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{activeFarm.latitude.toFixed(4)}°, {activeFarm.longitude.toFixed(4)}°</span>
                </div>
                {forecast && (
                  <div className="flex items-center gap-2">
                    <span>🕒</span>
                    <span>{t('weather.lastUpdated')} {timeAgo(forecast.fetchedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={onRefresh}
              loading={loading}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <span className="text-lg">⟳</span>
              {t('common.refresh')}
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && !loading && (
          <Alert variant="error" title={t('common.error')}>
            <div className="space-y-3">
              <p>{error}</p>
              <Button variant="secondary" size="sm" onClick={onRefresh}>
                {t('common.refresh')}
              </Button>
            </div>
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Forecast cards */}
        {!loading && forecast && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              {forecast.daily.map((day, i) => (
                <WeatherCard
                  key={day.date}
                  day={day}
                  unit={temperatureUnit}
                  isToday={i === 0}
                />
              ))}
            </div>

            {/* ET₀ note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl text-blue-600">ℹ️</span>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">
                    {t('weather.et0')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    ET₀ is the water used by a well-irrigated grass reference surface,
                    provided by the Open-Meteo model using FAO-56 Penman-Monteith equations.
                    Multiply by your crop coefficient (Kc) to estimate actual water demand (ETc = ET₀ × Kc).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !forecast && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
              <span className="text-3xl">☁️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('common.noData')}
            </h3>
            <p className="text-gray-500 mb-6">
              {t('weather.noFarmSelected')}
            </p>
            <Button variant="secondary" onClick={onRefresh} className="flex items-center gap-2 mx-auto">
              <span>⟳</span>
              {t('common.refresh')}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
