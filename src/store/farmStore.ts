/**
 * farmStore.ts
 *
 * Primary source: Supabase `farms` table (when DB is available and user is signed in).
 * Fallback:       localStorage (demo mode / unauthenticated).
 *
 * All public functions are synchronous for backward-compat with existing
 * component code that calls them directly.  Async DB operations are triggered
 * as fire-and-forget side effects; the caller re-fetches from state.
 */
import { z } from 'zod'
import type { Farm } from '../types'
import {
  dbGetFarms, dbSaveFarm, dbDeleteFarm,
  dbGetActiveFarmId, dbSetActiveFarm,
} from '../lib/db/farms'
import { isDbAvailable } from '../lib/db/client'
import { dbGetCurrentUser } from '../lib/db/auth'

// ── localStorage keys ─────────────────────────────────────────────────────────
const FARMS_KEY      = 'agripulse_farms'
const ACTIVE_FARM_KEY = 'agripulse_active_farm_id'

const FarmSchema = z.object({
  id:                   z.string(),
  name:                 z.string(),
  locationName:         z.string(),
  latitude:             z.number(),
  longitude:            z.number(),
  locationDisplayName:  z.string(),
  fieldAreaHa:          z.number().positive(),
  crop: z.enum(['wheat','maize','rice','tomato','potato','soybean','cotton','sugarcane']),
  growthStage:          z.enum(['initial','mid','end']),
  soilType:             z.enum(['sandy','loamy','clay','silty']),
  irrigationMethod:     z.enum(['drip','sprinkler','furrow','flood']),
  createdAt:            z.string(),
  updatedAt:            z.string(),
})

// ── localStorage helpers ──────────────────────────────────────────────────────

function lsGetFarms(): Farm[] {
  try {
    const raw = localStorage.getItem(FARMS_KEY)
    if (!raw) return []
    return z.array(FarmSchema).parse(JSON.parse(raw)) as Farm[]
  } catch { return [] }
}

function lsSaveFarms(farms: Farm[]): void {
  localStorage.setItem(FARMS_KEY, JSON.stringify(farms))
}

// ── Public sync API (used by existing components) ────────────────────────────

export function getFarms(): Farm[] {
  return lsGetFarms()
}

export function getFarmById(id: string): Farm | undefined {
  return lsGetFarms().find(f => f.id === id)
}

export function saveFarm(farm: Farm): void {
  // 1. Write to localStorage immediately so UI updates instantly
  const farms = lsGetFarms()
  const idx = farms.findIndex(f => f.id === farm.id)
  if (idx >= 0) farms[idx] = farm
  else farms.push(farm)
  lsSaveFarms(farms)

  // 2. Mirror to DB asynchronously
  if (isDbAvailable()) {
    dbGetCurrentUser().then(user => {
      if (user) dbSaveFarm(farm, user.id).catch(console.error)
    })
  }
}

export function deleteFarm(id: string): void {
  lsSaveFarms(lsGetFarms().filter(f => f.id !== id))
  if (getActiveFarmId() === id) localStorage.removeItem(ACTIVE_FARM_KEY)

  if (isDbAvailable()) {
    dbDeleteFarm(id).catch(console.error)
  }
}

export function getActiveFarmId(): string | null {
  return localStorage.getItem(ACTIVE_FARM_KEY)
}

export function setActiveFarmId(id: string): void {
  localStorage.setItem(ACTIVE_FARM_KEY, id)

  if (isDbAvailable()) {
    dbGetCurrentUser().then(user => {
      if (user) dbSetActiveFarm(id, user.id).catch(console.error)
    })
  }
}

export function getActiveFarm(): Farm | undefined {
  const id = getActiveFarmId()
  if (!id) return undefined
  return getFarmById(id)
}

export function generateId(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ── DB → localStorage sync (called once on login) ────────────────────────────

/**
 * Pull farms from DB and merge into localStorage.
 * Existing localStorage-only records are preserved; DB records take precedence on conflict.
 */
export async function syncFarmsFromDb(): Promise<void> {
  if (!isDbAvailable()) return
  const user = await dbGetCurrentUser()
  if (!user) return

  try {
    const [dbFarms, activeId] = await Promise.all([
      dbGetFarms(),
      dbGetActiveFarmId(user.id),
    ])

    // Merge: DB wins on id conflict
    const lsFarms = lsGetFarms()
    const lsIds = new Set(dbFarms.map(f => f.id))
    const localOnly = lsFarms.filter(f => !lsIds.has(f.id))

    lsSaveFarms([...dbFarms, ...localOnly])

    if (activeId) localStorage.setItem(ACTIVE_FARM_KEY, activeId)

    // Push any local-only farms to DB so they aren't lost
    for (const farm of localOnly) {
      await dbSaveFarm(farm, user.id).catch(console.error)
    }
  } catch (e) {
    console.warn('[farmStore] DB sync failed, using localStorage:', e)
  }
}
