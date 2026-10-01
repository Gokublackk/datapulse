import { useMemo, useState } from 'react'
import { Filter, Plus, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import ChartCard from './ChartCard'
import { Button, IconButton } from '../ui/Button'
import { Select } from '../ui/Field'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import {
  AGGREGATIONS,
  COLUMN_TYPE,
  DATE_GRAINS,
  aggregateRows,
  applyFilters,
  distinctValues,
  toNumber,
} from '../../lib/profile'
import { formatCompact, humanizeField } from '../../lib/format'

const SORTS = [
  { value: 'value-desc', label: 'Value, high → low' },
  { value: 'value-asc', label: 'Value, low → high' },
  { value: 'label-asc', label: 'Label, A → Z' },
  { value: 'label-desc', label: 'Label, Z → A' },
]

const LIMITS = [5, 10, 15, 20, 30, 50, 0]
const CHART_OPTIONS = [
  { value: 'bar', label: 'Bar' },
  { value: 'hbar', label: 'Horizontal bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'donut', label: 'Donut' },
  { value: 'pie', label: 'Pie' },
  { value: 'radar', label: 'Radar' },
  { value: 'scatter', label: 'Scatter (measure vs measure)' },
]

/**
 * Ad-hoc chart builder. Everything runs on the rows already in memory, so
 * changing a control repaints instantly with no request.
 *
 * `initial` seeds the controls once, at mount — pass a changing `key` from the
 * parent to re-seed it (that is how the studio's "explore this" links work).
 */
export default function VisualExplorer({ rows = [], profile, initial }) {
  const dimensionOptions = useMemo(
    () => profile?.dimensions?.map((column) => ({ value: column.name, label: humanizeField(column.name) })) ?? [],
    [profile],
  )
  const measureOptions = useMemo(
    () => profile?.measures?.map((column) => ({ value: column.name, label: humanizeField(column.name) })) ?? [],
    [profile],
  )
  const filterableOptions = useMemo(
    () =>
      profile?.columns
        ?.filter((column) => column.type !== COLUMN_TYPE.NUMBER && column.unique <= 200 && !column.isConstant)
        .map((column) => ({ value: column.name, label: humanizeField(column.name) })) ?? [],
    [profile],
  )

  const [chartType, setChartType] = useState(initial?.chartType ?? 'bar')
  const [pickedDimension, setDimension] = useState(initial?.dimension ?? '')
  const [pickedMeasure, setMeasure] = useState(initial?.measure ?? '')
  const [pickedMeasureY, setMeasureY] = useState(initial?.measureY ?? '')
  const [aggregation, setAggregation] = useState(initial?.aggregation ?? 'sum')
  const [dateGrain, setDateGrain] = useState('month')
  const [sort, setSort] = useState('value-desc')
  const [limit, setLimit] = useState(15)
  const [filters, setFilters] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  // Resolved at render time rather than synced through an effect, so the
  // builder still lands on a sensible column when the profile only arrives on
  // a later render, and a column that disappears cannot strand the controls.
  const dimension = pickedDimension || dimensionOptions[0]?.value || ''
  const measure = pickedMeasure || measureOptions[0]?.value || ''
  const measureY = pickedMeasureY || measureOptions[1]?.value || measureOptions[0]?.value || ''

  const isScatter = chartType === 'scatter'
  const dimensionColumn = profile?.byName?.[dimension]
  const isDateDimension = dimensionColumn?.type === COLUMN_TYPE.DATE
  const needsMeasure = aggregation !== 'count' && aggregation !== 'distinct'

  const filteredRows = useMemo(() => applyFilters(rows, filters), [rows, filters])

  const data = useMemo(() => {
    if (isScatter) {
      if (!measure || !measureY) return []
      const points = []
      for (const row of filteredRows) {
        const x = toNumber(row?.[measure])
        const y = toNumber(row?.[measureY])
        if (x !== null && y !== null) points.push({ x, y })
        if (points.length >= 4000) break
      }
      return points
    }
    return aggregateRows(filteredRows, {
      dimension,
      measure: needsMeasure ? measure : dimension,
      aggregation,
      limit,
      sort,
      dateGrain: isDateDimension ? dateGrain : 'none',
    })
  }, [
    isScatter,
    filteredRows,
    dimension,
    measure,
    measureY,
    aggregation,
    limit,
    sort,
    dateGrain,
    isDateDimension,
    needsMeasure,
  ])

  const reset = () => {
    setChartType('bar')
    setAggregation('sum')
    setSort('value-desc')
    setLimit(15)
    setFilters([])
    setDateGrain('month')
    setDimension('')
    setMeasure('')
    setMeasureY('')
  }

  if (!dimensionOptions.length && !measureOptions.length) {
    return (
      <div className="dp-card">
        <EmptyState
          icon={SlidersHorizontal}
          title="Nothing to explore yet"
          description="This dataset has no groupable or numeric columns, so there is nothing to chart interactively."
        />
      </div>
    )
  }

  const title = isScatter
    ? `${humanizeField(measure)} vs ${humanizeField(measureY)}`
    : `${AGGREGATIONS.find((item) => item.id === aggregation)?.label ?? 'Sum'} of ${
        needsMeasure ? humanizeField(measure) : 'rows'
      } by ${humanizeField(dimension)}`

  return (
    <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="dp-card h-fit p-4 sm:p-5">
        <header className="mb-4 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
            <SlidersHorizontal size={15} className="text-brand" aria-hidden="true" />
            Chart builder
          </h3>
          <IconButton icon={RotateCcw} label="Reset chart builder" onClick={reset} className="size-8" />
        </header>

        <div className="space-y-3.5">
          <Select
            label="Chart type"
            value={chartType}
            onChange={(event) => setChartType(event.target.value)}
            options={CHART_OPTIONS.filter((option) => option.value !== 'scatter' || measureOptions.length >= 2)}
          />

          {isScatter ? (
            <>
              <Select
                label="X axis (measure)"
                value={measure}
                onChange={(event) => setMeasure(event.target.value)}
                options={measureOptions}
              />
              <Select
                label="Y axis (measure)"
                value={measureY}
                onChange={(event) => setMeasureY(event.target.value)}
                options={measureOptions}
              />
            </>
          ) : (
            <>
              <Select
                label="Group by"
                value={dimension}
                onChange={(event) => setDimension(event.target.value)}
                options={dimensionOptions}
              />
              <Select
                label="Aggregation"
                value={aggregation}
                onChange={(event) => setAggregation(event.target.value)}
                options={AGGREGATIONS.map((item) => ({ value: item.id, label: item.label }))}
              />
              {needsMeasure ? (
                <Select
                  label="Measure"
                  value={measure}
                  onChange={(event) => setMeasure(event.target.value)}
                  options={measureOptions}
                  hint={measureOptions.length ? undefined : 'No numeric columns available'}
                />
              ) : null}
              {isDateDimension ? (
                <Select
                  label="Date grain"
                  value={dateGrain}
                  onChange={(event) => setDateGrain(event.target.value)}
                  options={DATE_GRAINS.map((item) => ({ value: item.id, label: item.label }))}
                />
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  options={SORTS}
                />
                <Select
                  label="Show"
                  value={String(limit)}
                  onChange={(event) => setLimit(Number(event.target.value))}
                  options={LIMITS.map((value) => ({
                    value: String(value),
                    label: value === 0 ? 'All groups' : `Top ${value}`,
                  }))}
                />
              </div>
            </>
          )}

          {filterableOptions.length ? (
            <div className="border-t border-line pt-3.5">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters((open) => !open)}
                  aria-expanded={showFilters}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-faint transition-colors hover:text-ink"
                >
                  <Filter size={13} aria-hidden="true" />
                  Filters
                  {filters.length ? <Badge tone="brand">{filters.length}</Badge> : null}
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Plus}
                  onClick={() => {
                    setShowFilters(true)
                    setFilters((current) => [...current, { column: filterableOptions[0].value, value: '' }])
                  }}
                >
                  Add
                </Button>
              </div>

              {showFilters ? (
                <div className="mt-3 space-y-2.5">
                  {filters.length === 0 ? (
                    <p className="text-xs text-faint">No filters. Add one to narrow the rows being charted.</p>
                  ) : null}
                  {filters.map((filter, index) => (
                    <div key={index} className="dp-card-quiet space-y-2 p-2.5">
                      <div className="flex items-center gap-2">
                        <select
                          className="dp-select"
                          value={filter.column}
                          aria-label="Filter column"
                          onChange={(event) =>
                            setFilters((current) =>
                              current.map((item, position) =>
                                position === index ? { column: event.target.value, value: '' } : item,
                              ),
                            )
                          }
                        >
                          {filterableOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <IconButton
                          icon={X}
                          label="Remove filter"
                          className="size-8 shrink-0"
                          onClick={() =>
                            setFilters((current) => current.filter((_, position) => position !== index))
                          }
                        />
                      </div>
                      <select
                        className="dp-select"
                        value={filter.value}
                        aria-label="Filter value"
                        onChange={(event) =>
                          setFilters((current) =>
                            current.map((item, position) =>
                              position === index ? { ...item, value: event.target.value } : item,
                            ),
                          )
                        }
                      >
                        <option value="">Any value</option>
                        {distinctValues(rows, filter.column).map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <p className="border-t border-line pt-3 text-xs text-faint">
            Charting <span className="dp-num font-bold text-ink">{formatCompact(filteredRows.length)}</span> of{' '}
            {formatCompact(rows.length)} rows
            {isScatter ? ' · scatter samples the first 4,000 complete pairs' : ''}
          </p>
        </div>
      </aside>

      <ChartCard
        key={`${chartType}-${dimension}-${measure}-${measureY}`}
        title={title}
        chartType={chartType}
        data={data}
        xLabel={isScatter ? measure : dimension}
        yLabel={isScatter ? measureY : needsMeasure ? measure : 'rows'}
        height={420}
        allowSwitch={false}
        reason={
          data.length === 0
            ? 'No rows match the current selection. Try clearing a filter or picking another column.'
            : undefined
        }
      />
    </div>
  )
}
