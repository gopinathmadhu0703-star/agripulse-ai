import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Droplets, Loader2 } from 'lucide-react'
import type { Farm, WeatherForecast, RecommendationResult } from '../types'
import { DashboardLayout } from '../components/DashboardLayout'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { RecommendationPanel } from '../components/RecommendationPanel'
import { ExplainabilityPanel } from '../components/ExplainabilityPanel'
import { generateRecommendation } from '../engine/recommendationEngine'
import { fetchWeatherForecast, NetworkError, WeatherAPIError, getWeatherIcon, getWeatherDescription } from '../api/openMeteo'
import type { IrrigationInput } from '../types'
import { getCropLabel } from '../data/cropCoefficients'
import { formatMm } from '../utils/formatters'

interface IrrigationAdvisorProps {
  activeFarm: Farm | undefined
  onSaveRecommendation: (result: RecommendationResult, input: IrrigationInput) => void
  onForecastFetched: (forecast: WeatherForecast) => void
}

export function IrrigationAdvisor({ activeFarm, onSaveRecommendation, onForecastFetched }: IrrigationAdvisorProps) {
  const { t } = useTranslation()
  const [soilMoistureStr, setSoilMoistureStr] = useState('')
  const [readingAgeStr, setReadingAgeStr] = useState('')
  const [horizonDays, setHorizonDays] = useState<'1' | '2' | '3'>('2')
  const [skipSoilMoisture, setSkipSoilMoisture] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [result, setResult] = useState<RecommendationResult | undefined>()
  const [inputUsed, setInputUsed] = useState<IrrigationInput | undefined>()
  const [soilError, setSoilError] = useState<string | undefined>()
  const [weatherPreview, setWeatherPreview] = useState<WeatherForecast | undefined>()

  const HORIZON_OPTIONS = [
    { value: '1', label: t('settings.horizonDays.1') },
    { value: '2', label: t('settings.horizonDays.2') },
    { value: '3', label: t('settings.horizonDays.3') },
  ]

  if (!activeFarm) {
    return (
      <DashboardLayout title={t('advisor.title')} subtitle={t('advisor.subtitle')}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-[#EAF0E6] flex items-center justify-center mb-3">
            <Droplets size={20} className="text-[#527A45]" />
          </div>
          <p className="text-sm font-medium text-[#202820]">{t('advisor.noFarmSelected')}</p>
          <p className="text-xs text-[#9AA49A] mt-1">{t('farms.noFarms')}</p>
        </div>
      </DashboardLayout>
    )
  }

  function validate(): boolean {
    setSoilError(undefined)
    if (!skipSoilMoisture && soilMoistureStr !== '') {
      const v = parseFloat(soilMoistureStr)
      if (isNaN(v) || v < 0 || v > 100) {
        setSoilError('VWC% must be a number between 0 and 100')
        return false
      }
    }
    return true
  }

  async function handleRun() {
    if (!activeFarm) return
    if (!validate()) return

    setLoading(true)
    setError(undefined)
    setResult(undefined)

    try {
      const forecast = await fetchWeatherForecast(activeFarm.latitude, activeFarm.longitude, 7)
      onForecastFetched(forecast)
      setWeatherPreview(forecast)

      const soilMoistureVwcPct = skipSoilMoisture || soilMoistureStr === '' ? undefined : parseFloat(soilMoistureStr)
      const soilReadingAgeHours = readingAgeStr !== '' ? parseFloat(readingAgeStr) : undefined

      const input: IrrigationInput = {
        farm: activeFarm,
        soilMoistureVwcPct,
        soilReadingAgeHours,
        horizonDays: parseInt(horizonDays) as 1 | 2 | 3,
      }

      const recommendation = generateRecommendation(input, forecast)
      setResult(recommendation)
      setInputUsed(input)
      onSaveRecommendation(recommendation, input)
    } catch (err) {
      if (err instanceof NetworkError) setError('Network error — check your connection and try again.')
      else if (err instanceof WeatherAPIError) setError(`Weather API error: ${err.message}`)
      else setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const today = weatherPreview?.daily[0]

  return (
    <DashboardLayout title={t('advisor.title')} subtitle={t('advisor.subtitle')}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
      {/* LEFT: Farm + inputs */}
      <div className="space-y-4">
        {/* Farm summary */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#202820]">{activeFarm.name}</p>
            <span className="text-xs text-[#9AA49A]">{activeFarm.locationDisplayName}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Crop', value: getCropLabel(activeFarm.crop) },
              { label: 'Stage', value: activeFarm.growthStage },
              { label: 'Area', value: `${activeFarm.fieldAreaHa} ha` },
              { label: 'Soil', value: activeFarm.soilType },
              { label: 'Method', value: activeFarm.irrigationMethod },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#F7F8F5] rounded px-3 py-1.5">
                <p className="text-2xs text-[#9AA49A] uppercase tracking-wide">{label}</p>
                <p className="text-xs font-medium text-[#202820] capitalize mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Soil moisture */}
        <Card header="Soil Moisture">
          <div className="space-y-3">
            <Alert variant="info">
              <span className="font-semibold">Manual estimate required.</span> Enter current
              soil VWC%. Leave blank to request a fresh reading reminder.
            </Alert>

            {!skipSoilMoisture && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Soil VWC (%)"
                  type="number"
                  value={soilMoistureStr}
                  onChange={e => setSoilMoistureStr(e.target.value)}
                  min={0} max={100} step={1}
                  placeholder="e.g. 18"
                  error={soilError}
                  helperText="% of soil volume occupied by water"
                />
                <Input
                  label={t('advisor.readingAge')}
                  type="number"
                  value={readingAgeStr}
                  onChange={e => setReadingAgeStr(e.target.value)}
                  min={0} step={1}
                  placeholder="e.g. 24"
                  helperText="Hours since estimate"
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-[#687168] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipSoilMoisture}
                onChange={e => setSkipSoilMoisture(e.target.checked)}
                className="rounded border-[#E0E5DD]"
              />
              {t('advisor.action.collect-reading')}
            </label>
          </div>
        </Card>

        {/* Horizon */}
        <Card header={t('advisor.horizon')}>
          <Select
            label={t('advisor.horizon')}
            options={HORIZON_OPTIONS}
            value={horizonDays}
            onChange={e => setHorizonDays(e.target.value as '1' | '2' | '3')}
          />
        </Card>

        <Button
          variant="primary"
          size="lg"
          onClick={handleRun}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" /> Fetching weather &amp; calculating…</>
          ) : (
            <><Droplets size={14} /> {t('advisor.calculate')}</>
          )}
        </Button>

        {error && <Alert variant="error" title={t('common.error')}>{error}</Alert>}
      </div>

      {/* RIGHT: Weather preview + result */}
      <div className="space-y-4">
        {/* Weather preview */}
        {today && (
          <Card header="Current Weather">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-[#202820] tabular-nums">
                    {today.tempMaxC.toFixed(1)}
                  </span>
                  <span className="text-sm text-[#687168]">°C</span>
                </div>
                <p className="text-xs text-[#687168]">{getWeatherDescription(today.dominantWeatherCode)}</p>
              </div>
              <span className="text-3xl" aria-label={getWeatherDescription(today.dominantWeatherCode)}>
                {getWeatherIcon(today.dominantWeatherCode)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: 'Rain', value: formatMm(today.precipitationMm) },
                { label: 'ET₀', value: formatMm(today.et0Mm) },
                { label: 'Wind', value: `${today.windSpeedAvgKmh} km/h` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#F7F8F5] rounded px-2 py-1.5">
                  <p className="text-2xs text-[#9AA49A]">{label}</p>
                  <p className="text-xs font-semibold text-[#202820] tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!today && !loading && (
          <Card>
            <div className="flex items-center gap-2 text-[#9AA49A] text-sm">
              <Droplets size={16} />
              <span>Weather data will appear here after running the advisor.</span>
            </div>
          </Card>
        )}

        {loading && (
          <Card>
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-[#F7F8F5] rounded w-24" />
              <div className="h-4 bg-[#F7F8F5] rounded w-40" />
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-[#F7F8F5] rounded" />)}
              </div>
            </div>
          </Card>
        )}

        {/* Recommendation result */}
        {result && inputUsed && (
          <>
            <RecommendationPanel result={result} />
            <ExplainabilityPanel result={result} />
          </>
        )}

        <p className="text-xs text-[#9AA49A]">{t('advisor.disclaimer')}</p>
      </div>
      </div>
    </DashboardLayout>
  )
}
