/**
 * settingsStore.ts
 *
 * Primary: Supabase `user_settings`.
 * Fallback: localStorage.
 */
import { z } from 'zod'
import type { AppSettings } from '../types'
import { dbGetSettings, dbSaveSettings } from '../lib/db/settings'
import { isDbAvailable } from '../lib/db/client'
import { dbGetCurrentUser } from '../lib/db/auth'

const SETTINGS_KEY = 'agripulse_settings'

const SettingsSchema = z.object({
  temperatureUnit:    z.enum(['celsius','fahrenheit']),
  defaultHorizonDays: z.union([z.literal(1),z.literal(2),z.literal(3)]),
  notificationsEnabled: z.object({
    rainAlert:    z.boolean(),
    staleReading: z.boolean(),
    taskDue:      z.boolean(),
  }),
  onboardingCompleted:       z.boolean(),
  dismissedNotificationIds:  z.array(z.string()),
})

const DEFAULT_SETTINGS: AppSettings = {
  temperatureUnit:    'celsius',
  defaultHorizonDays: 2,
  notificationsEnabled: {
    rainAlert:    true,
    staleReading: true,
    taskDue:      true,
  },
  onboardingCompleted:       false,
  dismissedNotificationIds:  [],
}

// ── localStorage helpers ──────────────────────────────────────────────────────

function lsGetSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return SettingsSchema.parse(JSON.parse(raw)) as AppSettings
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function lsSaveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getSettings(): AppSettings {
  return lsGetSettings()
}

export function saveSettings(partial: Partial<AppSettings>): void {
  const current = lsGetSettings()
  const updated = { ...current, ...partial }
  lsSaveSettings(updated)

  if (isDbAvailable()) {
    dbGetCurrentUser().then(user => {
      if (user) dbSaveSettings(user.id, partial).catch(console.error)
    })
  }
}

export function completeOnboarding(): void {
  saveSettings({ onboardingCompleted: true })
}

export function dismissNotification(id: string): void {
  const settings = lsGetSettings()
  if (!settings.dismissedNotificationIds.includes(id)) {
    saveSettings({ dismissedNotificationIds: [...settings.dismissedNotificationIds, id] })
  }
}

export function clearAllData(): void {
  const keys = [
    'agripulse_farms','agripulse_active_farm_id',
    'agripulse_tasks','agripulse_events',
    'agripulse_history','agripulse_settings',
  ]
  keys.forEach(k => localStorage.removeItem(k))
}

// ── DB sync ───────────────────────────────────────────────────────────────────

export async function syncSettingsFromDb(): Promise<void> {
  if (!isDbAvailable()) return
  const user = await dbGetCurrentUser()
  if (!user) return
  try {
    const dbSettings = await dbGetSettings(user.id)
    if (dbSettings) lsSaveSettings(dbSettings)
  } catch (e) {
    console.warn('[settingsStore] DB sync failed:', e)
  }
}
