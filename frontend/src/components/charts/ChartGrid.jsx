import { ChartColumn } from 'lucide-react'
import ChartCard from './ChartCard'
import { SkeletonCard } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { humanizeField } from '../../lib/format'
import { normaliseChartType } from './ChartRenderer'

/**
 * Reshapes a backend series into `[{ label, value }]`.
 *
 * `/charts/{id}/data` returns rows keyed by the chart's own axis names, and
 * histograms come back as a flat array of raw numbers instead of objects.
 */
export function toChartData(series, chart) {
  const rows = series?.rows ?? []
  if (!rows.length) return []

  const kind = normaliseChartType(series?.chartType ?? chart?.chartType)
  const xKey = series?.xAxis ?? chart?.xAxis
  const yKey = series?.yAxis ?? chart?.yAxis

  if (typeof rows[0] !== 'object' || rows[0] === null) {
    // Histogram payload: bare values. Bucket them by value so the bars mean
    // something rather than plotting an index on the x axis.
    const counts = new Map()
    for (const value of rows) {
      const key = String(value)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => Number(a.label) - Number(b.label) || a.label.localeCompare(b.label))
  }

  if (kind === 'scatter') {
    return rows
      .map((row) => ({ x: Number(row?.[xKey]), y: Number(row?.[yKey]) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
  }

  return rows
    .map((row) => {
      const label = xKey && xKey in row ? row[xKey] : Object.values(row)[0]
      const raw = yKey && yKey in row ? row[yKey] : Object.values(row)[1]
      const value = Number(raw)
      return { label: String(label ?? '—'), value: Number.isFinite(value) ? value : 0 }
    })
    .filter((point) => point.label !== 'undefined')
}

/** Renders the stored recommendation set returned by `loadChartBundle`. */
export default function ChartGrid({ charts = [], series = {}, loading = false, emptyAction }) {
  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonCard key={index} className="h-80" />
        ))}
      </div>
    )
  }

  if (!charts.length) {
    return (
      <div className="dp-card">
        <EmptyState
          icon={ChartColumn}
          title="No recommended charts yet"
          description="Run the recommender and DataPulse will profile the dataset and propose the charts worth looking at."
          action={emptyAction}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {charts.map((chart, index) => {
        const entry = series[chart.id]
        return (
          <ChartCard
            key={chart.id}
            title={chart.title || `${humanizeField(chart.yAxis)} by ${humanizeField(chart.xAxis)}`}
            chartType={chart.chartType}
            data={toChartData(entry, chart)}
            xLabel={chart.xAxis}
            yLabel={chart.yAxis}
            reason={chart.reason}
            score={chart.score}
            failed={Boolean(entry?.failed)}
            colorOffset={index}
            height={300}
          />
        )
      })}
    </div>
  )
}
