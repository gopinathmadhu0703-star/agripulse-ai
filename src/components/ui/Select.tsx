import React from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
  helperText?: string
  required?: boolean
  placeholder?: string
}

export function Select({
  label,
  options,
  error,
  helperText,
  required,
  placeholder,
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-[#202820]">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
      </label>
      <select
        id={selectId}
        aria-describedby={error ? `${selectId}-error` : undefined}
        aria-invalid={!!error}
        className={[
          'rounded-md border px-3 py-2 text-sm text-[#202820] bg-white',
          'focus:outline-none focus:ring-2 focus:ring-[#24452D] focus:border-[#24452D]',
          'disabled:bg-[#F7F8F5] disabled:text-[#9AA49A] disabled:cursor-not-allowed',
          error ? 'border-red-400' : 'border-[#E0E5DD]',
          className,
        ].join(' ')}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${selectId}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-[#687168]">{helperText}</p>
      )}
    </div>
  )
}
