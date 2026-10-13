import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RecommendationRecord, IrrigationEvent, Farm } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { formatDateTime, formatVolume, formatMm } from '../utils/formatters'
import { exportToCSV } from '../utils/csvExport'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface HistoryPageProps {
  recommendations: RecommendationRecord[]
  events: IrrigationEvent[]
  farms: Farm[]
}

type Tab = 'recommendations' | 'events' | 'analytics'

const ACTION_BADGE: Record<string, 'info' | 'success' | 'warning'> = {
  irrigate: 'info',
  wait: 'success',
  'collect-reading': 'warning',
}

export function HistoryPage({ recommendations, events, farms }: HistoryPageProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('recommendations')

  function getFarmName(farmId: string) {
    return farms.find((f) => f.id === farmId)?.name ?? farmId
  }

  function exportRecommendations() {
    const rows = recommendations.map((r) => ({
      date: formatDateTime(r.createdAt),
      farm: r.farmName,
      action: r.recommendation.action,
      et0_mm: r.recommendation.et0DailyMm,
      kc: r.recommendation.kcUsed,
      etc_mm_day: r.recommendation.etcDailyMm,
      effective_rain_mm: r.recommendation.effectiveRainMm,
      soil_buffer_mm: r.recommendation.soilBufferMm,
      net_demand_mm: r.recommendation.netDemandMm,
      irrigation_volume_L: r.recommendation.irrigationVolumeLiters,
      horizon_days: r.input.horizonDays,
      soil_vwc_pct: r.input.soilMoistureVwcPct ?? 'not provided',
    }))
    exportToCSV(rows, 'agripulse_recommendations.csv')
  }

  function exportEvents() {
    const rows = events.map((e) => ({
      date: e.date,
      farm: getFarmName(e.farmId),
      actual_volume_L: e.actualVolumeLiters,
      notes: e.notes,
      recorded_at: formatDateTime(e.recordedAt),
    }))
    exportToCSV(rows, 'agripulse_irrigation_events.csv')
  }

  const chartData = recommendations
    .slice(-20)
    .map((r) => ({
      date: formatDateTime(r.createdAt).split(',')[0] ?? '',
      etcMm: r.recommendation.etcDailyMm,
      rainMm: r.recommendation.effectiveRainMm,
      netDemand: Math.max(0, r.recommendation.netDemandMm),
    }))

  const TABS: { key: Tab; label: string }[] = [
    { key: 'recommendations', label: `${t('history.recommendation')} (${recommendations.length})` },
    { key: 'events', label: `${t('advisor.title')} (${events.length})` },
    { key: 'analytics', label: t('history.title') },
  ]

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-lg p-1 flex-wrap">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={[
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === tabItem.key
                ? 'bg-white shadow-sm text-stone-800'
                : 'text-stone-500 hover:text-stone-700',
            ].join(' ')}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Recommendations tab */}
      {tab === 'recommendations' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={exportRecommendations}
              disabled={recommendations.length === 0}
            >
              ↓ {t('common.exportCsv')}
            </Button>
          </div>
          {recommendations.length === 0 ? (
            <EmptyState icon="💧" message={t('history.noRecords')} />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-xs text-stone-600 uppercase">
                  <tr>
                    <th className="text-left px-4 py-2.5">{t('history.date')}</th>
                    <th className="text-left px-4 py-2.5">{t('history.farm')}</th>
                    <th className="text-left px-4 py-2.5">{t('history.action')}</th>
                    <th className="text-right px-4 py-2.5">ETc</th>
                    <th className="text-right px-4 py-2.5">Net</th>
                    <th className="text-right px-4 py-2.5">{t('history.volume')}</th>
                    <th className="text-right px-4 py-2.5">Days</th>
                  </tr>
                </thead>
                <tbody>
                  {[...recommendations].reverse().map((r) => (
                    <tr key={r.id} className="border-t border-stone-100 hover:bg-stone-50">
                      <td className="px-4 py-2.5 text-stone-500 whitespace-nowrap">
                        {formatDateTime(r.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 text-stone-700">{r.farmName}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={ACTION_BADGE[r.recommendation.action] ?? 'neutral'} size="sm">
                          {t(`advisor.action.${r.recommendation.action}` as Parameters<typeof t>[0])}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-stone-600">
                        {formatMm(r.recommendation.etcDailyMm)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-stone-600">
                        {formatMm(r.recommendation.netDemandMm)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-stone-700 font-medium">
                        {r.recommendation.action === 'irrigate'
                          ? formatVolume(r.recommendation.irrigationVolumeLiters)
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-stone-500">
                        {r.input.horizonDays}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Events tab */}
      {tab === 'events' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={exportEvents}
              disabled={events.length === 0}
            >
              ↓ {t('common.exportCsv')}
            </Button>
          </div>
          {events.length === 0 ? (
            <EmptyState icon="📋" message={t('history.noRecords')} />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-xs text-stone-600 uppercase">
                  <tr>
                    <th className="text-left px-4 py-2.5">{t('history.date')}</th>
                    <th className="text-left px-4 py-2.5">{t('history.farm')}</th>
                    <th className="text-right px-4 py-2.5">{t('history.volume')}</th>
                    <th className="text-left px-4 py-2.5">{t('planner.notes')}</th>
                    <th className="text-left px-4 py-2.5">Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {[...events].reverse().map((e) => (
                    <tr key={e.id} className="border-t border-stone-100 hover:bg-stone-50">
                      <td className="px-4 py-2.5 text-stone-500">{e.date}</td>
                      <td className="px-4 py-2.5 text-stone-700">{getFarmName(e.farmId)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-stone-800">
                        {formatVolume(e.actualVolumeLiters)}
                      </td>
                      <td className="px-4 py-2.5 text-stone-500 text-xs">{e.notes || '—'}</td>
                      <td className="px-4 py-2.5 text-stone-400 text-xs whitespace-nowrap">
                        {formatDateTime(e.recordedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Analytics tab */}
      {tab === 'analytics' && (
        <div className="space-y-5">
          {chartData.length === 0 ? (
            <EmptyState icon="📈" message={t('history.noRecords')} />
          ) : (
            <>
              <Card header="ETc Trend (last 20 recommendations)">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit=" mm" />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)} mm`]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="etcMm"
                      name="ETc (mm/day)"
                      stroke="#2D6A4F"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card header={`${t('weather.forecast')} Rain vs Net`}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit=" mm" />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)} mm`]} />
                    <Legend />
                    <Bar dataKey="rainMm" name={`${t('weather.precipitation')} (mm)`} fill="#52B788" />
                    <Bar dataKey="netDemand" name="Net Demand (mm)" fill="#2D6A4F" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <Card>
      <div className="text-center py-10 text-stone-500">
        <p className="text-3xl mb-3" aria-hidden>{icon}</p>
        <p className="text-sm">{message}</p>
      </div>
    </Card>
  )
}
