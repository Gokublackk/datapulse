import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from './Button'

/** Neutral "nothing here yet" panel with an optional call to action. */
export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
      {Icon ? (
        <span className="dp-tile size-12" aria-hidden="true">
          <Icon size={22} />
        </span>
      ) : null}
      <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
      {description ? <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  )
}

/**
 * Failure panel. Shows the message the API gave us rather than a generic
 * string, because those messages are already human-readable (see apiClient).
 */
export function ErrorState({ error, onRetry, title = 'Something went wrong', className = '', compact = false }) {
  const message = typeof error === 'string' ? error : error?.message || 'Unexpected error.'

  if (compact) {
    return (
      <div className={`flex items-start gap-2.5 rounded-xl border border-danger/40 bg-danger/10 p-3 ${className}`} role="alert">
        <TriangleAlert size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm text-ink">{message}</p>
        {onRetry ? (
          <Button size="sm" variant="ghost" icon={RefreshCw} onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`} role="alert">
      <span className="grid size-12 place-items-center rounded-2xl bg-danger/15 text-danger" aria-hidden="true">
        <TriangleAlert size={22} />
      </span>
      <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-muted">{message}</p>
      {onRetry ? (
        <Button className="mt-5" variant="soft" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
