import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

/**
 * Page title block. `breadcrumbs` is `[{ label, to? }]`; the last entry is
 * rendered as the current page rather than a link.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  actions,
  meta,
  className = '',
}) {
  return (
    <header className={`animate-rise ${className}`}>
      {breadcrumbs.length ? (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-faint">
            {breadcrumbs.map((crumb, index) => {
              const last = index === breadcrumbs.length - 1
              return (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                  {crumb.to && !last ? (
                    <Link to={crumb.to} className="font-semibold transition-colors hover:text-ink">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? 'page' : undefined} className={last ? 'font-semibold text-muted' : ''}>
                      {crumb.label}
                    </span>
                  )}
                  {last ? null : <ChevronRight size={12} aria-hidden="true" />}
                </li>
              )
            })}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <p className="dp-eyebrow">{eyebrow}</p> : null}
          <h1 className="text-balance-tight mt-1.5 text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">
            {title}
          </h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p> : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
