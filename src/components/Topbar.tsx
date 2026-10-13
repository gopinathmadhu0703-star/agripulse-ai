import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from './auth/AuthProvider'
import { SUPPORTED_LANGUAGES } from '../i18n/config'
import type { SupportedLanguage } from '../i18n/config'

export function Topbar() {
  const { t, i18n } = useTranslation()
  const [notifications] = useState(3)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const currentDate = new Date().toISOString().split('T')[0]

  const { user, showSignInModal, signOut } = useAuth()

  const handleUserClick = () => {
    if (user) {
      setIsUserMenuOpen(!isUserMenuOpen)
    } else {
      showSignInModal()
    }
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value as SupportedLanguage)
  }

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              placeholder={t('topbar.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <span className="text-xl">🔔</span>
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>

          {/* Language selector */}
          <select
            value={i18n.language}
            onChange={handleLanguageChange}
            aria-label={t('topbar.language')}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeLabel}
              </option>
            ))}
          </select>

          {/* Date Picker */}
          <input
            type="date"
            defaultValue={currentDate}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />

          {/* Export CSV */}
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            <span>📥</span>
            {t('common.exportCsv')}
          </button>

          {/* User Avatar */}
          <div className="relative">
            <button
              onClick={handleUserClick}
              className="flex items-center gap-3 p-1 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {user ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-emerald-700 font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden md:inline">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-gray-400">▼</span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600">👤</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden md:inline">
                    {t('nav.signIn')}
                  </span>
                </>
              )}
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && user && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={() => { signOut(); setIsUserMenuOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {t('nav.signOut')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isUserMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
      )}
    </header>
  )
}
