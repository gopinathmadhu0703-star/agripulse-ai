import React from 'react'
import { AlertTriangle, Info, CheckCircle2, XCircle, X } from 'lucide-react'

type AlertVariant = 'error' | 'warning' | 'info' | 'success'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  onDismiss?: () => void
  className?: string
}

const styles: Record<AlertVariant, { wrap: string; icon: React.ReactNode }> = {
  error:   {
    wrap: 'bg-red-50 border-red-200 text-red-800',
    icon: <XCircle size={15} className="text-red-500 shrink-0 mt-px" />,
  },
  warning: {
    wrap: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-px" />,
  },
  info:    {
    wrap: 'bg-[#EAF0E6] border-[#C8D9C2] text-[#24452D]',
    icon: <Info size={15} className="text-[#527A45] shrink-0 mt-px" />,
  },
  success: {
    wrap: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-px" />,
  },
}

export function Alert({ variant = 'info', title, children, onDismiss, className = '' }: AlertProps) {
  const s = styles[variant]
  return (
    <div
      role="alert"
      className={['flex gap-2.5 rounded-md border p-3.5 text-sm', s.wrap, className].join(' ')}
    >
      {s.icon}
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
