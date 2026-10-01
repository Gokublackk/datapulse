import { memo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { chartColor, formatCompact, formatNumber, humanizeField, truncate } from '../../lib/format'

/** Canonical chart kinds. Backend `chart_type` strings are mapped onto these. */
export const CHART_TYPES = {
  BAR: 'bar',
  HBAR: 'hbar',
  LINE: 'line',
  AREA: 'area',
  PIE: 'pie',
  DONUT: 'donut',
  SCATTER: 'scatter',
  RADAR: 'radar',
  HISTOGRAM: 'histogram',
}

const ALIASES = {
  bar: CHART_TYPES.BAR,
  column: CHART_TYPES.BAR,
  bar_chart: CHART_TYPES.BAR,
  vertical_bar: CHART_TYPES.BAR,
  hbar: CHART_TYPES.HBAR,
  horizontal_bar: CHART_TYPES.HBAR,
  barh: CHART_TYPES.HBAR,
  line: CHART_TYPES.LINE,
  line_chart: CHART_TYPES.LINE,
  trend: CHART_TYPES.LINE,
  area: CHART_TYPES.AREA,
  area_chart: CHART_TYPES.AREA,
  pie: CHART_TYPES.PIE,
  pie_chart: CHART_TYPES.PIE,
  donut: CHART_TYPES.DONUT,
  doughnut: CHART_TYPES.DONUT,
  scatter: CHART_TYPES.SCATTER,
  scatter_plot: CHART_TYPES.SCATTER,
  bubble: CHART_TYPES.SCATTER,
  radar: CHART_TYPES.RADAR,
  histogram: CHART_TYPES.HISTOGRAM,
  hist: CHART_TYPES.HISTOGRAM,
  box: CHART_TYPES.HISTOGRAM,
  boxplot: CHART_TYPES.HISTOGRAM,
}

export function normaliseChartType(value) {
  const key = String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  return ALIASES[key] ?? CHART_TYPES.BAR
}

/** Themed tooltip — recharts' default ignores our CSS variables. */
function ChartTooltip({ active, payload, label, xLabel, yLabel }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload ?? {}
  const heading = label ?? point.label ?? point.x
  return (
    <div className="dp-tooltip">
      {heading !== undefined ? (
        <p className="mb-1 max-w-56 break-words font-bold text-ink">{String(heading)}</p>
      ) : null}
      {payload.map((entry) => (
        <p key={entry.dataKey ?? entry.name} className="flex items-center justify-between gap-3">
          <span className="text-muted">{humanizeField(entry.name ?? yLabel ?? 'Value')}</span>
          <span className="dp-num font-bold text-ink">{formatNumber(entry.value)}</span>
        </p>
      ))}
      {point.count != null && payload.length === 1 ? (
        <p className="mt-0.5 flex items-center justify-between gap-3">
          <span className="text-muted">Records</span>
          <span className="dp-num font-bold text-ink">{formatNumber(point.count)}</span>
        </p>
      ) : null}
      {xLabel && heading !== undefined ? <p className="mt-1 text-faint">{humanizeField(xLabel)}</p> : null}
    </div>
  )
}

const GRID = <CartesianGrid strokeDasharray="3 3" vertical={false} />
const AXIS = { tickLine: false, axisLine: false }
const MARGIN = { top: 8, right: 12, bottom: 4, left: 4 }

/**
 * One renderer for every chart in the app. Data is `[{ label, value, count? }]`
 * except scatter, which takes `[{ x, y }]`.
 *
 * Colours come from `var(--dp-chart-N)`, so a theme switch repaints the chart
 * without a re-render.
 */
function ChartRendererBase({ type, data = [], xLabel, yLabel, height = 280, colorOffset = 0, showLegend = false }) {
  const kind = normaliseChartType(type)
  const tooltip = <Tooltip content={<ChartTooltip xLabel={xLabel} yLabel={yLabel} />} cursor={{ fill: 'var(--dp-brand-soft)' }} />
  const primary = chartColor(colorOffset)
  const secondary = chartColor(colorOffset + 1)

  if (!data.length) {
    return (
      <div className="grid h-full min-h-40 place-items-center text-sm text-faint" style={{ height }}>
        No data to plot.
      </div>
    )
  }

  const tickFormatter = (value) => truncate(value, 14)

  const body = (() => {
    switch (kind) {
      case CHART_TYPES.HBAR:
        return (
          <BarChart data={data} layout="vertical" margin={{ ...MARGIN, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" {...AXIS} tickFormatter={formatCompact} />
            <YAxis type="category" dataKey="label" width={116} {...AXIS} tickFormatter={tickFormatter} />
            {tooltip}
            <Bar dataKey="value" name={yLabel || 'Value'} radius={[0, 6, 6, 0]} maxBarSize={26}>
              {data.map((entry, index) => (
                <Cell key={entry.label ?? index} fill={chartColor(index + colorOffset)} />
              ))}
            </Bar>
          </BarChart>
        )

      case CHART_TYPES.LINE:
        return (
          <LineChart data={data} margin={MARGIN}>
            {GRID}
            <XAxis dataKey="label" {...AXIS} tickFormatter={tickFormatter} minTickGap={18} />
            <YAxis {...AXIS} tickFormatter={formatCompact} width={54} />
            {tooltip}
            {showLegend ? <Legend /> : null}
            <Line
              type="monotone"
              dataKey="value"
              name={yLabel || 'Value'}
              stroke={primary}
              strokeWidth={2.5}
              dot={data.length <= 40 ? { r: 3, strokeWidth: 0, fill: primary } : false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        )

      case CHART_TYPES.AREA:
        return (
          <AreaChart data={data} margin={MARGIN}>
            <defs>
              <linearGradient id={`dp-area-${colorOffset}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primary} stopOpacity={0.42} />
                <stop offset="100%" stopColor={primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {GRID}
            <XAxis dataKey="label" {...AXIS} tickFormatter={tickFormatter} minTickGap={18} />
            <YAxis {...AXIS} tickFormatter={formatCompact} width={54} />
            {tooltip}
            {showLegend ? <Legend /> : null}
            <Area
              type="monotone"
              dataKey="value"
              name={yLabel || 'Value'}
              stroke={primary}
              strokeWidth={2.5}
              fill={`url(#dp-area-${colorOffset})`}
            />
          </AreaChart>
        )

      case CHART_TYPES.PIE:
      case CHART_TYPES.DONUT:
        return (
          <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            {tooltip}
            <Legend verticalAlign="bottom" height={30} iconType="circle" iconSize={8} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={kind === CHART_TYPES.DONUT ? '54%' : 0}
              outerRadius="78%"
              paddingAngle={kind === CHART_TYPES.DONUT ? 2 : 0}
              stroke="var(--dp-surface)"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.label ?? index} fill={chartColor(index + colorOffset)} />
              ))}
            </Pie>
          </PieChart>
        )

      case CHART_TYPES.SCATTER:
        return (
          <ScatterChart margin={{ ...MARGIN, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel || 'X'}
              {...AXIS}
              tickFormatter={formatCompact}
              domain={['auto', 'auto']}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel || 'Y'}
              {...AXIS}
              tickFormatter={formatCompact}
              width={54}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<ChartTooltip xLabel={xLabel} yLabel={yLabel} />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={data} name={`${xLabel || 'x'} vs ${yLabel || 'y'}`} fill={primary} fillOpacity={0.72} />
          </ScatterChart>
        )

      case CHART_TYPES.RADAR:
        return (
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid />
            <PolarAngleAxis dataKey="label" tickFormatter={tickFormatter} />
            <PolarRadiusAxis tickFormatter={formatCompact} />
            {tooltip}
            <Radar
              name={yLabel || 'Value'}
              dataKey="value"
              stroke={secondary}
              fill={secondary}
              fillOpacity={0.32}
              strokeWidth={2}
            />
          </RadarChart>
        )

      case CHART_TYPES.HISTOGRAM:
      case CHART_TYPES.BAR:
      default:
        return (
          <BarChart data={data} margin={MARGIN} barCategoryGap={kind === CHART_TYPES.HISTOGRAM ? 1 : '18%'}>
            {GRID}
            <XAxis
              dataKey="label"
              {...AXIS}
              tickFormatter={tickFormatter}
              interval="preserveStartEnd"
              minTickGap={kind === CHART_TYPES.HISTOGRAM ? 24 : 4}
              angle={data.length > 8 ? -22 : 0}
              textAnchor={data.length > 8 ? 'end' : 'middle'}
              height={data.length > 8 ? 52 : 28}
            />
            <YAxis {...AXIS} tickFormatter={formatCompact} width={54} />
            {tooltip}
            {showLegend ? <Legend /> : null}
            <Bar
              dataKey="value"
              name={yLabel || 'Value'}
              radius={[6, 6, 0, 0]}
              maxBarSize={kind === CHART_TYPES.HISTOGRAM ? 999 : 54}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.label ?? index}
                  fill={kind === CHART_TYPES.HISTOGRAM ? primary : chartColor(index + colorOffset)}
                />
              ))}
            </Bar>
          </BarChart>
        )
    }
  })()

  return (
    <div className="dp-chart w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {body}
      </ResponsiveContainer>
    </div>
  )
}

export const ChartRenderer = memo(ChartRendererBase)
export default ChartRenderer
