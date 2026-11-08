import { supabase, isDbAvailable, dbError } from './client'
import { isValidUuid } from './farms'
import type { RecommendationRecord } from '../../types'

function rowToRecord(r: Record<string, unknown>): RecommendationRecord {
  return {
    id:             r.id as string,
    farmId:         r.farm_id as string,
    farmName:       r.farm_name as string,
    recommendation: r.recommendation as RecommendationRecord['recommendation'],
    input:          r.input_data as RecommendationRecord['input'],
    createdAt:      r.created_at as string,
  }
}

export async function dbGetRecommendations(userId: string): Promise<RecommendationRecord[]> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  const { data, error } = await supabase!
    .from('irrigation_recommendations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw dbError(error.message)
  return (data ?? []).map(rowToRecord)
}

export async function dbSaveRecommendation(
  record: Omit<RecommendationRecord, 'id' | 'createdAt'>,
  userId: string
): Promise<RecommendationRecord> {
  if (!isDbAvailable()) throw dbError('DB not configured')

  if (!isValidUuid(record.farmId)) {
    throw dbError('Invalid farm ID format. Recommendations require a valid database farm UUID.')
  }

  const { data, error } = await supabase!
    .from('irrigation_recommendations')
    .insert({
      user_id:        userId,
      farm_id:        record.farmId,
      farm_name:      record.farmName,
      recommendation: record.recommendation,
      input_data:     record.input,
    })
    .select()
    .single()
  if (error) throw dbError(error.message)
  return rowToRecord(data)
}

export async function dbClearHistory(userId: string): Promise<void> {
  if (!isDbAvailable()) throw dbError('DB not configured')
  // Note: Schema migration defines recommendations as append-only audit history.
  // We attempt delete if permitted by RLS, otherwise ignore permission denials.
  try {
    const { error } = await supabase!
      .from('irrigation_recommendations')
      .delete()
      .eq('user_id', userId)
    if (error && !error.message.includes('policy')) throw dbError(error.message)
  } catch (err) {
    console.warn('[dbClearHistory] Recommendations are append-only in database schema:', err)
  }
}
