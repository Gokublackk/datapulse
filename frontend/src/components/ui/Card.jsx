/** Surface primitives. Everything visual in the app sits on one of these. */
export function Card({ as: Component = 'section', quiet = false, className = '', children, ...rest }) {
  return (
    <Component className={`${quiet ? 'dp-card-quiet' : 'dp-card'} ${className}`} {...rest}>
      {children}
    </Component>
  )
}

export function CardHeader({ title, subtitle, icon: Icon, actions, className = '', children }) {
  return (
    <header className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="dp-tile" aria-hidden="true">
            <Icon size={18} />
          </span>
        ) : null}
        <div className="min-w-0">
          {title ? <h2 className="truncate text-base font-bold text-ink">{title}</h2> : null}
          {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
          {children}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function CardBody({ className = '', children }) {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>
}

export function CardFooter({ className = '', children }) {
  return (
    <footer className={`flex flex-wrap items-center gap-2 border-t border-line px-4 py-3 sm:px-5 ${className}`}>
      {children}
    </footer>
  )
}

/** Section heading used between cards on a page. */
export function SectionTitle({ eyebrow, title, subtitle, actions, className = '' }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        {eyebrow ? <p className="dp-eyebrow">{eyebrow}</p> : null}
        <h2 className="mt-1 text-lg font-bold tracking-tight text-ink">{title}</h2>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
