import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Copy,
  Sheet,
} from 'lucide-react'
import { Button, IconButton } from '../ui/Button'
import { SearchInput } from '../ui/Field'
import { EmptyState } from '../ui/EmptyState'
import { Modal } from '../ui/Modal'
import { copyText, downloadCsv } from '../../lib/exporters'
import { formatCell, formatCompact, humanizeField } from '../../lib/format'
import { COLUMN_TYPE, toNumber } from '../../lib/profile'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useToast } from '../../context/ToastProvider'

const PAGE_SIZES = [25, 50, 100, 250]

function compareValues(a, b, numeric) {
  if (numeric) {
    const left = toNumber(a)
    const right = toNumber(b)
    if (left === null && right === null) return 0
    if (left === null) return 1
    if (right === null) return -1
    return left - right
  }
  const left = a === null || a === undefined ? '' : String(a)
  const right = b === null || b === undefined ? '' : String(b)
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
}

/**
 * Virtual-free but fast data grid: search, sort, paginate and hide columns over
 * the rows already in memory. Only the current page is rendered.
 */
export default function DataTable({ rows = [], columns = [], profile, filename = 'dataset' }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 200)
  const [sort, setSort] = useState({ column: null, direction: 'asc' })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [hidden, setHidden] = useState(() => new Set())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const toast = useToast()

  const visibleColumns = useMemo(() => columns.filter((column) => !hidden.has(column)), [columns, hidden])

  const numericColumns = useMemo(() => {
    const set = new Set()
    profile?.columns?.forEach((column) => {
      if (column.type === COLUMN_TYPE.NUMBER) set.add(column.name)
    })
    return set
  }, [profile])

  const filtered = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) =>
      visibleColumns.some((column) => String(row?.[column] ?? '').toLowerCase().includes(needle)),
    )
  }, [rows, debouncedQuery, visibleColumns])

  const sorted = useMemo(() => {
    if (!sort.column) return filtered
    const numeric = numericColumns.has(sort.column)
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => compareValues(a?.[sort.column], b?.[sort.column], numeric) * factor)
  }, [filtered, sort, numericColumns])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = useMemo(
    () => sorted.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [sorted, safePage, pageSize],
  )

  const toggleSort = (column) => {
    setPage(0)
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: numericColumns.has(column) ? 'desc' : 'asc' },
    )
  }

  const exportCsv = () => {
    downloadCsv(sorted, visibleColumns, `${filename.replace(/\.[^.]+$/, '')}-view.csv`)
    toast.success(`Exported ${formatCompact(sorted.length)} rows.`)
  }

  const copyRow = async () => {
    const copied = await copyText(JSON.stringify(detail?.row ?? {}, null, 2))
    if (copied) toast.success('Row copied as JSON.')
    else toast.error('The clipboard is not available in this browser.')
  }

  if (!columns.length) {
    return (
      <div className="dp-card">
        <EmptyState icon={Sheet} title="No columns" description="This dataset has no readable columns." />
      </div>
    )
  }

  return (
    <div className="dp-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3 sm:p-4">
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(0)
          }}
          placeholder={`Search ${formatCompact(rows.length)} rows…`}
          className="min-w-48 flex-1 sm:max-w-xs"
        />

        <div className="relative">
          <Button
            size="sm"
            variant="soft"
            icon={Columns3}
            onClick={() => setPickerOpen((open) => !open)}
            aria-expanded={pickerOpen}
          >
            Columns
            {hidden.size ? <span className="dp-num text-faint">({visibleColumns.length})</span> : null}
          </Button>
          {pickerOpen ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} aria-hidden="true" />
              <div className="dp-card dp-scroll absolute right-0 z-50 mt-2 max-h-72 w-64 animate-pop p-2">
                <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
                  <p className="dp-label">Visible columns</p>
                  <button
                    type="button"
                    onClick={() => setHidden(new Set())}
                    className="text-xs font-bold text-brand hover:underline"
                  >
                    Show all
                  </button>
                </div>
                {columns.map((column) => (
                  <label
                    key={column}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm text-ink transition-colors hover:bg-subtle"
                  >
                    <input
                      type="checkbox"
                      checked={!hidden.has(column)}
                      onChange={() =>
                        setHidden((current) => {
                          const next = new Set(current)
                          if (next.has(column)) next.delete(column)
                          else if (next.size < columns.length - 1) next.add(column)
                          return next
                        })
                      }
                      className="size-3.5 accent-[var(--dp-brand)]"
                    />
                    <span className="truncate">{humanizeField(column)}</span>
                  </label>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <Button size="sm" variant="soft" icon={Sheet} onClick={exportCsv}>
          Export CSV
        </Button>

        <p className="ml-auto text-xs text-faint">
          <span className="dp-num font-bold text-ink">{formatCompact(sorted.length)}</span>
          {sorted.length === rows.length ? ' rows' : ` of ${formatCompact(rows.length)} rows`}
        </p>
      </div>

      <div className="dp-scroll max-h-[36rem]">
        <table className="dp-table">
          <caption className="sr-only">
            Dataset rows, page {safePage + 1} of {pageCount}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-14 text-right">
                #
              </th>
              {visibleColumns.map((column) => {
                const active = sort.column === column
                const Icon = active ? (sort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
                return (
                  <th
                    key={column}
                    scope="col"
                    aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className={`flex w-full items-center gap-1.5 uppercase transition-colors hover:text-ink ${active ? 'text-brand' : ''}`}
                      title={`Sort by ${column}`}
                    >
                      {column}
                      <Icon size={11} className={active ? '' : 'opacity-40'} aria-hidden="true" />
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, index) => (
              <tr key={safePage * pageSize + index}>
                <td className="is-number text-faint">
                  <button
                    type="button"
                    onClick={() => setDetail({ number: safePage * pageSize + index + 1, row })}
                    title="Show every field in this row"
                    className="dp-num w-full text-right transition-colors hover:text-brand"
                  >
                    {safePage * pageSize + index + 1}
                  </button>
                </td>
                {visibleColumns.map((column) => {
                  const value = row?.[column]
                  const blank = value === null || value === undefined || value === ''
                  return (
                    <td
                      key={column}
                      className={`${numericColumns.has(column) ? 'is-number' : ''} ${blank ? 'is-null' : ''}`}
                      title={blank ? 'missing' : String(value)}
                    >
                      {formatCell(value)}
                    </td>
                  )
                })}
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="!max-w-none py-10 text-center text-muted">
                  No rows match “{debouncedQuery}”.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-3 sm:px-4">
        <label className="flex items-center gap-2 text-xs text-faint">
          Rows per page
          <select
            className="dp-select w-auto py-1.5 text-xs"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value))
              setPage(0)
            }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <IconButton
            icon={ChevronLeft}
            label="Previous page"
            className="size-8"
            disabled={safePage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          />
          <p className="dp-num text-xs text-muted">
            Page {safePage + 1} / {pageCount}
          </p>
          <IconButton
            icon={ChevronRight}
            label="Next page"
            className="size-8"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
          />
        </div>
      </div>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={`Row ${detail?.number ?? ''}`}
        description="Every field for this record, including the ones hidden in the table."
        size="lg"
        footer={
          <Button size="sm" variant="soft" icon={Copy} onClick={copyRow}>
            Copy as JSON
          </Button>
        }
      >
        <dl className="divide-y divide-line">
          {columns.map((column) => {
            const value = detail?.row?.[column]
            const blank = value === null || value === undefined || value === ''
            return (
              <div key={column} className="grid gap-1 py-2.5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
                <dt className="truncate text-xs font-semibold uppercase tracking-wider text-faint" title={column}>
                  {humanizeField(column)}
                </dt>
                <dd
                  className={`min-w-0 break-words text-sm ${
                    blank ? 'text-faint italic' : numericColumns.has(column) ? 'dp-num text-ink' : 'text-ink'
                  }`}
                >
                  {blank ? 'missing' : String(value)}
                </dd>
              </div>
            )
          })}
        </dl>
      </Modal>
    </div>
  )
}
