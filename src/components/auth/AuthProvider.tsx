import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User, AuthState } from '../../types'
import { 
  getAuthState, 
  signInWithGoogle, 
  signInWithDemo,
  signOut as authSignOut, 
  clearAuthError,
  setAuthLoading,
  initializeAuth,
  checkAuthStatus,
  handleAuthCallback
} from '../../store/authStore'
import { SignInModal } from './SignInModal'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  signIn: (useDemo?: boolean) => Promise<void>
  signOut: () => void
  showSignInModal: () => void
  hideSignInModal: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>(getAuthState())
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)

  // Initialize auth on mount and check for OAuth callback
  useEffect(() => {
    const initializeAuthAndCheckStatus = async () => {
      initializeAuth()
      
      // Check if we're returning from OAuth callback
      const currentUrl = window.location.href
      if (currentUrl.includes('/auth/callback')) {
        try {
          setAuthLoading(true)
          const user = await handleAuthCallback()
          
          if (user) {
            setAuthState({
              user,
              isLoading: false,
              error: null,
            })
            
            // Redirect to dashboard after successful auth
            window.history.replaceState({}, '', '/dashboard')
          } else {
            setAuthState({
              user: null,
              isLoading: false,
              error: 'Authentication failed. Please try again.',
            })
          }
        } catch (err) {
          setAuthState({
            user: null,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Authentication failed',
          })
        }
      } else {
        // Check existing auth status
        try {
          const user = await checkAuthStatus()
          if (user) {
            setAuthState({
              user,
              isLoading: false,
              error: null,
            })
          } else {
            setAuthState(getAuthState())
          }
        } catch (error) {
          setAuthState(getAuthState())
        }
      }
    }
    
    initializeAuthAndCheckStatus()
  }, [])

  const updateAuthState = () => {
    setAuthState(getAuthState())
  }

  const handleSignIn = async (useDemo: boolean = false) => {
    try {
      setAuthLoading(true)
      updateAuthState()
      
      let user: User
      
      if (useDemo) {
        // Use demo account
        user = await signInWithDemo()
      } else {
        // Use real Google OAuth
        user = await signInWithGoogle()
        // If we get here, OAuth was initiated and we should redirect
        // The actual authentication will be handled by the OAuth callback
        return
      }
      
      setAuthState({
        user,
        isLoading: false,
        error: null,
      })
      
      setIsSignInModalOpen(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      
      // Check if this is an OAuth flow initiation error (which is expected)
      if (errorMessage.includes('OAuth flow initiated')) {
        // This is expected - OAuth flow was initiated, let it continue
        return
      }
      
      setAuthState({
        user: null,
        isLoading: false,
        error: errorMessage,
      })
    }
  }

  const handleSignOut = () => {
    authSignOut()
    updateAuthState()
  }

  const handleShowSignInModal = () => {
    setIsSignInModalOpen(true)
  }

  const handleHideSignInModal = () => {
    setIsSignInModalOpen(false)
    clearAuthError()
  }

  const handleModalSignIn = (user: User, useDemo: boolean = true) => {
    if (useDemo) {
      // For demo purposes, directly set the user
      const authState: AuthState = {
        user,
        isLoading: false,
        error: null,
      }
      
      localStorage.setItem('agripulse_auth', JSON.stringify(authState))
      setAuthState(authState)
      setIsSignInModalOpen(false)
    } else {
      // Real Google OAuth - call handleSignIn
      handleSignIn(false)
    }
  }

  const value: AuthContextType = {
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    signIn: handleSignIn,
    signOut: handleSignOut,
    showSignInModal: handleShowSignInModal,
    hideSignInModal: handleHideSignInModal,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={handleHideSignInModal}
        onSignIn={handleModalSignIn}
        isLoading={authState.isLoading}
        error={authState.error}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WithAuthComponent(props: P) {
    const { user, isLoading } = useAuth()
    
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }
    
    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
              <span className="text-3xl">🔒</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign in required</h3>
            <p className="text-gray-500 mb-6">
              Please sign in to access the AgriPulse AI dashboard.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      )
    }
    
    return <Component {...props} />
  }
}