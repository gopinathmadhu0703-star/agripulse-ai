 /**
 * db/client.ts
 *
 * Re-exports the Supabase client and a helper that tells callers
 * whether the DB is actually configured (real credentials, not placeholders).
 */
import { supabase } from '../supabase'

export { supabase }

export function isDbAvailable(): boolean {
  return supabase !== null
}

/**
 * Converts a Supabase error into a plain Error so callers can use instanceof.
 */
export function dbError(msg: string, cause?: unknown): Error {
  const e = new Error(msg)
  if (cause instanceof Error) (e as Error & { cause?: unknown }).cause = cause
  return e
}
