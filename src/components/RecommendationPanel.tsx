import type { RecommendationResult } from '../types'
import { Badge } from './ui/Badge'
import { formatVolume, formatMm } from '../utils/formatters'
import { AlertTriangle, CheckCircle2, Droplets, Info } from 'lucide-react'

interface RecommendationPanelProps {
  result: RecommendationResult
}

const ACTION_CONFIG = {
  irrigate: {
    label: 'Irrigate',
    Icon: Droplets,
    badgeVariant: 'info' as const,
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    description: 'Crop water demand exceeds available soil water and forecast rainfall.',
  },
  wait: {
    label: 'Wait',
    Icon: CheckCircle2,
    badgeVariant: 'success' as const,
    borderColor: 'border-[#C8D9C2]',
    bgColor: 'bg-[#EAF0E6]',
    textColor: 'text-[#24452D]',
    description: 'Soil water and forecast rainfall are sufficient. No irrigation needed now.',
  },
  'collect-reading': {
    label: 'Collect Reading',
    Icon: AlertTriangle,
    badgeVariant: 'warning' as const,
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    description: 'Soil moisture data is missing or outdated. Enter an estimate before running the advisor.',
  },
}

export function RecommendationPanel({ result }: RecommendationPanelProps) {
  const cfg = ACTION_CONFIG[result.action]
  const { Icon } = cfg

  return (
    <div
      className={['rounded-lg border p-5', cfg.bgColor, cfg.borderColor].join(' ')}
      aria-live="polite"
      role="region"
      aria-label="Irrigation recommendation"
    >
      <div className="flex items-start gap-3 mb-4">
        <Icon size={18} className={cfg.textColor} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
          </div>
          <p className={`text-sm ${cfg.textColor}`}>{cfg.description}</p>
        </div>
      </div>

      {result.action !== 'collect-reading' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          <Metric label="Net Demand" value={result.netDemandMm > 0 ? formatMm(result.netDemandMm) : '—'} sub="over horizon" />
          {result.action === 'irrigate' && (
            <Metric
              label="Volume"
              value={formatVolume(result.irrigationVolumeLiters)}
              sub="estimated"
              highlight
            />
          )}
          <Metric label="ETc/day" value={formatMm(result.etcDailyMm)} sub="crop water use" />
          <Metric label="Eff. Rain" value={formatMm(result.effectiveRainMm)} sub="forecast" />
          <Metric label="Soil Buffer" value={formatMm(result.soilBufferMm)} sub="available" />
        </div>
      )}

      {result.action === 'collect-reading' && (
        <div className="mt-1 p-3 rounded-md bg-amber-100 border border-amber-200">
          <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
            <Info size={12} /> Not Claimed
          </p>
          <p className="text-xs text-amber-700">
            This app does not have access to real soil sensors. Please measure or estimate the
            current volumetric water content (VWC%) of your field before running the advisor.
          </p>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="mt-3 space-y-1">
          {result.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-1.5 border border-amber-100 flex items-start gap-1.5">
              <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}

      <p className="text-xs text-[#9AA49A] mt-3">
        Generated {new Date(result.generatedAt).toLocaleString()}
      </p>
    </div>
  )
}

function Metric({ label, value, sub, highlight = false }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className={['rounded px-3 py-2', highlight ? 'bg-white border border-blue-200' : 'bg-white/60'].join(' ')}>
      <p className="text-2xs text-[#9AA49A] uppercase tracking-wide">{label}</p>
      <p className={['text-sm font-semibold mt-0.5', highlight ? 'text-blue-700' : 'text-[#202820]'].join(' ')}>
        {value}
      </p>
      <p className="text-2xs text-[#9AA49A]">{sub}</p>
    </div>
  )
}
