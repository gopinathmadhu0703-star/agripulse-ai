import { getRecommendations } from '../../store/historyStore'
import { getEvents } from '../../store/irrigationStore'
import { formatDateTime } from '../../utils/formatters'

export function RecentActivity() {
  const recommendations = getRecommendations()
  const events = getEvents()

  type Item = { time: string; label: string; type: 'rec' | 'event' }

  const items: Item[] = [
    ...recommendations.slice(-3).map(r => ({
      time: r.createdAt,
      label: `Recommendation: ${r.recommendation.action === 'irrigate' ? 'Irrigate' : r.recommendation.action === 'wait' ? 'Wait' : 'Collect reading'} — ${r.farmName}`,
      type: 'rec' as const,
    })),
    ...events.slice(-3).map(e => ({
      time: e.recordedAt,
      label: `Irrigation recorded: ${e.actualVolumeLiters.toLocaleString()} L`,
      type: 'event' as const,
    })),
  ]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 6)

  if (items.length === 0) {
    return (
      <div className="bg-white border border-[#E0E5DD] rounded-lg p-5">
        <p className="text-sm font-semibold text-[#202820] mb-3">Recent Activity</p>
        <p className="text-sm text-[#9AA49A]">No activity recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#E0E5DD] rounded-lg p-5">
      <p className="text-sm font-semibold text-[#202820] mb-3">Recent Activity</p>
      <div className="space-y-0">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 py-2.5 ${i < items.length - 1 ? 'border-b border-[#F7F8F5]' : ''}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
              item.type === 'rec' ? 'bg-[#527A45]' : 'bg-blue-400'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#202820] truncate">{item.label}</p>
              <p className="text-xs text-[#9AA49A] mt-0.5">{formatDateTime(item.time)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
