import { CircleCheckBig, Copy, Rows3, Trash2, TriangleAlert } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/StatTile'
import { Skeleton } from '../ui/Skeleton'
import { ErrorState } from '../ui/EmptyState'
import { formatCompact, formatNumber, formatPercent, humanizeField } from '../../lib/format'

function Row({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span
        className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg"
        style={{
          color: tone ? `var(--dp-${tone})` : 'var(--dp-muted)',
          background: tone ? `color-mix(in oklab, var(--dp-${tone}) 13%, transparent)` : 'var(--dp-subtle)',
        }}
        aria-hidden="true"
      >
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      <p className="dp-num shrink-0 text-sm font-bold text-ink">{value}</p>
    </div>
  )
}

function scoreTone(score) {
  if (score >= 90) return 'success'
  if (score >= 70) return 'warn'
  return 'danger'
}

/**
 * The backend's ingestion report next to what we measured locally.
 *
 * `report` is the server's cleaning summary; `profile` is our own pass over the
 * rows. Showing both makes it obvious when cleaning changed the shape.
 */
export default function QualityReport({ report, profile, loading = false, error, onRetry }) {
  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="dp-card space-y-3 p-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="dp-card space-y-3 p-5">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) return <ErrorState error={error} onRetry={onRetry} title="Quality report unavailable" />

  const score = Number(report?.qualityScore ?? profile?.completeness ?? 0)
  const removed = (report?.emptyRowsRemoved ?? 0) + (report?.duplicateRowsRemoved ?? 0)
  const worst = profile?.columnsWithMissing?.slice(0, 6) ?? []

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="dp-card flex flex-col justify-center p-5 text-center">
          <p className="dp-label">Quality score</p>
          <p
            className="dp-num mt-2 text-5xl font-bold tracking-tight"
            style={{ color: `var(--dp-${scoreTone(score)})` }}
          >
            {Math.round(score)}
          </p>
          <p className="mt-1 text-xs text-muted">out of 100</p>
          <ProgressBar className="mt-4" value={score} showValue={false} tone={scoreTone(score)} />
          <Badge tone={scoreTone(score)} className="mx-auto mt-3">
            {score >= 90 ? 'Analysis ready' : score >= 70 ? 'Usable with caveats' : 'Needs cleaning'}
          </Badge>
        </div>

        <div className="dp-card p-4 sm:p-5">
          <h3 className="text-sm font-bold text-ink">Ingestion report</h3>
          <p className="mt-0.5 text-xs text-muted">What the backend did to the file when it was uploaded.</p>
          <div className="mt-2 divide-y divide-line">
            <Row
              icon={Rows3}
              label="Rows kept"
              hint={
                report?.originalRows
                  ? `${formatCompact(report.originalRows)} rows in the source file`
                  : 'Rows available for analysis'
              }
              value={formatCompact(report?.cleanedRows ?? profile?.rowCount ?? 0)}
              tone="success"
            />
            <Row
              icon={Trash2}
              label="Empty rows removed"
              hint="Rows that were entirely blank"
              value={formatCompact(report?.emptyRowsRemoved ?? 0)}
              tone={report?.emptyRowsRemoved ? 'warn' : undefined}
            />
            <Row
              icon={Copy}
              label="Duplicate rows removed"
              hint="Exact repeats of an earlier row"
              value={formatCompact(report?.duplicateRowsRemoved ?? 0)}
              tone={report?.duplicateRowsRemoved ? 'warn' : undefined}
            />
            <Row
              icon={report?.missingValuesRemaining ? TriangleAlert : CircleCheckBig}
              label="Missing values remaining"
              hint={
                profile
                  ? `Local pass measured ${formatCompact(profile.missingCells)} empty cells (${formatPercent(100 - profile.completeness)})`
                  : 'Cells still empty after cleaning'
              }
              value={formatCompact(report?.missingValuesRemaining ?? profile?.missingCells ?? 0)}
              tone={report?.missingValuesRemaining ? 'warn' : 'success'}
            />
            {removed > 0 && report?.originalRows ? (
              <Row
                icon={Rows3}
                label="Rows dropped in cleaning"
                hint={`${formatPercent((removed / report.originalRows) * 100)} of the original file`}
                value={formatCompact(removed)}
                tone="warn"
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="dp-card p-4 sm:p-5">
          <h3 className="text-sm font-bold text-ink">Columns with gaps</h3>
          <p className="mt-0.5 text-xs text-muted">Measured locally on the rows returned by the API.</p>
          {worst.length ? (
            <ul className="mt-3 space-y-3">
              {worst.map((column) => (
                <li key={column.name}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink" title={column.name}>
                      {humanizeField(column.name)}
                    </p>
                    <p className="dp-num shrink-0 text-xs font-bold text-muted">
                      {formatNumber(column.missing)} · {formatPercent(column.missingPct)}
                    </p>
                  </div>
                  <ProgressBar
                    className="mt-1.5"
                    value={column.missingPct}
                    showValue={false}
                    tone={column.missingPct > 20 ? 'danger' : 'warn'}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm text-success">
              <CircleCheckBig size={15} aria-hidden="true" />
              No missing values in any column.
            </p>
          )}
        </div>

        <div className="dp-card p-4 sm:p-5">
          <h3 className="text-sm font-bold text-ink">Detected numeric columns</h3>
          <p className="mt-0.5 text-xs text-muted">
            The backend flagged these as numeric during ingestion; DataPulse re-infers types locally too.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(report?.numericColumnsDetected?.length
              ? report.numericColumnsDetected
              : profile?.numeric?.map((column) => column.name) ?? []
            ).map((name) => (
              <Badge key={name} tone="brand">
                {name}
              </Badge>
            ))}
            {!report?.numericColumnsDetected?.length && !profile?.numeric?.length ? (
              <p className="text-sm text-muted">None detected.</p>
            ) : null}
          </div>

          {profile ? (
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
              <div>
                <dt className="dp-label">Duplicate rows (local)</dt>
                <dd className="dp-num text-lg font-bold text-ink">{formatCompact(profile.duplicateRows)}</dd>
              </div>
              <div>
                <dt className="dp-label">Completeness</dt>
                <dd className="dp-num text-lg font-bold text-ink">{formatPercent(profile.completeness)}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      </div>
    </div>
  )
}
