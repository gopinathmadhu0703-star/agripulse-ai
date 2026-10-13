import type {
  Farm,
  RecommendationRecord,
  IrrigationTask,
  WeatherForecast,
  NotificationItem,
} from '../types'
import { generateId } from '../store/farmStore'

const RAIN_PROB_THRESHOLD = 60    // %
const STALE_HOURS = 48            // hours
const TASK_DUE_HOURS = 24         // hours

export function generateNotifications(
  farms: Farm[],
  history: RecommendationRecord[],
  tasks: IrrigationTask[],
  forecasts: Record<string, WeatherForecast>
): NotificationItem[] {
  const notifications: NotificationItem[] = []
  const now = Date.now()

  for (const farm of farms) {
    const forecast = forecasts[farm.id]

    // Rain alert: next 24h precipitation probability > threshold
    if (forecast) {
      const todayAndTomorrow = forecast.daily.slice(0, 2)
      const maxProb = Math.max(...todayAndTomorrow.map((d) => d.precipProbabilityMax))
      if (maxProb >= RAIN_PROB_THRESHOLD) {
        notifications.push({
          id: `rain-${farm.id}-${forecast.daily[0]?.date ?? 'today'}`,
          type: 'rain-alert',
          title: 'Rain forecast',
          message: `${farm.name}: ${maxProb}% chance of rain in the next 48 hours. Consider delaying irrigation.`,
          farmId: farm.id,
          createdAt: new Date().toISOString(),
          dismissed: false,
        })
      }
    }

    // Stale reading: last recommendation > 48h ago
    const farmHistory = history
      .filter((r) => r.farmId === farm.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    if (farmHistory.length > 0) {
      const lastRec = farmHistory[0]!
      const ageH = (now - new Date(lastRec.createdAt).getTime()) / 3_600_000
      if (ageH > STALE_HOURS) {
        notifications.push({
          id: `stale-${farm.id}-${lastRec.id}`,
          type: 'stale-reading',
          title: 'Recommendation may be outdated',
          message: `${farm.name}: Last irrigation check was ${Math.floor(ageH)} hours ago. Consider running the advisor again.`,
          farmId: farm.id,
          createdAt: new Date().toISOString(),
          dismissed: false,
        })
      }
    }
  }

  // Task reminders: tasks due within 24h
  for (const task of tasks) {
    if (task.status === 'completed') continue
    const dueMs = new Date(task.scheduledDate).getTime() + 24 * 3600000 // end of scheduled day
    const hoursUntil = (dueMs - now) / 3_600_000
    if (hoursUntil >= 0 && hoursUntil <= TASK_DUE_HOURS) {
      const farm = farms.find((f) => f.id === task.farmId)
      notifications.push({
        id: `task-${task.id}`,
        type: 'task-due',
        title: 'Irrigation task due',
        message: `${farm?.name ?? 'Farm'}: Irrigation task due on ${task.scheduledDate} (${Math.round(task.estimatedVolumeLiters).toLocaleString()} L estimated).`,
        farmId: task.farmId,
        createdAt: new Date().toISOString(),
        dismissed: false,
      })
    }
  }

  // Deduplicate by id (prevent exact duplicates on multiple calls)
  const seen = new Set<string>()
  return notifications.filter((n) => {
    if (seen.has(n.id)) return false
    seen.add(n.id)
    return true
  })
}

export function createInfoNotification(message: string): NotificationItem {
  return {
    id: generateId(),
    type: 'info',
    title: 'Info',
    message,
    createdAt: new Date().toISOString(),
    dismissed: false,
  }
}
