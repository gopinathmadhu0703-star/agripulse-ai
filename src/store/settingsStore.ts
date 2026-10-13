import { z } from 'zod'
import type { AppSettings } from '../types'

const SETTINGS_KEY = 'agripulse_settings'

const SettingsSchema = z.object({
  temperatureUnit: z.enum(['celsius', 'fahrenheit']),
  defaultHorizonDays: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  notificationsEnabled: z.object({
    rainAlert: z.boolean(),
    staleReading: z.boolean(),
    taskDue: z.boolean(),
  }),
  onboardingCompleted: z.boolean(),
  dismissedNotificationIds: z.array(z.string()),
})

const DEFAULT_SETTINGS: AppSettings = {
  temperatureUnit: 'celsius',
  defaultHorizonDays: 2,
  notificationsEnabled: {
    rainAlert: true,
    staleReading: true,
    taskDue: true,
  },
  onboardingCompleted: false,
  dismissedNotificationIds: [],
}

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return SettingsSchema.parse(JSON.parse(raw)) as AppSettings
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const current = getSettings()
  const updated = { ...current, ...settings }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
}

export function completeOnboarding(): void {
  saveSettings({ onboardingCompleted: true })
}

export function dismissNotification(id: string): void {
  const settings = getSettings()
  if (!settings.dismissedNotificationIds.includes(id)) {
    saveSettings({
      dismissedNotificationIds: [...settings.dismissedNotificationIds, id],
    })
  }
}

export function clearAllData(): void {
  const keys = [
    'agripulse_farms',
    'agripulse_active_farm_id',
    'agripulse_tasks',
    'agripulse_events',
    'agripulse_history',
    'agripulse_settings',
  ]
  keys.forEach((k) => localStorage.removeItem(k))
}
