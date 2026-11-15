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

const LOCAL_DATA_OWNER_KEY = 'agripulse_local_data_owner'

/**
 * Keep browser-cached farmer data scoped to exactly one signed-in account.
 * A cache without an owner marker is treated as untrusted and discarded.
 */
export function prepareLocalDataForUser(userId: string): void {
  if (!userId) return
  const currentOwner = localStorage.getItem(LOCAL_DATA_OWNER_KEY)
  if (currentOwner !== userId) {
    clearAllData()
    localStorage.setItem(LOCAL_DATA_OWNER_KEY, userId)
  }
}

/** Clear every AgriPulse data cache while preserving the Supabase auth session key. */
export function clearAllData(): void {
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i)
    if (key?.startsWith('agripulse_') && key !== 'agripulse_auth') {
      localStorage.removeItem(key)
    }
  }
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
