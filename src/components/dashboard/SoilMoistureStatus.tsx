import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { getRecommendations } from '../../store/historyStore'

export function SoilMoistureStatus() {
  const history = getRecommendations()
  const latest = history.length > 0 ? history[history.length - 1] : null

  const vwc = latest?.input.soilMoistureVwcPct
  const ageHours = latest?.input.soilReadingAgeHours

  return (
    <div className="bg-white border border-[#E0E5DD] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-[#202820]">Soil Moisture</p>
        <span className="text-xs text-[#9AA49A]">Manual VWC estimate</span>
      </div>

      {vwc != null ? (
        <div className="space-y-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold text-[#202820] tabular-nums">{vwc.toFixed(0)}</span>
            <span className="text-sm text-[#687168]">% VWC</span>
          </div>
          {/* Moisture bar */}
          <div>
            <div className="h-2 bg-[#F7F8F5] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#527A45] transition-all"
                style={{ width: `${Math.min(vwc, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-2xs text-[#9AA49A] mt-1">
              <span>0%</span>
              <span>Field capacity ~30–40%</span>
              <span>100%</span>
            </div>
          </div>
          {ageHours != null && (
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md ${
              ageHours > 48 ? 'bg-amber-50 text-amber-700' : 'bg-[#EAF0E6] text-[#527A45]'
            }`}>
              {ageHours > 48 && <AlertTriangle size={12} />}
              Reading age: {ageHours < 1 ? 'Just now' : `${Math.round(ageHours)}h ago`}
              {ageHours > 48 && ' — consider a fresh estimate'}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F7F8F5] border border-[#E0E5DD] flex items-center justify-center mx-auto">
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-[#202820] font-medium">No reading available</p>
            <p className="text-xs text-[#9AA49A] mt-0.5">
              Run the Irrigation Advisor to enter a soil moisture estimate.
            </p>
          </div>
          <Link
            to="/advisor"
            className="inline-flex items-center gap-1 text-sm text-[#24452D] font-medium hover:underline"
          >
            Open Advisor <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  )
}
