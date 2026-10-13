import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Farm, WeatherForecast, RecommendationResult } from '../types'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { RecommendationPanel } from '../components/RecommendationPanel'
import { ExplainabilityPanel } from '../components/ExplainabilityPanel'
import { generateRecommendation } from '../engine/recommendationEngine'
import { fetchWeatherForecast, NetworkError, WeatherAPIError } from '../api/openMeteo'
import type { IrrigationInput } from '../types'
import { getCropLabel } from '../data/cropCoefficients'

interface IrrigationAdvisorProps {
  activeFarm: Farm | undefined
  onSaveRecommendation: (result: RecommendationResult, input: IrrigationInput) => void
  onForecastFetched: (forecast: WeatherForecast) => void
}

export function IrrigationAdvisor({
  activeFarm,
  onSaveRecommendation,
  onForecastFetched,
}: IrrigationAdvisorProps) {
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

  const HORIZON_OPTIONS = [
    { value: '1', label: t('settings.horizonDays.1') },
    { value: '2', label: t('settings.horizonDays.2') },
    { value: '3', label: t('settings.horizonDays.3') },
  ]

  if (!activeFarm) {
    return (
      <div className="text-center py-16 text-stone-500">
        <p className="text-4xl mb-3" aria-hidden>💧</p>
        <p className="font-medium text-stone-700">{t('advisor.noFarmSelected')}</p>
        <p className="text-sm mt-1">{t('farms.noFarms')}</p>
      </div>
    )
  }

  function validate(): boolean {
    setSoilError(undefined)
    if (!skipSoilMoisture) {
      const v = parseFloat(soilMoistureStr)
      if (soilMoistureStr === '') { return true }
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

      const soilMoistureVwcPct =
        skipSoilMoisture || soilMoistureStr === ''
          ? undefined
          : parseFloat(soilMoistureStr)

      const soilReadingAgeHours =
        readingAgeStr !== '' ? parseFloat(readingAgeStr) : undefined

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
      if (err instanceof NetworkError) {
        setError('Network error — check your connection and try again.')
      } else if (err instanceof WeatherAPIError) {
        setError(`Weather API error: ${err.message}`)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Farm summary */}
      <Card header={t('farms.title')}>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Info label={t('farms.farmName')} value={activeFarm.name} />
          <Info label={t('farms.location')} value={activeFarm.locationDisplayName} />
          <Info label={t('farms.crop')} value={getCropLabel(activeFarm.crop)} />
          <Info label={t('farms.growthStage')} value={activeFarm.growthStage} />
          <Info label={t('farms.area')} value={`${activeFarm.fieldAreaHa} ha`} />
          <Info label={t('farms.soilType')} value={activeFarm.soilType} />
        </div>
      </Card>

      {/* Soil moisture input */}
      <Card header={t('advisor.soilMoistureInput')}>
        <div className="space-y-4">
          <Alert variant="info">
            <span className="font-semibold">Manual estimate required — not a sensor reading.</span>{' '}
            Enter your current best estimate of the soil VWC%.
            If you don't know it, leave blank to request a fresh reading reminder.
          </Alert>

          {!skipSoilMoisture && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('advisor.soilMoistureInput')}
                type="number"
                value={soilMoistureStr}
                onChange={(e) => setSoilMoistureStr(e.target.value)}
                min={0}
                max={100}
                step={1}
                placeholder="e.g. 18"
                error={soilError}
                helperText="Volumetric Water Content — percentage of soil volume that is water"
              />
              <Input
                label={t('advisor.readingAge')}
                type="number"
                value={readingAgeStr}
                onChange={(e) => setReadingAgeStr(e.target.value)}
                min={0}
                step={1}
                placeholder="e.g. 24"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={skipSoilMoisture}
              onChange={(e) => setSkipSoilMoisture(e.target.checked)}
              className="rounded border-stone-300 text-forest-600"
            />
            {t('advisor.action.collect-reading')}
          </label>
        </div>
      </Card>

      {/* Horizon selector */}
      <Card header={t('advisor.horizon')}>
        <Select
          label={t('advisor.horizon')}
          options={HORIZON_OPTIONS}
          value={horizonDays}
          onChange={(e) => setHorizonDays(e.target.value as '1' | '2' | '3')}
        />
      </Card>

      {/* Run button */}
      <Button
        variant="primary"
        size="lg"
        onClick={handleRun}
        loading={loading}
        className="w-full"
      >
        {loading ? t('common.loading') : `💧 ${t('advisor.calculate')}`}
      </Button>

      {error && <Alert variant="error" title={t('common.error')}>{error}</Alert>}

      {/* Results */}
      {result && inputUsed && (
        <div className="space-y-4">
          <RecommendationPanel result={result} />
          <ExplainabilityPanel result={result} />
        </div>
      )}

      <p className="text-xs text-stone-400">{t('advisor.disclaimer')}</p>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-stone-400">{label}</p>
      <p className="text-sm font-medium text-stone-700 capitalize">{value}</p>
    </div>
  )
}
