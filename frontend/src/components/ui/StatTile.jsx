import { TrendingDown, TrendingUp } from 'lucide-react'
import { Skeleton } from './Skeleton'
import { TiltCard } from './GestureCards'

/** Headline metric card with 3D holographic tilt gesture. */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  delta,
  deltaLabel,
  tone = 'brand',
  loading = false,
  className = '',
}) {
  const positive = typeof delta === 'number' && delta > 0
  const negative = typeof delta === 'number' && delta < 0
  const TrendIcon = positive ? TrendingUp : TrendingDown

  return (
    <TiltCard className={`dp-card animate-rise p-4 sm:p-5 ${className}`}>

      <div className="flex items-start justify-between gap-3">
        <p className="dp-label">{label}</p>
        {Icon ? (
          <span
            className="dp-tile size-8 rounded-lg"
            style={tone === 'brand' ? undefined : { color: `var(--dp-${tone})`, background: `color-mix(in oklab, var(--dp-${tone}) 14%, transparent)` }}
            aria-hidden="true"
          >
            <Icon size={15} />
          </span>
        ) : null}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-24" />
      ) : (
        <p className="dp-num mt-2.5 text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">{value}</p>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {typeof delta === 'number' && delta !== 0 ? (
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold ${positive ? 'text-success' : 'text-danger'}`}
          >
            <TrendIcon size={12} aria-hidden="true" />
            {negative ? '' : '+'}
            {delta}
            {deltaLabel ? <span className="font-medium text-faint">{deltaLabel}</span> : null}
          </span>
        ) : null}
        {hint ? <span className="text-xs text-faint">{hint}</span> : null}
      </div>
    </TiltCard>
  )
}

/** Thin progress/quality meter. `value` is 0–100. */
export function ProgressBar({ value = 0, label, showValue = true, tone, className = '' }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className={className}>
      {label || showValue ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label ? <span className="text-xs font-semibold text-muted">{label}</span> : null}
          {showValue ? <span className="dp-num text-xs font-bold text-ink">{clamped.toFixed(0)}%</span> : null}
        </div>
      ) : null}
      <div
        className="dp-meter"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <span
          style={{
            width: `${clamped}%`,
            background: tone ? `var(--dp-${tone})` : undefined,
          }}
        />
      </div>
    </div>
  )
}
