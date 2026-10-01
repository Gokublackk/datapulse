import { useState } from 'react'
import {
  CheckCircle,
  Filter,
  Percent,
  Scissors,
  ShieldAlert,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { preprocessDataset } from '../../api/datasets'
import { useToast } from '../../context/ToastProvider'
import { formatCompact, formatPercent } from '../../lib/format'

const PREPROCESS_PRESETS = [
  {
    id: 'drop_duplicates',
    label: 'Remove Duplicates',
    icon: Scissors,
    desc: 'Purge all exact duplicate rows',
    action: 'drop_duplicates',
    params: {},
  },
  {
    id: 'drop_na',
    label: 'Drop Missing Rows',
    icon: Filter,
    desc: 'Drop rows with empty/NaN values',
    action: 'drop_na',
    params: {},
  },
  {
    id: 'fill_mean',
    label: 'Fill Nulls (Mean/Mode)',
    icon: Wand2,
    desc: 'Impute missing numbers with mean, text with mode',
    action: 'fill_na',
    params: { strategy: 'mean' },
  },
  {
    id: 'fill_median',
    label: 'Fill Nulls (Median)',
    icon: Wand2,
    desc: 'Robust imputation resistant to extreme skew',
    action: 'fill_na',
    params: { strategy: 'median' },
  },
  {
    id: 'filter_outliers',
    label: 'Filter Outliers',
    icon: ShieldAlert,
    desc: 'Remove rows outside 1.5x Interquartile Range (IQR)',
    action: 'filter_outliers',
    params: { factor: 1.5 },
  },
  {
    id: 'normalize',
    label: 'Normalize (0 → 1)',
    icon: Percent,
    desc: 'Rescale numeric columns between 0.0 and 1.0',
    action: 'normalize',
    params: { strategy: 'minmax' },
  },
]

export default function PreprocessingStudio({ datasetId, profile, onRefresh }) {
  const toast = useToast()
  const [selectedColumns, setSelectedColumns] = useState([])
  const [activeAction, setActiveAction] = useState('fill_na')
  const [fillStrategy, setFillStrategy] = useState('median')
  const [targetType, setTargetType] = useState('numeric')
  const [iqrFactor, setIqrFactor] = useState(1.5)
  const [running, setRunning] = useState(false)
  const [lastSummary, setLastSummary] = useState(null)

  const toggleColumn = (name) => {
    setSelectedColumns((prev) =>
      prev.includes(name) ? prev.filter((col) => col !== name) : [...prev, name]
    )
  }

  const selectAll = () => {
    if (selectedColumns.length === profile.columns.length) {
      setSelectedColumns([])
    } else {
      setSelectedColumns(profile.columns.map((c) => c.name))
    }
  }

  const executeAction = async (preset) => {
    const actionToRun = preset?.action || activeAction
    const params = preset ? preset.params : {}

    setRunning(true)
    try {
      const payload = {
        action: actionToRun,
        columns: selectedColumns,
        strategy: params.strategy || fillStrategy,
        target_type: targetType,
        factor: iqrFactor,
      }

      const res = await preprocessDataset(datasetId, payload)
      setLastSummary(res.data?.change_summary || { details: res.message })
      toast.success(res.message || 'Preprocessing applied successfully!', {
        title: 'Dataset Updated',
      })
      if (onRefresh) await onRefresh()
    } catch (err) {
      toast.error(err.message || 'Failed to apply preprocessing.', {
        title: 'Error',
      })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero Control Banner */}
      <div className="dp-card relative overflow-hidden p-5 sm:p-6">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-brand/15 text-brand" aria-hidden="true">
                <Sparkles size={16} />
              </span>
              <h2 className="text-base font-bold text-ink">Interactive Preprocessing Studio</h2>
              <Badge tone="brand">Real-Time Transform</Badge>
            </div>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Clean missing data, remove outliers, cast column data types, or rescale numeric attributes.
              Transformations apply directly to your dataset with immediate profiling updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              icon={Wand2}
              loading={running}
              onClick={() => executeAction()}
            >
              Apply Selected Transform
            </Button>
          </div>
        </div>

        {lastSummary ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-3.5 text-sm text-ink animate-pop">
            <CheckCircle size={18} className="mt-0.5 shrink-0 text-success" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Latest Transformation Result:</p>
              <p className="text-muted">{lastSummary.details}</p>
              <p className="mt-1 dp-num text-xs text-faint">
                Rows: {lastSummary.initial_rows} → {lastSummary.final_rows} · Columns: {lastSummary.initial_columns} → {lastSummary.final_columns}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLastSummary(null)}
              className="text-xs font-semibold text-muted hover:text-ink"
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </div>

      {/* Preset Action Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">1-Click Quick Transformations</h3>
          <span className="text-xs text-faint">Applies instantly across selected columns</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PREPROCESS_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="dp-card group relative flex flex-col justify-between p-4 transition-all hover:-translate-y-0.5 hover:border-brand/50"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-subtle text-brand group-hover:bg-brand/15">
                    <preset.icon size={16} />
                  </span>
                  <h4 className="text-sm font-bold text-ink">{preset.label}</h4>
                </div>
                <p className="mt-2 text-xs text-muted leading-relaxed">{preset.desc}</p>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <Button
                  size="sm"
                  variant="soft"
                  loading={running}
                  onClick={() => executeAction(preset)}
                >
                  Run Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Transform Panel & Column Selector */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transform Configurator */}
        <section className="dp-card space-y-4 p-5 lg:col-span-1">
          <h3 className="text-sm font-bold text-ink">Custom Operation Builder</h3>

          <div className="space-y-3">
            <div>
              <label className="dp-label block mb-1">Target Operation</label>
              <select
                value={activeAction}
                onChange={(e) => setActiveAction(e.target.value)}
                className="dp-input w-full text-sm"
              >
                <option value="fill_na">Impute Missing Values (fill_na)</option>
                <option value="drop_na">Drop Rows with Missing Values</option>
                <option value="drop_duplicates">Drop Duplicate Records</option>
                <option value="filter_outliers">Filter Outliers (IQR)</option>
                <option value="normalize">Normalize Scale (0-1 / Z-score)</option>
                <option value="convert_type">Convert Data Type</option>
                <option value="drop_columns">Drop Selected Columns</option>
              </select>
            </div>

            {activeAction === 'fill_na' ? (
              <div>
                <label className="dp-label block mb-1">Imputation Strategy</label>
                <select
                  value={fillStrategy}
                  onChange={(e) => setFillStrategy(e.target.value)}
                  className="dp-input w-full text-sm"
                >
                  <option value="mean">Mean (Average)</option>
                  <option value="median">Median (Middle value - robust)</option>
                  <option value="mode">Mode (Most frequent)</option>
                  <option value="zero">Zero (0)</option>
                  <option value="forward_fill">Forward / Backward fill</option>
                </select>
              </div>
            ) : null}

            {activeAction === 'filter_outliers' ? (
              <div>
                <label className="dp-label block mb-1">IQR Sensitivity Multiplier ({iqrFactor}x)</label>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.25"
                  value={iqrFactor}
                  onChange={(e) => setIqrFactor(parseFloat(e.target.value))}
                  className="w-full accent-brand"
                />
                <span className="text-xs text-faint">1.5 is standard statistical threshold; 2.5+ is lenient.</span>
              </div>
            ) : null}

            {activeAction === 'convert_type' ? (
              <div>
                <label className="dp-label block mb-1">Destination Type</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="dp-input w-full text-sm"
                >
                  <option value="numeric">Numeric (Float/Integer)</option>
                  <option value="datetime">Date & Time</option>
                  <option value="string">Text String</option>
                  <option value="category">Category (Factor)</option>
                </select>
              </div>
            ) : null}

            <Button
              className="mt-3 w-full"
              variant="primary"
              icon={Zap}
              loading={running}
              onClick={() => executeAction()}
            >
              Execute Transformation
            </Button>
          </div>
        </section>

        {/* Column Health & Selector Table */}
        <section className="dp-card flex flex-col p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
            <div>
              <h3 className="text-sm font-bold text-ink">Select Columns to Target</h3>
              <p className="text-xs text-muted">
                {selectedColumns.length
                  ? `${selectedColumns.length} of ${profile.columns.length} columns selected`
                  : 'Leave blank to apply automatically across all relevant columns'}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={selectAll}>
              {selectedColumns.length === profile.columns.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="dp-scroll mt-3 max-h-96 overflow-y-auto divide-y divide-line">
            {profile.columns.map((column) => {
              const isSelected = selectedColumns.includes(column.name)
              const missingPct = (column.missing / Math.max(profile.rowCount, 1)) * 100

              return (
                <div
                  key={column.name}
                  onClick={() => toggleColumn(column.name)}
                  className={`flex cursor-pointer items-center justify-between gap-3 p-3 transition-colors ${
                    isSelected ? 'bg-brand/10' : 'hover:bg-subtle'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="size-4 rounded accent-brand"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{column.name}</p>
                      <p className="text-xs text-faint">
                        {column.type} · {formatCompact(column.unique)} unique values
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {column.missing > 0 ? (
                      <Badge tone="warn">{formatPercent(missingPct)} missing</Badge>
                    ) : (
                      <Badge tone="success">100% clean</Badge>
                    )}
                    {column.outliers > 0 ? (
                      <Badge tone="danger">{column.outliers} outliers</Badge>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
