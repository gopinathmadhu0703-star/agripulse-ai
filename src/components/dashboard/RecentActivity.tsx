interface ActivityItem {
  id: number
  icon: string
  title: string
  time: string
  type: 'warning' | 'info' | 'success'
}

const activities: ActivityItem[] = [
  {
    id: 1,
    icon: '⚠️',
    title: 'Soil reading needed',
    time: 'Just now',
    type: 'warning',
  },
  {
    id: 2,
    icon: '🔄',
    title: 'Weather data updated',
    time: '2 hours ago',
    type: 'info',
  },
  {
    id: 3,
    icon: '✅',
    title: 'Farm created',
    time: 'Yesterday',
    type: 'success',
  },
  {
    id: 4,
    icon: '📊',
    title: 'Recommendation generated',
    time: 'Oct 10',
    type: 'info',
  },
]

const typeColors = {
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-emerald-50 text-emerald-700',
}

export function RecentActivity() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[activity.type]}`}>
              <span className="text-lg">{activity.icon}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 mb-0.5">{activity.title}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}