import { forwardRef } from 'react'
import { LoaderCircle } from 'lucide-react'

const VARIANTS = {
  primary: 'dp-btn-primary',
  soft: 'dp-btn-soft',
  ghost: 'dp-btn-ghost',
  danger: 'dp-btn-danger',
}

const SIZES = {
  sm: 'dp-btn-sm',
  md: '',
  lg: 'dp-btn-lg',
}

/**
 * The single button in the app. `loading` keeps the label in place and swaps
 * the leading icon for a spinner so the control does not resize mid-request.
 */
export const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'soft',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    disabled = false,
    block = false,
    className = '',
    children,
    ...rest
  },
  ref,
) {
  const classes = [
    'dp-btn',
    VARIANTS[variant] ?? VARIANTS.soft,
    SIZES[size] ?? '',
    block ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const iconSize = size === 'lg' ? 18 : 16

  return (
    <Component
      ref={ref}
      className={classes}
      disabled={Component === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      aria-disabled={Component !== 'button' && (disabled || loading) ? true : undefined}
      {...rest}
    >
      {loading ? (
        <LoaderCircle size={iconSize} className="animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={iconSize} aria-hidden="true" />
      ) : null}
      {children}
      {IconRight && !loading ? <IconRight size={iconSize} aria-hidden="true" /> : null}
    </Component>
  )
})

/** Square, label-less button. `label` becomes the accessible name. */
export const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, variant = 'ghost', size = 18, className = '', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      title={label}
      aria-label={label}
      className={`dp-btn dp-btn-icon ${VARIANTS[variant] ?? VARIANTS.ghost} ${className}`}
      {...rest}
    >
      <Icon size={size} aria-hidden="true" />
    </button>
  )
})
