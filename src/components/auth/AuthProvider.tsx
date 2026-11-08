import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User, AuthState } from '../../types'
import {
  getAuthState,
  signInWithGoogle,
  signOut as authSignOut,
  clearAuthError,
  setAuthLoading,
  initializeAuth,
  checkAuthStatus,
  handleAuthCallback,
  onAuthStateChange,
} from '../../store/authStore'
import { syncFarmsFromDb }       from '../../store/farmStore'
import { syncHistoryFromDb }     from '../../store/historyStore'
import { syncIrrigationFromDb }  from '../../store/irrigationStore'
import { syncSettingsFromDb }    from '../../store/settingsStore'
import { SignInModal } from './SignInModal'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<User>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ user: User | null; requiresEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  showSignInModal: () => void
  hideSignInModal: () => void
  signIn: (useDemo?: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Pull all user data from Supabase into localStorage after a successful login. */
export async function syncAllFromDb() {
  await Promise.allSettled([
    syncFarmsFromDb(),
    syncHistoryFromDb(),
    syncIrrigationFromDb(),
    syncSettingsFromDb(),
  ])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState]         = useState<AuthState>(getAuthState())
  const [isSignInModalOpen, setModal]     = useState(false)

  // ── Initialise: handle OAuth callback or restore existing session ─────────
  useEffect(() => {
    initializeAuth()
    const isCallback = window.location.pathname === '/auth/callback'

    ;(async () => {
      setAuthLoading(true)
      setAuthState(s => ({ ...s, isLoading: true }))
      try {
        let user: User | null = null
        if (isCallback) {
          user = await handleAuthCallback()
          if (user) window.history.replaceState({}, '', '/dashboard')
        } else {
          user = await checkAuthStatus()
        }
        if (user) {
          setAuthState({ user, isLoading: false, error: null })
          await syncAllFromDb()
        } else {
          setAuthState(getAuthState())
        }
      } catch {
        setAuthState(s => ({ ...s, isLoading: false }))
      }
    })()
  }, [])

  // ── Listen for Supabase auth events (token refresh, sign-out from another tab)
  useEffect(() => {
    const unsub = onAuthStateChange(user => {
      setAuthState({ user, isLoading: false, error: null })
      if (user) {
        void syncAllFromDb()
      }
    })
    return unsub
  }, [])

  // ── Sign-in methods ───────────────────────────────────────────────────────
  const handleSignInWithGoogle = async () => {
    try {
      setAuthLoading(true)
      setAuthState(s => ({ ...s, isLoading: true, error: null }))
      await signInWithGoogle()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed'
      if (msg.includes('OAuth flow initiated')) return
      setAuthState(s => ({ ...s, isLoading: false, error: msg }))
      throw err
    }
  }

  const handleSignInWithEmail = async (email: string, password: string): Promise<User> => {
    try {
      setAuthLoading(true)
      setAuthState(s => ({ ...s, isLoading: true, error: null }))
      const { signInWithEmail: storeSignInWithEmail } = await import('../../store/authStore')
      const user = await storeSignInWithEmail(email, password)
      setAuthState({ user, isLoading: false, error: null })
      setModal(false)
      await syncAllFromDb()
      return user
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed'
      setAuthState(s => ({ ...s, isLoading: false, error: msg }))
      throw err
    }
  }

  const handleSignUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      setAuthLoading(true)
      setAuthState(s => ({ ...s, isLoading: true, error: null }))
      const { signUpWithEmail: storeSignUpWithEmail } = await import('../../store/authStore')
      const result = await storeSignUpWithEmail(email, password, displayName)
      if (result.user && !result.requiresEmailConfirmation) {
        setAuthState({ user: result.user, isLoading: false, error: null })
        setModal(false)
        await syncAllFromDb()
      } else {
        setAuthState(s => ({ ...s, isLoading: false, error: null }))
      }
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-up failed'
      setAuthState(s => ({ ...s, isLoading: false, error: msg }))
      throw err
    }
  }

  const handleSignOut = async () => {
    await authSignOut()
    setAuthState({ user: null, isLoading: false, error: null })
  }

  // Backward compatibility alias for existing code
  const handleSignIn = async () => {
    await handleSignInWithGoogle()
  }

  const value: AuthContextType = {
    user:             authState.user,
    isLoading:        authState.isLoading,
    error:            authState.error,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithEmail:  handleSignInWithEmail,
    signUpWithEmail:  handleSignUpWithEmail,
    signIn:           handleSignIn,
    signOut:          handleSignOut,
    showSignInModal:  () => setModal(true),
    hideSignInModal:  () => { setModal(false); clearAuthError() },
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => { setModal(false); clearAuthError() }}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
