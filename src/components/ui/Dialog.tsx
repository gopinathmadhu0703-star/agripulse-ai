import React, { useEffect } from 'react'

interface DialogProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  actions?: React.ReactNode
}

export function Dialog({ open, title, onClose, children, actions }: DialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <h2 id="dialog-title" className="text-base font-semibold text-stone-800">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-stone-400 hover:text-stone-600 transition-colors ml-4"
          >
            ✕
          </button>
        </div>
        <div className="text-sm text-stone-600 mb-5">{children}</div>
        {actions && (
          <div className="flex justify-end gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}
