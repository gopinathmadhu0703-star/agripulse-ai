/**
 * authStore.ts
 *
 * Real authentication via Supabase Auth (Email & Password, Google OAuth).
 * Persists session state and handles auth transitions.
 */
import type { User, AuthState } from '../types'
import {
  dbGetCurrentUser,
  dbSignInWithEmail,
  dbSignUpWithEmail,
  dbSignInWithGoogle,
  dbHandleAuthCallback,
  dbSignOut,
  dbOnAuthStateChange,
} from '../lib/db/auth'
import { isDbAvailable } from '../lib/db/client'

const AUTH_STORAGE_KEY = 'agripulse_auth'

// ── localStorage helpers ──────────────────────────────────────────────────────

export function getAuthState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return { user: null, isLoading: false, error: null }
    return JSON.parse(raw)
  } catch {
    return { user: null, isLoading: false, error: null }
  }
}

export function saveAuthState(state: AuthState): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
}

// ── Real Email & Password Authentication ───────────────────────────────────────

export async function signInWithEmail(email: string, password: string): Promise<User> {
  if (!isDbAvailable()) {
    throw new Error('Supabase is not configured.')
  }
  const user = await dbSignInWithEmail(email, password)
  saveAuthState({ user, isLoading: false, error: null })
  return user
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User | null; requiresEmailConfirmation: boolean }> {
  if (!isDbAvailable()) {
    throw new Error('Supabase is not configured.')
  }
  const result = await dbSignUpWithEmail(email, password, displayName)
  if (result.user) {
    saveAuthState({ user: result.user, isLoading: false, error: null })
  }
  return result
}

// ── Google OAuth ──────────────────────────────────────────────────────────────

/**
 * Starts Google OAuth redirect. Never returns a user directly —
 * the /auth/callback route completes the flow.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!isDbAvailable()) {
    throw new Error('Supabase is not configured.')
  }
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
  await dbSignInWithGoogle(`${appUrl}/auth/callback`)
}

// ── OAuth callback ────────────────────────────────────────────────────────────

export async function handleAuthCallback(): Promise<User | null> {
  const user = await dbHandleAuthCallback()
  if (user) saveAuthState({ user, isLoading: false, error: null })
  return user
}

// ── Check existing session ────────────────────────────────────────────────────

export async function checkAuthStatus(): Promise<User | null> {
  if (!isDbAvailable()) return null
  const user = await dbGetCurrentUser()
  if (user) {
    saveAuthState({ user, isLoading: false, error: null })
  } else {
    // If Supabase has no active user, clear any stale user from localStorage
    saveAuthState({ user: null, isLoading: false, error: null })
  }
  return user
}

// ── Auth state listener ───────────────────────────────────────────────────────

/**
 * Subscribe to Supabase auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  return dbOnAuthStateChange((user) => {
    saveAuthState({ user, isLoading: false, error: null })
    callback(user)
  })
}

// ── Sign-out ──────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  try {
    if (isDbAvailable()) await dbSignOut()
  } finally {
    saveAuthState({ user: null, isLoading: false, error: null })
  }
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

export function getCurrentUser(): User | null {
  return getAuthState().user
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

export function clearAuthError(): void {
  const state = getAuthState()
  saveAuthState({ ...state, error: null })
}

export function setAuthLoading(isLoading: boolean): void {
  const state = getAuthState()
  saveAuthState({ ...state, isLoading })
}

export function initializeAuth(): void {
  const state = getAuthState()
  if (!state.user) saveAuthState({ user: null, isLoading: false, error: null })
}
