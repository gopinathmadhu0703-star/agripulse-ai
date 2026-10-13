import { useState } from 'react'
import type { RecommendationResult } from '../types'

interface ExplainabilityPanelProps {
  result: RecommendationResult
}

export function ExplainabilityPanel({ result }: ExplainabilityPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-stone-200 rounded-lg bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors rounded-lg"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span aria-hidden>🔬</span>
          How was this calculated?
        </span>
        <span aria-hidden className="text-stone-400 transition-transform" style={{ transform: open ? 'rotate(180deg)' : undefined }}>
          ▼
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 text-sm">
          {/* Formula trace table */}
          {result.formulaTrace.length > 0 && (
            <div>
              <h3 className="font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
                <span aria-hidden>📐</span> Calculation Steps
              </h3>
              <div className="overflow-x-auto rounded-lg border border-stone-100">
                <table className="w-full text-xs">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-stone-600">Step</th>
                      <th className="text-left px-3 py-2 font-semibold text-stone-600">Formula</th>
                      <th className="text-left px-3 py-2 font-semibold text-stone-600">Substitution</th>
                      <th className="text-right px-3 py-2 font-semibold text-stone-600">Result</th>
                      <th className="text-left px-3 py-2 font-semibold text-stone-600">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.formulaTrace.map((step, i) => (
                      <tr key={i} className="border-t border-stone-100 hover:bg-stone-50/50">
                        <td className="px-3 py-2 text-stone-700 font-medium">{step.label}</td>
                        <td className="px-3 py-2 text-stone-500 font-mono">{step.formulaStr}</td>
                        <td className="px-3 py-2 text-stone-500 font-mono">{step.substitution}</td>
                        <td className="px-3 py-2 text-stone-800 font-semibold text-right tabular-nums">
                          {step.result.toFixed(3)}
                        </td>
                        <td className="px-3 py-2 text-stone-400">{step.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Assumptions */}
          <div>
            <h3 className="font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
              <span aria-hidden>📋</span> Assumptions
            </h3>
            <ul className="space-y-1 text-stone-500">
              {result.assumptions.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-stone-300 mt-0.5" aria-hidden>•</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div>
              <h3 className="font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                <span aria-hidden>⚡</span> Warnings
              </h3>
              <ul className="space-y-1 text-amber-600">
                {result.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span aria-hidden>•</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-xs text-stone-500">
            <p className="font-semibold text-stone-600 mb-1">⚠ Disclaimer</p>
            <p>
              This is an estimate based on open weather model data (Open-Meteo), published FAO-56
              crop coefficients, and a manually entered soil moisture estimate.
              It is not a validated soil-water balance model. The soil moisture input is not
              a sensor reading. Results should be used as a guide only and do not substitute
              for professional agronomic advice. Verify recommendations against on-farm conditions
              before applying irrigation.
            </p>
            <p className="mt-2 font-semibold text-stone-500">Not Claimed:</p>
            <ul className="mt-1 space-y-0.5 ml-3">
              <li>• Real-time soil moisture sensor data</li>
              <li>• Validated soil-water balance modelling</li>
              <li>• ML/AI inference — all calculations are deterministic formula-based rules</li>
              <li>• Site-specific Kc calibration</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
