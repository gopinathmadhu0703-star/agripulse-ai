import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '../../types'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onSignIn: (user: User, useDemo: boolean) => void
  isLoading: boolean
  error: string | null
}

const MOCK_USERS = [
  {
    id: 'user_001',
    name: 'Gopinath Kumar',
    email: 'gopinath@example.com',
    picture: 'https://ui-avatars.com/api/?name=Gopinath+Kumar&background=0D8ABC&color=fff',
    descKey: 'auth.demoAccounts.gopinath' as const,
  },
  {
    id: 'user_002',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    picture: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=10B981&color=fff',
    descKey: 'auth.demoAccounts.priya' as const,
  },
  {
    id: 'user_003',
    name: 'Raj Patel',
    email: 'raj@example.com',
    picture: 'https://ui-avatars.com/api/?name=Raj+Patel&background=6366F1&color=fff',
    descKey: 'auth.demoAccounts.raj' as const,
  },
]

export function SignInModal({ isOpen, onClose, onSignIn, isLoading, error }: SignInModalProps) {
  const { t } = useTranslation()
  const [useRealGoogle, setUseRealGoogle] = useState(false)

  const makeUser = (idx: number): User => ({
    id: MOCK_USERS[idx].id,
    name: MOCK_USERS[idx].name,
    email: MOCK_USERS[idx].email,
    picture: MOCK_USERS[idx].picture,
    locale: 'en-US',
    emailVerified: true,
    createdAt: new Date().toISOString(),
  })

  const handleGoogleSignIn = () => {
    if (useRealGoogle) {
      onSignIn({} as User, false)
    } else {
      onSignIn(makeUser(0), true)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2C4F1E] flex items-center justify-center">
                  <span className="text-white text-xl">🌱</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('auth.signInTitle')}</h3>
                  <p className="text-sm text-gray-500">{t('auth.chooseDemo')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={t('common.close')}
              >
                <span className="text-xl">×</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Demo accounts */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">{t('auth.selectDemo')}</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">{t('auth.useRealGoogle')}</label>
                  <button
                    role="switch"
                    aria-checked={useRealGoogle}
                    onClick={() => setUseRealGoogle(!useRealGoogle)}
                    className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${
                      useRealGoogle ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        useRealGoogle ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {!useRealGoogle &&
                MOCK_USERS.map((user, index) => (
                  <button
                    key={user.id}
                    onClick={() => onSignIn(makeUser(index), true)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#ACD1A0] transition-all hover:shadow-md text-left"
                  >
                    <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t(user.descKey)}</p>
                    </div>
                  </button>
                ))}
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">{t('auth.orSignInWith')}</span>
              </div>
            </div>

            {/* Google button */}
            <div className="space-y-3">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${
                  useRealGoogle
                    ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                <span className={`font-medium ${useRealGoogle ? 'text-emerald-700' : 'text-gray-700'}`}>
                  {isLoading
                    ? t('auth.signingIn')
                    : useRealGoogle
                    ? `${t('auth.signInWithGoogle')} (OAuth)`
                    : `${t('auth.signInWithGoogle')} (Demo)`}
                </span>
              </button>

              <div className="text-xs text-gray-500 text-center space-y-1">
                {useRealGoogle ? (
                  <>
                    <p>{t('auth.realGoogleNote')}</p>
                    <p className="text-amber-600 font-medium">{t('auth.requiresConfig')}</p>
                  </>
                ) : (
                  <p>{t('auth.demoNote')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              {t('auth.noAccount')}{' '}
              <button
                onClick={() => onSignIn(makeUser(0), true)}
                className="text-[#2C4F1E] font-medium hover:underline"
              >
                {t('auth.useDemo')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
