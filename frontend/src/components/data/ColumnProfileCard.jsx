import { Binary, Calendar, Hash, ToggleLeft, Type } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { COLUMN_TYPE } from '../../lib/profile'
import { formatCompact, formatDate, formatNumber, formatPercent } from '../../lib/format'

const TYPE_META = {
  [COLUMN_TYPE.NUMBER]: { label: 'Number', icon: Hash, tone: 'brand' },
  [COLUMN_TYPE.DATE]: { label: 'Date', icon: Calendar, tone: 'neutral' },
  [COLUMN_TYPE.BOOLEAN]: { label: 'Boolean', icon: ToggleLeft, tone: 'neutral' },
  [COLUMN_TYPE.CATEGORY]: { label: 'Category', icon: Binary, tone: 'neutral' },
  [COLUMN_TYPE.TEXT]: { label: 'Text', icon: Type, tone: 'neutral' },
}

function Stat({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[0.6875rem] font-semibold uppercase tracking-wider text-faint">{label}</dt>
      <dd className="dp-num truncate text-sm font-bold text-ink">{value}</dd>
    </div>
  )
}

/** Pure-CSS distribution bars — cheap enough to render for every column. */
function Bars({ items, max }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.key} className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted" title={item.key}>
              {item.key}
            </p>
            <div className="dp-meter mt-1 h-1">
              <span style={{ width: `${max > 0 ? (item.count / max) * 100 : 0}%` }} />
            </div>
          </div>
          <p className="dp-num text-right text-xs font-bold text-ink">{formatCompact(item.count)}</p>
        </li>
      ))}
    </ul>
  )
}

/** One column's shape: type, completeness, spread and distribution. */
export default function ColumnProfileCard({ column, rowCount }) {
  const meta = TYPE_META[column.type] ?? TYPE_META[COLUMN_TYPE.TEXT]
  const Icon = meta.icon
  const stats = column.stats

  const bars =
    column.type === COLUMN_TYPE.NUMBER && column.histogram?.length
      ? column.histogram.map((bin) => ({ key: bin.label, count: bin.count }))
      : (column.top ?? []).map((entry) => ({ key: entry.value, count: entry.count }))

  const max = bars.reduce((peak, item) => Math.max(peak, item.count), 0)

  return (
    <article className="dp-card animate-rise flex flex-col p-4">
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={14} className="shrink-0 text-brand" aria-hidden="true" />
          <h3 className="truncate text-sm font-bold text-ink" title={column.name}>
            {column.name}
          </h3>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </header>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {column.missing > 0 ? (
          <Badge tone={column.missingPct > 20 ? 'danger' : 'warn'}>
            {formatPercent(column.missingPct)} missing
          </Badge>
        ) : (
          <Badge tone="success">complete</Badge>
        )}
        {column.isIdentifier ? <Badge>unique key</Badge> : null}
        {column.isConstant ? <Badge tone="warn">constant</Badge> : null}
        {column.outliers > 0 ? <Badge tone="warn">{formatCompact(column.outliers)} outliers</Badge> : null}
      </div>

      <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-line pt-3">
        <Stat label="Distinct" value={formatCompact(column.unique)} />
        <Stat label="Filled" value={formatCompact(column.present)} />
        {stats ? (
          <>
            <Stat label="Mean" value={formatNumber(stats.mean)} />
            <Stat label="Median" value={formatNumber(stats.median)} />
            <Stat label="Min" value={formatNumber(stats.min)} />
            <Stat label="Max" value={formatNumber(stats.max)} />
            <Stat label="Std dev" value={formatNumber(stats.stdDev)} />
            <Stat label="Sum" value={formatCompact(stats.sum)} />
          </>
        ) : null}
        {column.type === COLUMN_TYPE.DATE ? (
          <>
            <Stat label="Earliest" value={formatDate(column.firstDate)} />
            <Stat label="Latest" value={formatDate(column.lastDate)} />
          </>
        ) : null}
        {!stats && column.type !== COLUMN_TYPE.DATE && rowCount ? (
          <Stat label="Uniqueness" value={formatPercent(column.uniquePct)} />
        ) : null}
      </dl>

      {bars.length ? (
        <div className="mt-3.5 border-t border-line pt-3">
          <p className="dp-label mb-2">
            {column.type === COLUMN_TYPE.NUMBER ? 'Distribution' : 'Most frequent'}
          </p>
          <Bars items={bars.slice(0, 6)} max={max} />
        </div>
      ) : null}
    </article>
  )
}
