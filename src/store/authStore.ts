import type { User, AuthState } from '../types'
import { supabase, mapSupabaseUser } from '../lib/supabase'

const AUTH_STORAGE_KEY = 'agripulse_auth'

// Mock user data for demo purposes (kept for demo mode)
const MOCK_USERS: User[] = [
  {
    id: 'user_001',
    name: 'Gopinath Kumar',
    email: 'gopinath@example.com',
    picture: 'https://ui-avatars.com/api/?name=Gopinath+Kumar&background=0D8ABC&color=fff',
    locale: 'en-US',
    emailVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_002',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    picture: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=10B981&color=fff',
    locale: 'en-IN',
    emailVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_003',
    name: 'Raj Patel',
    email: 'raj@example.com',
    picture: 'https://ui-avatars.com/api/?name=Raj+Patel&background=6366F1&color=fff',
    locale: 'en-IN',
    emailVerified: true,
    createdAt: new Date().toISOString(),
  },
]

// Initialize auth state
export function getAuthState(): AuthState {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // If stored data is invalid, return initial state
    }
  }
  
  return {
    user: null,
    isLoading: false,
    error: null,
  }
}

// Save auth state
export function saveAuthState(state: AuthState): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
}

// REAL Google OAuth sign-in
export async function signInWithGoogle(): Promise<User> {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      throw new Error('Supabase not configured. Please use demo mode or configure Supabase.')
    }
    
    // Get the current app URL for OAuth redirect
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
    
    // Sign in with Google OAuth using Supabase
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appUrl}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    if (error) {
      throw new Error(`Google sign-in failed: ${error.message}`)
    }
    
    // The actual authentication happens in the OAuth flow
    // We'll handle the callback separately in the AuthProvider
    throw new Error('OAuth flow initiated - handle callback to complete authentication')
    
  } catch (error) {
    console.error('Google OAuth error:', error)
    throw error instanceof Error ? error : new Error('Failed to sign in with Google')
  }
}

// Sign in with demo account (for testing/demo purposes)
export async function signInWithDemo(): Promise<User> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // Randomly select a mock user for demo
  const randomUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)]
  
  const authState: AuthState = {
    user: randomUser,
    isLoading: false,
    error: null,
  }
  
  saveAuthState(authState)
  return randomUser
}

// Handle OAuth callback after returning from Google
export async function handleAuthCallback(): Promise<User | null> {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.warn('Supabase not configured for auth callback. Using demo mode.')
      return null
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      throw new Error(`Session error: ${sessionError.message}`)
    }
    
    if (!session?.user) {
      return null
    }
    
    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      throw new Error(`User error: ${userError.message}`)
    }
    
    if (!user) {
      return null
    }
    
    // Map Supabase user to our User type
    const mappedUser = mapSupabaseUser(user)
    
    const authState: AuthState = {
      user: mappedUser,
      isLoading: false,
      error: null,
    }
    
    saveAuthState(authState)
    return mappedUser
    
  } catch (error) {
    console.error('Auth callback error:', error)
    throw error instanceof Error ? error : new Error('Failed to handle auth callback')
  }
}

// Check current authentication status
export async function checkAuthStatus(): Promise<User | null> {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return null
    }
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth status check error:', error)
      return null
    }
    
    if (!user) {
      return null
    }
    
    return mapSupabaseUser(user)
  } catch (error) {
    console.error('Auth status check failed:', error)
    return null
  }
}

// Sign out
export async function signOut(): Promise<void> {
  try {
    // Sign out from Supabase if configured
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
      }
    }
  } catch (error) {
    console.error('Sign out failed:', error)
  } finally {
    // Clear local storage regardless
    const authState: AuthState = {
      user: null,
      isLoading: false,
      error: null,
    }
    
    saveAuthState(authState)
  }
}

// Get current user
export function getCurrentUser(): User | null {
  return getAuthState().user
}

// Clear auth error
export function clearAuthError(): void {
  const currentState = getAuthState()
  const authState: AuthState = {
    ...currentState,
    error: null,
  }
  
  saveAuthState(authState)
}

// Set loading state
export function setAuthLoading(isLoading: boolean): void {
  const currentState = getAuthState()
  const authState: AuthState = {
    ...currentState,
    isLoading,
  }
  
  saveAuthState(authState)
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

// Initialize auth on app start
export function initializeAuth(): void {
  const stored = getAuthState()
  if (!stored.user) {
    // No user stored, ensure clean state
    saveAuthState({
      user: null,
      isLoading: false,
      error: null,
    })
  }
}