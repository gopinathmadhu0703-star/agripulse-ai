/**
 * db/settings.ts
 * Supabase operations for user_settings.
 */
import { supabase, isDbAvailable, dbError } from './client'
import type { AppSettings } from '../../types'

function rowToSettings(r: Record<string, unknown>): AppSettings {
  return {
    temperatureUnit:    r.temperature_unit as AppSettings['temperatureUnit'],
    defaultHorizonDays: r.default_horizon_days as 1 | 2 | 3,
    notificationsEnabled: {
      rainAlert:    r.notif_rain_alert as boolean,
      staleReading: r.notif_stale_reading as boolean,
      taskDue:      r.notif_task_due as boolean,
    },
    onboardingCompleted:       r.onboarding_completed as boolean,
    dismissedNotificationIds:  r.dismissed_notification_ids as string[],
  }
}

export async function dbGetSettings(userId: string): Promise<AppSettings | null> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { data, error } = await supabase!
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw dbError(error.message)
  return data ? rowToSettings(data) : null
}

export async function dbSaveSettings(
  userId: string,
  settings: Partial<AppSettings>,
  language?: string
): Promise<void> {
  if (!isDbAvailable()) throw dbError('DB not configured')

  const patch: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() }

  if (settings.temperatureUnit !== undefined)
    patch.temperature_unit = settings.temperatureUnit
  if (settings.defaultHorizonDays !== undefined)
    patch.default_horizon_days = settings.defaultHorizonDays
  if (settings.notificationsEnabled !== undefined) {
    patch.notif_rain_alert    = settings.notificationsEnabled.rainAlert
    patch.notif_stale_reading = settings.notificationsEnabled.staleReading
    patch.notif_task_due      = settings.notificationsEnabled.taskDue
  }
  if (settings.onboardingCompleted !== undefined)
    patch.onboarding_completed = settings.onboardingCompleted
  if (settings.dismissedNotificationIds !== undefined)
    patch.dismissed_notification_ids = settings.dismissedNotificationIds
  if (language && ['en', 'ta', 'hi'].includes(language)) {
    patch.language = language
  }

  const { error } = await supabase!
    .from('user_settings')
    .upsert(patch, { onConflict: 'user_id' })
  if (error) throw dbError(error.message)
}

// ── User Profiles ─────────────────────────────────────────────────────────────

export interface UserProfileData {
  id: string
  displayName: string
  preferredLang: 'en' | 'ta' | 'hi'
  district: string
  village: string
  interests: string[]
}

export async function dbGetUserProfile(userId: string): Promise<UserProfileData | null> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { data, error } = await supabase!
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw dbError(error.message)
  if (!data) return null
  return {
    id:            data.id,
    displayName:   data.display_name,
    preferredLang: data.preferred_lang,
    district:      data.district,
    village:       data.village,
    interests:     data.interests ?? [],
  }
}

export async function dbSaveUserProfile(
  userId: string,
  profile: Partial<UserProfileData>
): Promise<void> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const patch: Record<string, unknown> = { id: userId, updated_at: new Date().toISOString() }
  if (profile.displayName !== undefined) patch.display_name = profile.displayName
  if (profile.preferredLang !== undefined) patch.preferred_lang = profile.preferredLang
  if (profile.district !== undefined) patch.district = profile.district
  if (profile.village !== undefined) patch.village = profile.village
  if (profile.interests !== undefined) patch.interests = profile.interests

  const { error } = await supabase!
    .from('user_profiles')
    .upsert(patch, { onConflict: 'id' })
  if (error) throw dbError(error.message)
}
