import React from 'react'

type AlertVariant = 'error' | 'warning' | 'info' | 'success'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  onDismiss?: () => void
  className?: string
}

const variantClasses: Record<AlertVariant, string> = {
  error:   'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
}

const icons: Record<AlertVariant, string> = {
  error:   '⚠️',
  warning: '⚡',
  info:    'ℹ️',
  success: '✅',
}

export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}: AlertProps) {
  return (
    <div
      role="alert"
      className={[
        'flex gap-3 rounded-lg border p-4 text-sm',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      <span className="shrink-0 text-base" aria-hidden>{icons[variant]}</span>
      <div className="flex-1">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  )
}
