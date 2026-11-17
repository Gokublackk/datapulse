const decimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })
const precise = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
const compactFormatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const isBlank = (value) =>
  value === null || value === undefined || value === '' || Number.isNaN(value)

export function formatNumber(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return Number.isInteger(numeric) ? decimal.format(numeric) : precise.format(numeric)
}

export function formatCompact(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return Math.abs(numeric) >= 10_000 ? compactFormatter.format(numeric) : formatNumber(numeric)
}

export function formatPercent(value, digits = 1) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return `${numeric.toFixed(digits).replace(/\.0+$/, '')}%`
}

export function formatBytes(bytes) {
  const numeric = Number(bytes)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(numeric) / Math.log(1024)))
  const size = numeric / 1024 ** index
  return `${size >= 10 || index === 0 ? Math.round(size) : size.toFixed(1)} ${units[index]}`
}

export function formatDate(value, options = { dateStyle: 'medium' }) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(undefined, options).format(date)
}

export function formatRelative(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const units = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3600],
    ['minute', 60],
  ]
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit)
  }
  return formatter.format(seconds, 'second')
}

/** Renders any dataset cell as display text without hiding empty values. */
export function formatCell(value) {
  if (isBlank(value)) return '—'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return formatNumber(value)
  return String(value)
}

/** Shortens long labels for chart axes and chips. */
export function truncate(value, max = 24) {
  const text = String(value ?? '')
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** Turns `total_sales` / `totalSales` into `Total sales` for display. */
export function humanizeField(name) {
  const text = String(name ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .trim()
  if (!text) return '—'
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function fileExtensionLabel(value) {
  if (!value) return 'FILE'
  return String(value).replace(/^\./, '').toUpperCase()
}

/** Deterministic chart colour for a series index. */
export const CHART_COLOR_VARS = [
  'var(--dp-chart-1)',
  'var(--dp-chart-2)',
  'var(--dp-chart-3)',
  'var(--dp-chart-4)',
  'var(--dp-chart-5)',
  'var(--dp-chart-6)',
  'var(--dp-chart-7)',
  'var(--dp-chart-8)',
]

export const chartColor = (index) => CHART_COLOR_VARS[index % CHART_COLOR_VARS.length]

export function initialsOf(nameOrEmail) {
  const source = String(nameOrEmail ?? '').trim()
  if (!source) return 'DP'
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}
