/**
 * db/auth.ts
 * Supabase Auth operations — session management and Google OAuth.
 */
import { supabase, isDbAvailable } from './client'
import type { User } from '../../types'
import { mapSupabaseUser } from '../supabase'

// ── Session ───────────────────────────────────────────────────────────────────

/** Returns the currently authenticated user, or null if not signed in. */
export async function dbGetCurrentUser(): Promise<User | null> {
  if (!isDbAvailable()) return null
  try {
    const { data: { user }, error } = await supabase!.auth.getUser()
    if (error || !user) return null
    return mapSupabaseUser(user)
  } catch {
    return null
  }
}

import type { Session, AuthChangeEvent } from '@supabase/supabase-js'

/** Listens for auth state changes and calls the callback. Returns unsubscribe fn. */
export function dbOnAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  if (!isDbAvailable()) return () => {}
  const { data: { subscription } } = supabase!.auth.onAuthStateChange(
    (_event: AuthChangeEvent, session: Session | null) => {
      callback(session?.user ? mapSupabaseUser(session.user) : null)
    }
  )
  return () => subscription.unsubscribe()
}

// ── Sign-in ───────────────────────────────────────────────────────────────────

/**
 * Initiates Google OAuth redirect.
 * Does NOT return a user — the auth callback page handles the response.
 */
export async function dbSignInWithGoogle(redirectTo: string): Promise<void> {
  if (!isDbAvailable()) throw new Error('Supabase not configured')
  const { error } = await supabase!.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })
  if (error) throw new Error(error.message)
}

/** Completes an OAuth callback after redirect — returns the signed-in user. */
export async function dbHandleAuthCallback(): Promise<User | null> {
  if (!isDbAvailable()) return null
  // Supabase client auto-exchanges the code in the URL hash
  const { data: { session }, error } = await supabase!.auth.getSession()
  if (error || !session?.user) return null
  return mapSupabaseUser(session.user)
}

// ── Sign-in with Email & Password ──────────────────────────────────────────────

export async function dbSignInWithEmail(email: string, password: string): Promise<User> {
  if (!isDbAvailable()) throw new Error('Supabase not configured')
  const { data, error } = await supabase!.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('No user returned from authentication')
  return mapSupabaseUser(data.user)
}

export async function dbSignUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User | null; requiresEmailConfirmation: boolean }> {
  if (!isDbAvailable()) throw new Error('Supabase not configured')
  const { data, error } = await supabase!.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        name: displayName?.trim() || email.split('@')[0],
      },
    },
  })
  if (error) throw new Error(error.message)
  const requiresEmailConfirmation = !data.session && !!data.user
  const user = data.user ? mapSupabaseUser(data.user) : null
  return { user, requiresEmailConfirmation }
}

export async function dbGetSession(): Promise<Session | null> {
  if (!isDbAvailable()) return null
  const { data: { session }, error } = await supabase!.auth.getSession()
  if (error) return null
  return session
}

// ── Sign-out ──────────────────────────────────────────────────────────────────

export async function dbSignOut(): Promise<void> {
  if (!isDbAvailable()) return
  await supabase!.auth.signOut()
}
