
import type { RecommendationResult } from '../types'
import { Badge } from './ui/Badge'
import { formatVolume, formatMm } from '../utils/formatters'

interface RecommendationPanelProps {
  result: RecommendationResult
}

const ACTION_CONFIG = {
  irrigate: {
    label: 'Irrigate',
    icon: '💧',
    badgeVariant: 'info' as const,
    bgClass: 'bg-blue-50 border-blue-200',
    textClass: 'text-blue-800',
    description: 'Crop water demand exceeds available soil water and forecast rainfall. Irrigation is recommended.',
  },
  wait: {
    label: 'Wait & Recheck',
    icon: '✅',
    badgeVariant: 'success' as const,
    bgClass: 'bg-green-50 border-green-200',
    textClass: 'text-green-800',
    description: 'Soil water buffer and forecast rainfall are sufficient to meet crop demand. No irrigation needed now.',
  },
  'collect-reading': {
    label: 'Collect Fresh Reading',
    icon: '🔍',
    badgeVariant: 'warning' as const,
    bgClass: 'bg-amber-50 border-amber-200',
    textClass: 'text-amber-800',
    description: 'Soil moisture data is missing or outdated. A fresh manual VWC estimate is needed before a reliable recommendation can be made.',
  },
}

export function RecommendationPanel({ result }: RecommendationPanelProps) {
  const config = ACTION_CONFIG[result.action]

  return (
    <div
      className={['rounded-xl border-2 p-5', config.bgClass].join(' ')}
      aria-live="polite"
      role="region"
      aria-label="Irrigation recommendation"
    >
      {/* Action header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl" aria-hidden>{config.icon}</span>
        <div>
          <Badge variant={config.badgeVariant} size="md">
            {config.label}
          </Badge>
          <p className={['text-sm mt-1 font-medium', config.textClass].join(' ')}>
            {config.description}
          </p>
        </div>
      </div>

      {/* Key metrics */}
      {result.action !== 'collect-reading' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          <Metric
            label="Net Demand"
            value={result.netDemandMm > 0 ? formatMm(result.netDemandMm) : '—'}
            sub="over horizon"
          />
          {result.action === 'irrigate' && (
            <Metric
              label="Irrigation Volume"
              value={formatVolume(result.irrigationVolumeLiters)}
              sub="estimated need"
              highlight
            />
          )}
          <Metric
            label="ETc (daily)"
            value={formatMm(result.etcDailyMm)}
            sub="crop water use"
          />
          <Metric
            label="Effective Rain"
            value={formatMm(result.effectiveRainMm)}
            sub="forecast"
          />
          <Metric
            label="Soil Buffer"
            value={formatMm(result.soilBufferMm)}
            sub="available water"
          />
        </div>
      )}

      {/* Collect-reading disclaimer */}
      {result.action === 'collect-reading' && (
        <div className="mt-3 text-sm text-amber-700 bg-amber-100 rounded-lg px-4 py-3">
          <p className="font-semibold mb-1">⚠ Not Claimed</p>
          <p>
            Soil moisture was not provided or the estimate is older than 48 hours.
            This app does not have access to real soil sensors. Please measure or
            re-estimate the current volumetric water content (VWC%) of your field
            before running the advisor.
          </p>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {result.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-1.5 border border-amber-100">
              ⚡ {w}
            </p>
          ))}
        </div>
      )}

      <p className="text-xs text-stone-400 mt-3">
        Generated {new Date(result.generatedAt).toLocaleString()}
      </p>
    </div>
  )
}

function Metric({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string
  sub: string
  highlight?: boolean
}) {
  return (
    <div className={['rounded-lg px-3 py-2.5', highlight ? 'bg-white/70' : 'bg-white/50'].join(' ')}>
      <p className="text-xs text-stone-500 mb-0.5">{label}</p>
      <p className={['text-base font-semibold', highlight ? 'text-blue-700' : 'text-stone-800'].join(' ')}>
        {value}
      </p>
      <p className="text-xs text-stone-400">{sub}</p>
    </div>
  )
}
