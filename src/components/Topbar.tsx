import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Globe, Menu } from 'lucide-react'
import { useAuth } from './auth/AuthProvider'
import { SUPPORTED_LANGUAGES } from '../i18n/config'
import type { SupportedLanguage } from '../i18n/config'

interface TopbarProps {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { t, i18n } = useTranslation()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { user, showSignInModal, signOut } = useAuth()

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value as SupportedLanguage)
  }

  return (
    <header className="h-14 border-b border-[#E0E5DD] bg-white px-4 flex items-center justify-between gap-3 flex-shrink-0">
      {/* Left: hamburger (mobile) + search (desktop) */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 text-[#687168] hover:text-[#202820] hover:bg-[#F7F8F5] rounded-md transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Search — desktop always visible, mobile toggleable */}
        {searchOpen ? (
          <div className="relative flex-1 lg:max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA49A] pointer-events-none" />
            <input
              autoFocus
              type="text"
              placeholder={t('topbar.searchPlaceholder')}
              onBlur={() => setSearchOpen(false)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-[#F7F8F5] border border-[#E0E5DD] rounded-md text-[#202820] placeholder:text-[#9AA49A] focus:outline-none focus:ring-2 focus:ring-[#24452D] focus:border-[#24452D] transition-colors"
            />
          </div>
        ) : (
          <>
            {/* Desktop search box */}
            <div className="relative max-w-xs w-full hidden lg:block">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA49A] pointer-events-none" />
              <input
                type="text"
                placeholder={t('topbar.searchPlaceholder')}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-[#F7F8F5] border border-[#E0E5DD] rounded-md text-[#202820] placeholder:text-[#9AA49A] focus:outline-none focus:ring-2 focus:ring-[#24452D] focus:border-[#24452D] transition-colors"
              />
            </div>
            {/* Mobile search icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="lg:hidden p-1.5 text-[#9AA49A] hover:text-[#202820] rounded-md transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Language selector */}
        <div className="flex items-center gap-1 border border-[#E0E5DD] rounded-md px-2 py-1.5 bg-white">
          <Globe size={13} className="text-[#9AA49A]" />
          <select
            value={i18n.language}
            onChange={handleLanguageChange}
            aria-label={t('topbar.language')}
            className="text-xs text-[#687168] bg-transparent focus:outline-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.code.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* User avatar */}
        <div className="relative">
          <button
            onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : showSignInModal()}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-md hover:bg-[#F7F8F5] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#EAF0E6] flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#24452D] text-xs font-semibold">
                  {user ? user.name.charAt(0).toUpperCase() : '?'}
                </span>
              )}
            </div>
            <span className="text-sm text-[#202820] font-medium hidden md:inline max-w-[100px] truncate">
              {user ? user.name.split(' ')[0] : t('nav.signIn')}
            </span>
          </button>

          {isUserMenuOpen && user && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-[#E0E5DD] rounded-lg shadow-panel py-1 z-50">
              <div className="px-3 py-2 border-b border-[#E0E5DD]">
                <p className="text-sm font-medium text-[#202820] truncate">{user.name}</p>
                <p className="text-xs text-[#9AA49A] truncate">{user.email}</p>
              </div>
              <button
                onClick={() => { signOut(); setIsUserMenuOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                {t('nav.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>

      {isUserMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
      )}
    </header>
  )
}
