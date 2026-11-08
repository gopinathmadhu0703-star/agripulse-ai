import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Sprout,
  CloudSun,
  Droplets,
  CalendarDays,
  BarChart2,
  Users,
  Settings,
  HelpCircle,
  LogIn,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from './auth/AuthProvider'

const navItems = [
  { path: '/dashboard', labelKey: 'nav.dashboard', Icon: LayoutDashboard },
  { path: '/farms',     labelKey: 'nav.farms',     Icon: Sprout },
  { path: '/weather',   labelKey: 'nav.weather',   Icon: CloudSun },
  { path: '/advisor',   labelKey: 'nav.advisor',   Icon: Droplets },
  { path: '/planner',   labelKey: 'nav.planner',   Icon: CalendarDays },
  { path: '/history',   labelKey: 'nav.history',   Icon: BarChart2 },
  { path: '/community', labelKey: 'nav.community', Icon: Users },
]

const bottomItems = [
  { path: '/settings', labelKey: 'nav.settings', Icon: Settings },
  { path: '/help',     labelKey: 'nav.help',     Icon: HelpCircle },
]

export function Sidebar() {
  const { t } = useTranslation()
  const { user, showSignInModal, signOut } = useAuth()

  return (
    <aside className="w-56 flex-shrink-0 border-r border-[#E0E5DD] bg-white flex flex-col">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-[#E0E5DD]">
        <div className="w-6 h-6 rounded bg-[#24452D] flex items-center justify-center flex-shrink-0">
          <Sprout size={14} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-[#24452D] tracking-tight">AgriPulse AI</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ path, labelKey, Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#EAF0E6] text-[#24452D]'
                      : 'text-[#687168] hover:bg-[#F7F8F5] hover:text-[#202820]',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} className={isActive ? 'text-[#24452D]' : 'text-[#9AA49A]'} />
                    <span className="truncate">{t(labelKey as Parameters<typeof t>[0])}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-3 pt-3 border-t border-[#E0E5DD] px-2">
          <ul className="space-y-0.5">
            {bottomItems.map(({ path, labelKey, Icon }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#EAF0E6] text-[#24452D]'
                        : 'text-[#687168] hover:bg-[#F7F8F5] hover:text-[#202820]',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={15} className={isActive ? 'text-[#24452D]' : 'text-[#9AA49A]'} />
                      <span className="truncate">{t(labelKey as Parameters<typeof t>[0])}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-[#E0E5DD] p-3">
        {user ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-7 h-7 rounded-full bg-[#EAF0E6] flex items-center justify-center overflow-hidden flex-shrink-0">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#24452D] text-xs font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#202820] truncate">{user.name}</p>
                <p className="text-2xs text-[#9AA49A] truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#687168] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut size={13} />
              <span>{t('nav.signOut')}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={showSignInModal}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#24452D] hover:bg-[#1c3622] rounded-md transition-colors"
          >
            <LogIn size={14} />
            <span>{t('nav.signIn')}</span>
            <ChevronRight size={13} className="ml-auto opacity-60" />
          </button>
        )}
      </div>
    </aside>
  )
}
