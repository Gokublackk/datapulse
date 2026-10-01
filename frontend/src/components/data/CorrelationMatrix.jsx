import { useState } from 'react'
import { EmptyState } from '../ui/EmptyState'
import { Badge } from '../ui/Badge'
import { ScanSearch } from 'lucide-react'
import { humanizeField, truncate } from '../../lib/format'

/** Blue for positive, amber for negative, opacity carries magnitude. */
function cellStyle(value) {
  if (value === null || value === undefined) return { background: 'var(--dp-subtle)', color: 'var(--dp-faint)' }
  const magnitude = Math.min(1, Math.abs(value))
  const base = value >= 0 ? 'var(--dp-chart-1)' : 'var(--dp-chart-4)'
  return {
    background: `color-mix(in oklab, ${base} ${Math.round(magnitude * 82)}%, transparent)`,
    color: magnitude > 0.55 ? '#fff' : 'var(--dp-ink)',
  }
}

function strengthLabel(value) {
  const magnitude = Math.abs(value)
  if (magnitude >= 0.85) return 'very strong'
  if (magnitude >= 0.7) return 'strong'
  if (magnitude >= 0.5) return 'moderate'
  if (magnitude >= 0.3) return 'weak'
  return 'negligible'
}

/**
 * Pearson correlation heatmap plus a ranked pair list.
 *
 * Clicking a cell surfaces the pair so the reading is not left to the eye.
 */
export default function CorrelationMatrix({ correlations, onExplore }) {
  const { names = [], matrix = [], pairs = [] } = correlations ?? {}
  const [selected, setSelected] = useState(null)

  if (names.length < 2) {
    return (
      <div className="dp-card">
        <EmptyState
          icon={ScanSearch}
          title="Not enough numeric columns"
          description="Correlation needs at least two numeric columns with overlapping values."
        />
      </div>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="dp-card overflow-hidden">
        <header className="border-b border-line px-4 py-3.5 sm:px-5">
          <h3 className="text-sm font-bold text-ink">Correlation heatmap</h3>
          <p className="mt-0.5 text-xs text-muted">
            Pearson r over rows where both values are present. Blue is positive, amber negative.
          </p>
        </header>

        <div className="dp-scroll p-3 sm:p-4">
          <table className="w-full border-separate border-spacing-0.5 text-xs">
            <caption className="sr-only">Correlation coefficients between numeric columns</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-surface p-1 text-left" />
                {names.map((name) => (
                  <th
                    key={name}
                    scope="col"
                    className="p-1 align-bottom text-[0.6875rem] font-bold text-muted"
                    title={name}
                  >
                    <span className="block max-w-14 truncate">{truncate(name, 9)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {names.map((rowName, rowIndex) => (
                <tr key={rowName}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 max-w-28 truncate bg-surface p-1 pr-2 text-left text-[0.6875rem] font-bold text-muted"
                    title={rowName}
                  >
                    {truncate(rowName, 14)}
                  </th>
                  {names.map((colName, colIndex) => {
                    const value = matrix[rowIndex]?.[colIndex]
                    const isSelf = rowIndex === colIndex
                    return (
                      <td key={colName} className="p-0">
                        <button
                          type="button"
                          disabled={isSelf || value === null || value === undefined}
                          onClick={() => setSelected({ x: rowName, y: colName, value })}
                          className="dp-num grid h-9 w-full min-w-12 place-items-center rounded-md font-bold transition-transform enabled:hover:scale-105"
                          style={cellStyle(isSelf ? 1 : value)}
                          title={`${rowName} vs ${colName}: ${value === null || value === undefined ? 'n/a' : value.toFixed(3)}`}
                        >
                          {value === null || value === undefined ? '·' : value.toFixed(2)}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dp-card flex flex-col overflow-hidden">
        <header className="border-b border-line px-4 py-3.5">
          <h3 className="text-sm font-bold text-ink">Strongest relationships</h3>
          <p className="mt-0.5 text-xs text-muted">Ranked by absolute r.</p>
        </header>

        {selected ? (
          <div className="border-b border-line bg-subtle px-4 py-3">
            <p className="text-xs font-bold text-ink">
              {humanizeField(selected.x)} ↔ {humanizeField(selected.y)}
            </p>
            <p className="dp-num mt-1 text-lg font-bold text-brand">{selected.value?.toFixed(3) ?? '—'}</p>
            <p className="mt-0.5 text-xs text-muted">
              {selected.value === null || selected.value === undefined
                ? 'Not enough overlapping rows.'
                : `${strengthLabel(selected.value)} ${selected.value >= 0 ? 'positive' : 'negative'} relationship`}
            </p>
          </div>
        ) : null}

        <ul className="dp-scroll max-h-96 divide-y divide-line">
          {pairs.slice(0, 14).map((pair) => (
            <li key={`${pair.x}-${pair.y}`}>
              <button
                type="button"
                onClick={() => {
                  setSelected(pair)
                  onExplore?.(pair)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-ink">
                    {humanizeField(pair.x)} ↔ {humanizeField(pair.y)}
                  </span>
                  <span className="block text-[0.6875rem] text-faint">{strengthLabel(pair.value)}</span>
                </span>
                <Badge tone={Math.abs(pair.value) >= 0.5 ? 'brand' : 'neutral'} className="dp-num shrink-0">
                  {pair.value.toFixed(2)}
                </Badge>
              </button>
            </li>
          ))}
          {pairs.length === 0 ? (
            <li className="px-4 py-8 text-center text-xs text-faint">No computable pairs.</li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
