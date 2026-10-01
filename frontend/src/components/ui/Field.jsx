import { forwardRef, useId } from 'react'
import { Search, X } from 'lucide-react'

/** Labelled text input. The label/description ids are wired for screen readers. */
export const Input = forwardRef(function Input(
  { label, hint, error, id, className = '', wrapperClassName = '', ...rest },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = hint || error ? `${inputId}-hint` : undefined

  return (
    <div className={wrapperClassName}>
      {label ? (
        <label htmlFor={inputId} className="dp-label mb-1.5">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={`dp-input ${error ? 'border-danger' : ''} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={hintId}
        {...rest}
      />
      {hint || error ? (
        <p id={hintId} className={`mt-1.5 text-xs ${error ? 'text-danger' : 'text-faint'}`}>
          {error || hint}
        </p>
      ) : null}
    </div>
  )
})

/** Native select — keeps mobile pickers and keyboard behaviour for free. */
export const Select = forwardRef(function Select(
  { label, hint, options = [], id, className = '', wrapperClassName = '', children, ...rest },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className={wrapperClassName}>
      {label ? (
        <label htmlFor={selectId} className="dp-label mb-1.5">
          {label}
        </label>
      ) : null}
      <select ref={ref} id={selectId} className={`dp-select ${className}`} {...rest}>
        {children ??
          options.map((option) => {
            const value = typeof option === 'string' ? option : option.value
            const optionLabel = typeof option === 'string' ? option : option.label
            return (
              <option key={value} value={value} disabled={option?.disabled}>
                {optionLabel}
              </option>
            )
          })}
      </select>
      {hint ? <p className="mt-1.5 text-xs text-faint">{hint}</p> : null}
    </div>
  )
})

/** Search field with a leading icon and a clear button once it has content. */
export function SearchInput({ value, onChange, placeholder = 'Search…', className = '', ...rest }) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="dp-input pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
        {...rest}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="dp-btn dp-btn-icon dp-btn-ghost absolute right-1 top-1/2 size-7 -translate-y-1/2"
        >
          <X size={13} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
