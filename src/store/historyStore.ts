import { z } from 'zod'
import type { RecommendationRecord } from '../types'
import { generateId } from './farmStore'

const HISTORY_KEY = 'agripulse_history'
const MAX_RECORDS = 500
const WARN_RECORDS = 400

// Zod schema for reading — validates structure on load, returns safe default on failure
const RecordSchema = z.object({
  id: z.string(),
  farmId: z.string(),
  farmName: z.string(),
  recommendation: z.object({
    action: z.enum(['irrigate', 'wait', 'collect-reading']),
    et0DailyMm: z.number(),
    kcUsed: z.number(),
    etcDailyMm: z.number(),
    effectiveRainMm: z.number(),
    soilBufferMm: z.number(),
    netDemandMm: z.number(),
    irrigationVolumeLiters: z.number(),
    formulaTrace: z.array(z.object({
      label: z.string(),
      formulaStr: z.string(),
      substitution: z.string(),
      result: z.number(),
      unit: z.string(),
    })),
    assumptions: z.array(z.string()),
    warnings: z.array(z.string()),
    generatedAt: z.string(),
  }),
  input: z.object({
    farm: z.any(),
    soilMoistureVwcPct: z.number().optional(),
    soilReadingAgeHours: z.number().optional(),
    horizonDays: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  }),
  createdAt: z.string(),
})

export function getRecommendations(): RecommendationRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = z.array(RecordSchema).parse(JSON.parse(raw))
    return parsed as RecommendationRecord[]
  } catch {
    return []
  }
}

export function saveRecommendation(
  record: Omit<RecommendationRecord, 'id' | 'createdAt'>
): RecommendationRecord {
  const newRecord: RecommendationRecord = {
    ...record,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  let records = getRecommendations()
  records.push(newRecord)
  // Drop oldest if over limit
  if (records.length > MAX_RECORDS) {
    records = records.slice(records.length - MAX_RECORDS)
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records))
  return newRecord
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

export function isNearStorageLimit(): boolean {
  return getRecommendations().length >= WARN_RECORDS
}
