import { useState } from 'react'
import type { RecommendationResult } from '../types'
import { ChevronDown, FlaskConical } from 'lucide-react'

interface ExplainabilityPanelProps {
  result: RecommendationResult
}

export function ExplainabilityPanel({ result }: ExplainabilityPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-[#E0E5DD] rounded-lg bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-[#202820] hover:bg-[#F7F8F5] transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <FlaskConical size={14} className="text-[#527A45]" />
          How was this calculated?
        </span>
        <ChevronDown
          size={14}
          className={['text-[#9AA49A] transition-transform', open ? 'rotate-180' : ''].join(' ')}
        />
      </button>

      {open && (
      <div className="px-5 pb-5 space-y-5 text-sm border-t border-[#E0E5DD]">
          {/* Formula trace */}
          {result.formulaTrace.length > 0 && (
            <div className="pt-4">
              <h3 className="text-xs font-semibold text-[#202820] mb-2 uppercase tracking-wider">Calculation Steps</h3>
              <div className="overflow-x-auto rounded-md border border-[#E0E5DD]">
                <table className="w-full text-xs">
                  <thead className="bg-[#F7F8F5]">
                    <tr>
                      <th className="ap-th">Step</th>
                      <th className="ap-th">Formula</th>
                      <th className="ap-th">Values</th>
                      <th className="ap-th text-right">Result</th>
                      <th className="ap-th">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.formulaTrace.map((step, i) => (
                      <tr key={i} className="border-t border-[#E0E5DD] hover:bg-[#F7F8F5]">
                        <td className="ap-td font-medium">{step.label}</td>
                        <td className="ap-td font-mono text-[#687168]">{step.formulaStr}</td>
                        <td className="ap-td font-mono text-[#687168]">{step.substitution}</td>
                        <td className="ap-td font-semibold text-right tabular-nums">{step.result.toFixed(3)}</td>
                        <td className="ap-td text-[#9AA49A]">{step.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Assumptions */}
          <div>
            <h3 className="text-xs font-semibold text-[#202820] mb-2 uppercase tracking-wider">Assumptions</h3>
            <ul className="space-y-1 text-[#687168]">
              {result.assumptions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-[#D0DCC9] mt-0.5">—</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="bg-[#F7F8F5] border border-[#E0E5DD] rounded-md px-4 py-3 text-xs text-[#687168]">
            <p className="font-semibold text-[#202820] mb-1">Not Claimed</p>
            <ul className="space-y-0.5 ml-2">
              <li>— Real-time soil moisture sensor data</li>
              <li>— Validated soil-water balance modelling</li>
              <li>— ML/AI inference — all calculations are deterministic FAO-56 formula rules</li>
              <li>— Site-specific Kc calibration</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
