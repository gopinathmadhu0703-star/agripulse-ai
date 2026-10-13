import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  required?: boolean
}

export function Input({
  label,
  error,
  helperText,
  required,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-stone-700"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
      </label>
      <input
        id={inputId}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-hint` : undefined}
        aria-invalid={!!error}
        className={[
          'rounded-md border px-3 py-2 text-sm text-stone-800 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500',
          'placeholder:text-stone-400',
          'disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed',
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-stone-300',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-hint`} className="text-xs text-stone-500">
          {helperText}
        </p>
      )}
    </div>
  )
}
