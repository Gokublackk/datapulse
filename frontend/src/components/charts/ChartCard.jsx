import { useRef, useState } from 'react'
import {
  ChartArea,
  ChartColumn,
  ChartLine,
  ChartPie,
  ChartScatter,
  Download,
  Image as ImageIcon,
  Maximize2,
  Rows3,
  Sheet,
} from 'lucide-react'
import ChartRenderer, { CHART_TYPES, normaliseChartType } from './ChartRenderer'
import { Badge } from '../ui/Badge'
import { IconButton } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { TiltCard } from '../ui/GestureCards'
import { ErrorBoundary } from '../common/ErrorBoundary'
import { downloadChartPng, downloadCsv } from '../../lib/exporters'
import { humanizeField } from '../../lib/format'
import { useToast } from '../../context/ToastProvider'

const SWITCHABLE = [
  { type: CHART_TYPES.BAR, icon: ChartColumn, label: 'Bar' },
  { type: CHART_TYPES.HBAR, icon: Rows3, label: 'Horizontal bar' },
  { type: CHART_TYPES.LINE, icon: ChartLine, label: 'Line' },
  { type: CHART_TYPES.AREA, icon: ChartArea, label: 'Area' },
  { type: CHART_TYPES.DONUT, icon: ChartPie, label: 'Donut' },
]

const slug = (value) =>
  String(value ?? 'chart')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'chart'

/**
 * A chart plus its metadata, a type switcher, and PNG/CSV export.
 *
 * The chart type is local state seeded from the prop so the user can reshape a
 * recommended chart without losing the recommendation.
 */
export default function ChartCard({
  title,
  reason,
  score,
  data = [],
  chartType,
  xLabel,
  yLabel,
  height = 280,
  colorOffset = 0,
  failed = false,
  allowSwitch = true,
  footer,
  className = '',
}) {
  const [type, setType] = useState(() => normaliseChartType(chartType))
  const [busy, setBusy] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const bodyRef = useRef(null)
  const toast = useToast()

  const scatter = type === CHART_TYPES.SCATTER
  const switchable = allowSwitch && !scatter && type !== CHART_TYPES.RADAR

  const exportPng = async () => {
    setBusy(true)
    try {
      await downloadChartPng(bodyRef.current, `${slug(title)}.png`)
      toast.success('Chart exported as PNG.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  const exportCsv = () => {
    if (!data.length) {
      toast.warning('There is nothing to export yet.')
      return
    }
    const columns = scatter ? ['x', 'y'] : ['label', 'value']
    const headerRows = data.map((row) =>
      scatter ? { x: row.x, y: row.y } : { label: row.label, value: row.value },
    )
    downloadCsv(headerRows, columns, `${slug(title)}.csv`)
    toast.success('Chart data exported as CSV.')
  }

  return (
    <>
      <TiltCard className={`dp-card animate-rise flex flex-col overflow-hidden ${className}`}>
        <header className="flex flex-wrap items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-ink" title={title}>
              {title}
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
              {xLabel ? <span>{humanizeField(xLabel)}</span> : null}
              {xLabel && yLabel ? <span aria-hidden="true">·</span> : null}
              {yLabel ? <span>{humanizeField(yLabel)}</span> : null}
              {typeof score === 'number' ? (
                <Badge tone="brand" className="ml-0.5">
                  score {Math.round(score * (score <= 1 ? 100 : 1))}
                </Badge>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {switchable ? (
              <div className="mr-1 hidden items-center gap-0.5 rounded-xl border border-line bg-subtle p-0.5 sm:flex">
                {SWITCHABLE.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setType(option.type)}
                    aria-label={`${option.label} chart`}
                    aria-pressed={type === option.type}
                    title={option.label}
                    className={`grid size-7 place-items-center rounded-lg transition-colors ${
                      type === option.type ? 'bg-brand text-white' : 'text-faint hover:text-ink'
                    }`}
                  >
                    <option.icon size={13} aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : scatter ? (
              <ChartScatter size={14} className="mr-1 text-faint" aria-hidden="true" />
            ) : null}
            <IconButton icon={Maximize2} label="Expand full screen" onClick={() => setFullscreen(true)} className="size-8" />
            <IconButton icon={ImageIcon} label="Export chart as PNG" onClick={exportPng} disabled={busy} className="size-8" />
            <IconButton icon={Sheet} label="Export chart data as CSV" onClick={exportCsv} className="size-8" />
          </div>
        </header>

        <div ref={bodyRef} className="min-w-0 flex-1 px-1.5 pb-2 sm:px-2.5">
          {failed ? (
            <div className="grid place-items-center gap-1 px-4 py-14 text-center" style={{ minHeight: height }}>
              <Download size={18} className="text-faint" aria-hidden="true" />
              <p className="text-sm font-semibold text-ink">Series unavailable</p>
              <p className="text-xs text-muted">The backend could not aggregate this chart.</p>
            </div>
          ) : (
            <ErrorBoundary compact title="Chart failed to draw">
              <ChartRenderer
                type={type}
                data={data}
                xLabel={xLabel}
                yLabel={yLabel}
                height={height}
                colorOffset={colorOffset}
              />
            </ErrorBoundary>
          )}
        </div>

        {reason || footer ? (
          <footer className="border-t border-line px-4 py-3 sm:px-5">
            {reason ? <p className="text-xs leading-relaxed text-muted">{reason}</p> : null}
            {footer}
          </footer>
        ) : null}
      </TiltCard>

      {/* Expanded Modal View for deep inspection */}
      <Modal
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        title={title}
        description={`${humanizeField(xLabel || '')} vs ${humanizeField(yLabel || '')} · ${data.length} records`}
        size="xl"
      >
        <div className="p-4 sm:p-6">
          <ChartRenderer
            type={type}
            data={data}
            xLabel={xLabel}
            yLabel={yLabel}
            height={460}
            colorOffset={colorOffset}
            showLegend
          />
        </div>
      </Modal>
    </>
  )
}
