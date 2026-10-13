import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from './auth/AuthProvider'

export function Sidebar() {
  const { t } = useTranslation()
  const { user, showSignInModal, signOut } = useAuth()

  const navItems = [
    { path: '/dashboard', labelKey: 'nav.dashboard', icon: '📊' },
    { path: '/farms', labelKey: 'nav.farms', icon: '🏠' },
    { path: '/weather', labelKey: 'nav.weather', icon: '🌤️' },
    { path: '/advisor', labelKey: 'nav.advisor', icon: '💧' },
    { path: '/planner', labelKey: 'nav.planner', icon: '📅' },
    { path: '/history', labelKey: 'nav.history', icon: '📈' },
    { path: '/community', labelKey: 'nav.community', icon: '🌾' },
    { path: '/settings', labelKey: 'nav.settings', icon: '⚙️' },
    { path: '/help', labelKey: 'nav.help', icon: '❓' },
  ]

  return (
    <aside className="w-60 border-r border-gray-200 bg-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <span className="text-white text-lg">🌱</span>
          </div>
          <span className="text-lg font-semibold text-emerald-700">AgriPulse AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{t(item.labelKey as Parameters<typeof t>[0])}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        {user ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-emerald-700 font-medium text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <span className="text-base">🚪</span>
              <span>{t('nav.signOut')}</span>
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 text-sm">👤</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{t('nav.notSignedIn')}</p>
                <p className="text-xs text-gray-500">{t('nav.signInToSave')}</p>
              </div>
            </div>

            <button
              onClick={showSignInModal}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <span className="text-base">🔑</span>
              <span>{t('nav.signIn')}</span>
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
