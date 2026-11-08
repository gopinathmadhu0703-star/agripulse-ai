import { Link } from 'react-router-dom'
import { ArrowRight, Droplets } from 'lucide-react'
import { getRecommendations } from '../../store/historyStore'

export function IrrigationRecommendation() {
  const history = getRecommendations()
  const latest = history.length > 0 ? history[history.length - 1] : null

  const ACTION_CONFIG = {
    irrigate: {
      label: 'Irrigate',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      bar: 'bg-blue-500',
    },
    wait: {
      label: 'Wait — sufficient moisture',
      color: 'text-emerald-700',
      bg: 'bg-[#EAF0E6]',
      border: 'border-[#C8D9C2]',
      bar: 'bg-[#527A45]',
    },
    'collect-reading': {
      label: 'Collect soil reading first',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      bar: 'bg-amber-500',
    },
  }

  if (!latest) {
    return (
      <div className="bg-white border border-[#E0E5DD] rounded-lg p-5 flex flex-col h-full">
        <p className="text-sm font-semibold text-[#202820] mb-3">Irrigation Status</p>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <div className="w-10 h-10 rounded-full bg-[#EAF0E6] flex items-center justify-center mb-3">
            <Droplets size={18} className="text-[#527A45]" />
          </div>
          <p className="text-sm text-[#687168] mb-3">
            No recommendation yet. Run the Irrigation Advisor to get a recommendation for your active farm.
          </p>
          <Link
            to="/advisor"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#24452D] hover:underline"
          >
            Open Advisor <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    )
  }

  const cfg = ACTION_CONFIG[latest.recommendation.action]

  return (
    <div className="bg-white border border-[#E0E5DD] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-[#202820]">Irrigation Status</p>
        <Link to="/advisor" className="text-xs text-[#527A45] hover:underline flex items-center gap-1">
          Advisor <ArrowRight size={11} />
        </Link>
      </div>

      <div className={`rounded-md border px-4 py-3 mb-4 ${cfg.bg} ${cfg.border}`}>
        <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
        {latest.recommendation.action === 'irrigate' && (
          <p className={`text-xs mt-0.5 ${cfg.color} opacity-80`}>
            Recommended: {(latest.recommendation.irrigationVolumeLiters ?? 0).toLocaleString()} L
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'ETc/day', value: `${latest.recommendation.etcDailyMm.toFixed(1)} mm` },
          { label: 'Net demand', value: `${Math.max(0, latest.recommendation.netDemandMm).toFixed(1)} mm` },
          { label: 'Eff. rain', value: `${latest.recommendation.effectiveRainMm.toFixed(1)} mm` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#F7F8F5] rounded-md px-2 py-2">
            <p className="text-2xs text-[#9AA49A] uppercase tracking-wide">{label}</p>
            <p className="text-xs font-semibold text-[#202820] tabular-nums mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <p className="text-2xs text-[#9AA49A] mt-3">
        Based on FAO-56 formulas. Run advisor for updated estimate.
      </p>
    </div>
  )
}
