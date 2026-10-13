import { useState } from 'react'
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
        className="relative p-2 rounded-md text-stone-500 hover:bg-stone-100 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {active.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {active.length > 9 ? '9+' : active.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-stone-200 z-20 max-h-96 overflow-y-auto">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <p className="font-semibold text-sm text-stone-800">Notifications</p>
              {active.length > 0 && (
                <button
                  onClick={() => active.forEach((n) => onDismiss(n.id))}
                  className="text-xs text-forest-600 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            {active.length === 0 ? (
              <p className="text-sm text-stone-500 px-4 py-6 text-center">No notifications</p>
            ) : (
              <ul>
                {active.map((n) => (
                  <li
                    key={n.id}
                    className="px-4 py-3 border-b border-stone-50 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-stone-800">{n.title}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{n.message}</p>
                        <p className="text-xs text-stone-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => onDismiss(n.id)}
                        aria-label="Dismiss notification"
                        className="text-stone-300 hover:text-stone-500 shrink-0 text-xs"
                      >
                        ✕
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
