/**
 * AuthCallback.tsx
 *
 * Landing page after a Google OAuth redirect.
 * Supabase exchanges the code automatically when the client initialises on
 * this route. The AuthProvider detects "/auth/callback" in its useEffect,
 * calls handleAuthCallback(), and then replaces the URL with "/dashboard".
 * This component just shows a loading spinner until that navigation happens,
 * or an error state if the exchange fails and the user is still here after 10 s.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus]   = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    // If Supabase is configured, listen for the auth session that the client
    // creates automatically when it parses the URL hash/code on this route.
    if (supabase) {
      // Give Supabase up to 10 s to exchange the code
      const timeout = setTimeout(() => {
        setStatus('error')
        setMessage('Authentication timed out. The sign-in link may have expired.')
      }, 10_000)

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event: string, session: { user?: unknown } | null) => {
          if (event === 'SIGNED_IN' && session) {
            clearTimeout(timeout)
            setStatus('success')
            // AuthProvider's listener will also fire and trigger data sync.
            // Brief pause so the success state is visible, then go to dashboard.
            setTimeout(() => navigate('/dashboard', { replace: true }), 800)
          } else if (event === 'SIGNED_OUT') {
            clearTimeout(timeout)
            setStatus('error')
            setMessage('Sign-in was cancelled or the session expired.')
          }
        }
      )

      return () => {
        clearTimeout(timeout)
        subscription.unsubscribe()
      }
    } else {
      // Supabase not configured — demo mode only, no real OAuth
      setStatus('error')
      setMessage('Supabase is not configured. Use a demo account to sign in.')
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F5]">
      <div className="text-center max-w-sm p-8 bg-white rounded-lg shadow-card border border-[#E0E5DD]">

        {status === 'loading' && (
          <>
            <div className="w-10 h-10 rounded-full bg-[#EAF0E6] flex items-center justify-center mx-auto mb-4">
              <Loader2 size={18} className="text-[#527A45] animate-spin" />
            </div>
            <h3 className="text-sm font-semibold text-[#202820] mb-1">
              Completing sign-in
            </h3>
            <p className="text-xs text-[#9AA49A]">
              Exchanging credentials with Google…
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-10 h-10 rounded-full bg-[#EAF0E6] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={18} className="text-[#527A45]" />
            </div>
            <h3 className="text-sm font-semibold text-[#202820] mb-1">Signed in</h3>
            <p className="text-xs text-[#9AA49A]">Redirecting to your dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-[#202820] mb-1">Sign-in failed</h3>
            <p className="text-xs text-[#9AA49A] mb-4">{message}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="px-4 py-2 bg-[#24452D] text-white text-sm font-medium rounded-md hover:bg-[#1c3622] transition-colors"
            >
              Return to Home
            </button>
          </>
        )}

      </div>
    </div>
  )
}
