import { ReactNode, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Sprout,
  Droplets,
  CalendarDays,
  Users,
  BarChart2,
} from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  actions?: ReactNode
}

// Core 5 nav items shown in mobile bottom bar (most-used)
const BOTTOM_NAV = [
  { path: '/dashboard', labelKey: 'nav.dashboard', Icon: LayoutDashboard },
  { path: '/farms',     labelKey: 'nav.farms',     Icon: Sprout },
  { path: '/advisor',   labelKey: 'nav.advisor',   Icon: Droplets },
  { path: '/planner',   labelKey: 'nav.planner',   Icon: CalendarDays },
  { path: '/community', labelKey: 'nav.community', Icon: Users },
  { path: '/history',   labelKey: 'nav.history',   Icon: BarChart2 },
]

export function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex">
      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <Sidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          {/* Page header */}
          <div className="px-4 lg:px-6 py-3 lg:py-4 bg-white border-b border-[#E0E5DD] flex items-center justify-between gap-4">
            <div>
              <h1 className="text-sm lg:text-base font-semibold text-[#202820]">{title}</h1>
              {subtitle && (
                <p className="text-xs text-[#687168] mt-0.5 hidden sm:block">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>

          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E0E5DD] flex items-stretch"
        aria-label="Mobile navigation"
      >
        {BOTTOM_NAV.map(({ path, labelKey, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              [
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors min-w-0',
                isActive ? 'text-[#24452D]' : 'text-[#9AA49A]',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <div className={[
                  'w-8 h-7 rounded-md flex items-center justify-center transition-colors',
                  isActive ? 'bg-[#EAF0E6]' : '',
                ].join(' ')}>
                  <Icon size={17} />
                </div>
                <span className="truncate w-full text-center px-0.5">
                  {t(labelKey as Parameters<typeof t>[0])}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
