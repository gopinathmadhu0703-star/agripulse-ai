/**
 * historyStore.ts
 *
 * Primary: Supabase `irrigation_recommendations` (when DB + auth available).
 * Fallback: localStorage.
 */
import { z } from 'zod'
import type { RecommendationRecord } from '../types'
import { generateId } from './farmStore'
import { dbGetRecommendations, dbSaveRecommendation } from '../lib/db/history'
import { isDbAvailable } from '../lib/db/client'
import { dbGetCurrentUser } from '../lib/db/auth'

const HISTORY_KEY  = 'agripulse_history'
const MAX_RECORDS  = 500
const WARN_RECORDS = 400

const RecordSchema = z.object({
  id:         z.string(),
  farmId:     z.string(),
  farmName:   z.string(),
  recommendation: z.object({
    action:                z.enum(['irrigate','wait','collect-reading']),
    et0DailyMm:            z.number(),
    kcUsed:                z.number(),
    etcDailyMm:            z.number(),
    effectiveRainMm:       z.number(),
    soilBufferMm:          z.number(),
    netDemandMm:           z.number(),
    irrigationVolumeLiters:z.number(),
    formulaTrace:          z.array(z.object({
      label:        z.string(),
      formulaStr:   z.string(),
      substitution: z.string(),
      result:       z.number(),
      unit:         z.string(),
    })),
    assumptions: z.array(z.string()),
    warnings:    z.array(z.string()),
    generatedAt: z.string(),
  }),
  input: z.object({
    farm:                z.any(),
    soilMoistureVwcPct:  z.number().optional(),
    soilReadingAgeHours: z.number().optional(),
    horizonDays:         z.union([z.literal(1),z.literal(2),z.literal(3)]),
  }),
  createdAt: z.string(),
})

// ── localStorage helpers ──────────────────────────────────────────────────────

function lsGetRecommendations(): RecommendationRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return z.array(RecordSchema).parse(JSON.parse(raw)) as RecommendationRecord[]
  } catch { return [] }
}

function lsSaveRecommendations(recs: RecommendationRecord[]): void {
  let trimmed = recs
  if (trimmed.length > MAX_RECORDS) trimmed = trimmed.slice(trimmed.length - MAX_RECORDS)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getRecommendations(): RecommendationRecord[] {
  return lsGetRecommendations()
}

export function saveRecommendation(
  record: Omit<RecommendationRecord, 'id' | 'createdAt'>
): RecommendationRecord {
  const newRecord: RecommendationRecord = {
    ...record,
    id:        generateId(),
    createdAt: new Date().toISOString(),
  }

  // Write to localStorage immediately
  const recs = lsGetRecommendations()
  recs.push(newRecord)
  lsSaveRecommendations(recs)

  // Mirror to DB asynchronously
  if (isDbAvailable()) {
    dbGetCurrentUser().then(user => {
      if (user) dbSaveRecommendation(record, user.id).catch(console.error)
    })
  }

  return newRecord
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

export function isNearStorageLimit(): boolean {
  return lsGetRecommendations().length >= WARN_RECORDS
}

// ── DB sync ───────────────────────────────────────────────────────────────────

export async function syncHistoryFromDb(): Promise<void> {
  if (!isDbAvailable()) return
  const user = await dbGetCurrentUser()
  if (!user) return
  try {
    const dbRecs = await dbGetRecommendations(user.id)
    if (dbRecs.length > 0) lsSaveRecommendations(dbRecs)
  } catch (e) {
    console.warn('[historyStore] DB sync failed:', e)
  }
}
