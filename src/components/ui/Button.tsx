import React from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: React.ReactNode
  href?: string
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[#24452D] text-white hover:bg-[#1c3622] border border-[#24452D] hover:border-[#1c3622] disabled:bg-[#9AA49A] disabled:border-[#9AA49A]',
  secondary:
    'bg-white text-[#202820] border border-[#E0E5DD] hover:bg-[#EAF0E6] hover:border-[#527A45] disabled:text-[#9AA49A]',
  danger:
    'bg-red-600 text-white border border-red-600 hover:bg-red-700 hover:border-red-700 disabled:bg-red-300',
  ghost:
    'bg-transparent text-[#687168] border border-transparent hover:bg-[#EAF0E6] hover:text-[#24452D] disabled:text-[#9AA49A]',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  href,
  ...props
}: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24452D] focus-visible:ring-offset-1',
    'disabled:cursor-not-allowed',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].join(' ')

  const content = (
    <>
      {loading && <Loader2 className="animate-spin shrink-0" size={14} aria-hidden />}
      {children}
    </>
  )

  if (href) {
    return (
      <Link to={href} className={base}>
        {content}
      </Link>
    )
  }

  return (
    <button disabled={disabled || loading} className={base} {...props}>
      {content}
    </button>
  )
}
