import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sprout, X, Loader2, Mail, Lock, User as UserIcon, AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import { useAuth } from './AuthProvider'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onSignIn?: (user: any, useDemo: boolean) => void
  isLoading?: boolean
  error?: string | null
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { t } = useTranslation()
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)
  const [showGoogleHelp, setShowGoogleHelp] = useState(false)

  if (!isOpen) return null

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setDisplayName('')
    setErrorMsg(null)
    setInfoMsg(null)
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setInfoMsg(null)

    try {
      await signInWithEmail(email, password)
      resetForm()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed'
      if (msg.includes('Email not confirmed')) {
        setErrorMsg('Email address is not yet confirmed. Please check your inbox or confirm the user in your Supabase Dashboard (Auth > Users).')
      } else if (msg.includes('Invalid login credentials')) {
        setErrorMsg('Invalid email or password. If you do not have an account yet, switch to the "Create Account" tab.')
      } else {
        setErrorMsg(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setInfoMsg(null)

    try {
      const res = await signUpWithEmail(email, password, displayName)
      if (res.requiresEmailConfirmation) {
        setInfoMsg(
          'Account created! A confirmation email has been sent. If email confirmation is enabled in your Supabase project, click the link in your email to activate your account.'
        )
      } else {
        resetForm()
        onClose()
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Sign-up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleClick = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google OAuth redirect failed'
      setErrorMsg(msg)
      setShowGoogleHelp(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#202820]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md border border-[#E0E5DD] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#F8F9F5] border-b border-[#E0E5DD]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#24452D] flex items-center justify-center shadow-sm">
                <Sprout size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#202820]">
                  {mode === 'signin' ? 'Sign In to AgriPulse AI' : 'Create an Account'}
                </h2>
                <p className="text-xs text-[#687168]">Connected to Supabase Cloud</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#9AA49A] hover:text-[#202820] transition-colors p-1 rounded-md"
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#E0E5DD] bg-gray-50/50">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMsg(null); setInfoMsg(null) }}
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${
                mode === 'signin'
                  ? 'border-[#24452D] text-[#24452D] bg-white'
                  : 'border-transparent text-[#687168] hover:text-[#202820]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(null); setInfoMsg(null) }}
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${
                mode === 'signup'
                  ? 'border-[#24452D] text-[#24452D] bg-white'
                  : 'border-transparent text-[#687168] hover:text-[#202820]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 leading-relaxed">{errorMsg}</div>
              </div>
            )}

            {infoMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 leading-relaxed">{infoMsg}</div>
              </div>
            )}

            {/* Email form */}
            <form onSubmit={mode === 'signin' ? handleEmailSignIn : handleEmailSignUp} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-[#202820] mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA49A]" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full text-xs bg-[#F7F8F5] border border-[#E0E5DD] rounded-lg pl-9 pr-3 py-2.5 text-[#202820] focus:ring-2 focus:ring-[#24452D] focus:border-[#24452D] outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#202820] mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA49A]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className="w-full text-xs bg-[#F7F8F5] border border-[#E0E5DD] rounded-lg pl-9 pr-3 py-2.5 text-[#202820] focus:ring-2 focus:ring-[#24452D] focus:border-[#24452D] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202820] mb-1">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA49A]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs bg-[#F7F8F5] border border-[#E0E5DD] rounded-lg pl-9 pr-3 py-2.5 text-[#202820] focus:ring-2 focus:ring-[#24452D] focus:border-[#24452D] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-[#24452D] hover:bg-[#1a3321] text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>{mode === 'signin' ? 'Sign In with Email' : 'Create Real Account'}</span>
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E0E5DD]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-[11px] text-[#9AA49A] uppercase tracking-wider">or</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-[#E0E5DD] bg-white text-xs font-medium text-[#202820] hover:bg-[#F8F9F5] transition-colors shadow-sm disabled:opacity-50"
            >
              <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
              <span>Continue with Google</span>
            </button>

            {showGoogleHelp && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <Info size={13} className="text-amber-700" /> Google OAuth Setup Required:
                </p>
                To enable Google sign-in: In your Supabase Dashboard, go to <strong>Authentication &gt; Providers &gt; Google</strong>, toggle it On, and paste your Google Client ID &amp; Secret. In Google Cloud Console, set redirect URI to your Supabase project URL.
              </div>
            )}
          </div>

          {/* Footer - Local mode notice */}
          <div className="px-6 py-3.5 bg-[#F8F9F5] border-t border-[#E0E5DD] flex items-center justify-between text-xs">
            <span className="text-[#687168]">Want to test offline?</span>
            <button
              type="button"
              onClick={onClose}
              className="text-[#24452D] font-semibold hover:underline"
            >
              Use Browser Storage
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
