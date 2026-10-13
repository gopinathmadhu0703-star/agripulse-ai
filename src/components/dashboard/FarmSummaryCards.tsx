interface SummaryCard {
  icon: string
  label: string
  value: string
}

const summaryData: SummaryCard[] = [
  {
    icon: '🏠',
    label: 'Active Farm',
    value: 'gopi — Rice (Paddy)',
  },
  {
    icon: '📏',
    label: 'Field Area',
    value: '3 ha — Flood Irrigation',
  },
  {
    icon: '🌱',
    label: 'Soil Type',
    value: 'Clay — High water holding',
  },
  {
    icon: '📈',
    label: 'Growth Stage',
    value: 'End — Kc: 1.05',
  },
]

export function FarmSummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {summaryData.map((item, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">{item.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500 mb-1">{item.label}</p>
              <p className="text-base font-semibold text-gray-900 truncate">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}