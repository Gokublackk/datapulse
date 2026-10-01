const TONES = {
  neutral: '',
  brand: 'dp-badge-brand',
  success: 'dp-badge-success',
  warn: 'dp-badge-warn',
  danger: 'dp-badge-danger',
}

/** Compact status pill. `tone` maps onto the palette in index.css. */
export function Badge({ tone = 'neutral', icon: Icon, className = '', children, ...rest }) {
  return (
    <span className={`dp-badge ${TONES[tone] ?? ''} ${className}`} {...rest}>
      {Icon ? <Icon size={11} aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

/** Small monospace key hint, e.g. <Kbd>⌘</Kbd><Kbd>K</Kbd>. */
export function Kbd({ children, className = '' }) {
  return <kbd className={`dp-kbd ${className}`}>{children}</kbd>
}
