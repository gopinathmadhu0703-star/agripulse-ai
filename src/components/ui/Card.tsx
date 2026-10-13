import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
  footer?: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({
  children,
  className = '',
  header,
  footer,
  padding = 'md',
}: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-lg border border-stone-200 shadow-sm',
        className,
      ].join(' ')}
    >
      {header && (
        <div className="px-5 py-3 border-b border-stone-100 font-medium text-stone-800">
          {header}
        </div>
      )}
      <div className={paddingClasses[padding]}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-stone-100 text-sm text-stone-500">
          {footer}
        </div>
      )}
    </div>
  )
}
