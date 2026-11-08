import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F7F8F5] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="flex-1 overflow-auto">
          {/* Page header */}
          <div className="px-6 py-4 bg-white border-b border-[#E0E5DD] flex items-center justify-between gap-4">
            <div>
              <h1 className="text-base font-semibold text-[#202820]">{title}</h1>
              {subtitle && (
                <p className="text-xs text-[#687168] mt-0.5">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>

          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
