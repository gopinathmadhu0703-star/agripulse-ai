/**
 * db/farms.ts
 *
 * Supabase operations for the farms table.
 * All functions throw on error — callers decide how to handle.
 */
import { supabase, isDbAvailable, dbError } from './client'
import type { Farm } from '../../types'

export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

export function ensureUuid(id?: string): string {
  if (id && isValidUuid(id)) return id
  return crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-000000000000'.replace(/0/g, () => Math.floor(Math.random() * 16).toString(16))
}

// ── Row ↔ Domain mappers ─────────────────────────────────────────────────────

function rowToFarm(r: Record<string, unknown>): Farm {
  return {
    id:                   r.id as string,
    name:                 r.name as string,
    locationName:         r.location_name as string,
    latitude:             r.latitude as number,
    longitude:            r.longitude as number,
    locationDisplayName:  r.location_display_name as string,
    fieldAreaHa:          Number(r.field_area_ha),
    crop:                 r.crop as Farm['crop'],
    growthStage:          r.growth_stage as Farm['growthStage'],
    soilType:             r.soil_type as Farm['soilType'],
    irrigationMethod:     r.irrigation_method as Farm['irrigationMethod'],
    createdAt:            r.created_at as string,
    updatedAt:            r.updated_at as string,
  }
}

function farmToRow(farm: Farm, userId: string, isActive: boolean = false) {
  const farmId = ensureUuid(farm.id)
  return {
    id:                     farmId,
    user_id:                userId,
    name:                   farm.name.trim().slice(0, 200),
    location_name:          farm.locationName || 'Farm Location',
    latitude:               Math.max(-90, Math.min(90, Number(farm.latitude))),
    longitude:              Math.max(-180, Math.min(180, Number(farm.longitude))),
    location_display_name:  farm.locationDisplayName || farm.locationName || 'Farm Location',
    field_area_ha:          Math.max(0.0001, Number(farm.fieldAreaHa)),
    crop:                   farm.crop,
    growth_stage:           farm.growthStage,
    soil_type:              farm.soilType,
    irrigation_method:      farm.irrigationMethod,
    is_active:              isActive,
    updated_at:             new Date().toISOString(),
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function dbGetFarms(): Promise<Farm[]> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { data, error } = await supabase!
    .from('farms')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw dbError(error.message)
  return (data ?? []).map(rowToFarm)
}

export async function dbSaveFarm(farm: Farm, userId: string, isActive?: boolean): Promise<Farm> {
  if (!isDbAvailable()) throw dbError('DB not configured')

  const shouldBeActive = isActive ?? false

  // If setting this farm as active, deactivate other farms first to satisfy partial unique index
  if (shouldBeActive) {
    const { error: deactivateError } = await supabase!
      .from('farms')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)
    if (deactivateError) throw dbError(deactivateError.message)
  }

  const row = farmToRow(farm, userId, shouldBeActive)
  const { data, error } = await supabase!
    .from('farms')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw dbError(error.message)
  return rowToFarm(data)
}

export async function dbDeleteFarm(farmId: string): Promise<void> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { error } = await supabase!.from('farms').delete().eq('id', farmId)
  if (error) throw dbError(error.message)
}

export async function dbGetActiveFarmId(userId: string): Promise<string | null> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { data, error } = await supabase!
    .from('farms')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw dbError(error.message)
  return data?.id ?? null
}

export async function dbSetActiveFarm(farmId: string, userId: string): Promise<void> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  // Clear existing active flag for this user, then set the new one
  const { error: e1 } = await supabase!
    .from('farms')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)
  if (e1) throw dbError(e1.message)

  const { error: e2 } = await supabase!
    .from('farms')
    .update({ is_active: true })
    .eq('id', farmId)
    .eq('user_id', userId)
  if (e2) throw dbError(e2.message)
}
