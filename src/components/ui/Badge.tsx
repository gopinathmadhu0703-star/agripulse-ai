import React from 'react'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-[#EAF0E6] text-[#24452D] ring-[#D0DCC9]',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger:  'bg-red-50 text-red-700 ring-red-200',
  info:    'bg-blue-50 text-blue-700 ring-blue-200',
  neutral: 'bg-[#F7F8F5] text-[#687168] ring-[#E0E5DD]',
}

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-[#24452D]',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  neutral: 'bg-[#9AA49A]',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export function Badge({ variant = 'neutral', size = 'sm', children, className = '', dot }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded font-medium ring-1',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {dot && (
        <span className={['w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant]].join(' ')} />
      )}
      {children}
    </span>
  )
}
