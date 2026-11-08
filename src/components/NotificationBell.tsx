import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import type { NotificationItem } from '../types'
import { timeAgo } from '../utils/formatters'

interface NotificationBellProps {
  notifications: NotificationItem[]
  onDismiss: (id: string) => void
}

export function NotificationBell({ notifications, onDismiss }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const active = notifications.filter((n) => !n.dismissed)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications — ${active.length} unread`}
        className="relative p-2 rounded-md text-[#687168] hover:bg-[#F7F8F5] transition-colors"
      >
        <Bell size={16} aria-hidden />
        {active.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {active.length > 9 ? '9+' : active.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-[#E0E5DD] z-20 max-h-96 overflow-y-auto">
            <div className="px-4 py-3 border-b border-[#F7F8F5] flex items-center justify-between">
              <p className="font-semibold text-sm text-[#202820]">Notifications</p>
              {active.length > 0 && (
                <button
                  onClick={() => active.forEach((n) => onDismiss(n.id))}
                  className="text-xs text-[#527A45] hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            {active.length === 0 ? (
              <p className="text-sm text-[#687168] px-4 py-6 text-center">No notifications</p>
            ) : (
              <ul>
                {active.map((n) => (
                  <li
                    key={n.id}
                    className="px-4 py-3 border-b border-[#F7F8F5] hover:bg-[#F7F8F5] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[#202820]">{n.title}</p>
                        <p className="text-xs text-[#687168] mt-0.5">{n.message}</p>
                        <p className="text-xs text-[#9AA49A] mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => onDismiss(n.id)}
                        aria-label="Dismiss notification"
                        className="text-[#9AA49A] hover:text-[#202820] shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
