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
  sm:  'p-4',
  md:  'p-5',
  lg:  'p-6',
}

export function Card({ children, className = '', header, footer, padding = 'md' }: CardProps) {
  return (
    <div
      className={[
        'bg-white border border-[#E0E5DD] rounded-lg shadow-card',
        className,
      ].join(' ')}
    >
      {header && (
        <div className="px-5 py-3 border-b border-[#E0E5DD]">
          {typeof header === 'string' ? (
            <p className="text-sm font-semibold text-[#202820]">{header}</p>
          ) : (
            header
          )}
        </div>
      )}
      <div className={paddingClasses[padding]}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-[#E0E5DD] text-xs text-[#687168]">
          {footer}
        </div>
      )}
    </div>
  )
}
