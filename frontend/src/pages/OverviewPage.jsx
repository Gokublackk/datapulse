import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ChartColumn,
  CheckCircle2,
  CloudUpload,
  Columns3,
  Cpu,
  Database,
  Flame,
  Layers,
  Radio,
  RefreshCw,
  Rocket,
  Rows3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { StatTile } from '../components/ui/StatTile'
import { SkeletonCard, SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { SectionTitle } from '../components/ui/Card'
import ChartCard from '../components/charts/ChartCard'
import { listMyDatasets, uploadSampleDataset } from '../api/datasets'
import { useAsyncData, invalidateCache } from '../hooks/useAsyncData'
import { useAuth } from '../context/AuthProvider'
import { useWorkspace } from '../context/WorkspaceProvider'
import { useToast } from '../context/ToastProvider'
import { fileExtensionLabel, formatCompact, formatNumber, formatRelative, truncate } from '../lib/format'

/** Stable empty fallback so the memos below are not invalidated every render. */
const NO_DATASETS = []

const SAMPLE_TEMPLATES = [
  {
    type: 'sales',
    title: 'Global E-Commerce Revenue',
    subtitle: '500+ orders, shipping costs, categories & profit margins',
    format: 'CSV',
    icon: Flame,
    color: 'text-brand',
  },
  {
    type: 'health',
    title: 'Clinical Vitality Metrics',
    subtitle: 'BMI, heart rate, cholesterol & statistical risk scores',
    format: 'CSV',
    icon: Activity,
    color: 'text-success',
  },
  {
    type: 'saas',
    title: 'Cloud SaaS User Retention',
    subtitle: 'Churn analysis, ARR tiering, NPS & activity cohorts',
    format: 'CSV',
    icon: Zap,
    color: 'text-accent',
  },
]

/** Portfolio view across every dataset the signed-in user owns. */
export default function OverviewPage() {
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const toast = useToast()
  const navigate = useNavigate()
  const [loadingSample, setLoadingSample] = useState(null)

  const fetcher = useCallback((signal) => listMyDatasets({ signal }), [])
  const { data, error, loading, refreshing, refetch } = useAsyncData(fetcher, { key: 'datasets:my' })

  const datasets = data ?? NO_DATASETS

  const totals = useMemo(() => {
    const rows = datasets.reduce((sum, dataset) => sum + dataset.rows, 0)
    const columns = datasets.reduce((sum, dataset) => sum + dataset.columns, 0)
    const totalCells = datasets.reduce((sum, dataset) => sum + dataset.rows * dataset.columns, 0)
    const latest = datasets.reduce(
      (newest, dataset) =>
        dataset.uploadedAt && (!newest || new Date(dataset.uploadedAt) > new Date(newest)) ? dataset.uploadedAt : newest,
      null,
    )
    const widest = datasets.reduce((best, dataset) => (!best || dataset.columns > best.columns ? dataset : best), null)
    return { rows, columns, totalCells, latest, widest }
  }, [datasets])

  const rowsByDataset = useMemo(
    () =>
      [...datasets]
        .sort((a, b) => b.rows - a.rows)
        .slice(0, 10)
        .map((dataset) => ({ label: truncate(dataset.filename.replace(/\.[^.]+$/, ''), 22), value: dataset.rows })),
    [datasets],
  )

  const handleLaunchSample = async (type) => {
    if (!workspaceId) return
    setLoadingSample(type)
    try {
      const result = await uploadSampleDataset(workspaceId, type)
      invalidateCache('datasets:')
      invalidateCache('workspace:')
      toast.success(`${result.filename} injected and ready!`, { title: 'Dataset Ingested' })
      refetch()
    } catch (err) {
      toast.error(err.message, { title: 'Failed to inject sample' })
    } finally {
      setLoadingSample(null)
    }
  }

  const firstName = user?.displayName?.split(' ')[0]

  const header = (
    <div className="space-y-4">
      {/* Top Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-strong/40 bg-surface/80 p-3 px-4 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full rounded-full bg-success opacity-75 animate-ping" />
            <span className="relative inline-flex size-2.5 rounded-full bg-success" />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
            <span>DataPulse Core</span>
            <span className="text-faint font-mono text-[0.6875rem]">v2.0 ACTIVE</span>
          </span>
          <span className="hidden sm:inline-block text-faint">•</span>
          <span className="hidden sm:inline-block text-xs text-muted font-medium">
            Autonomous Profiling & Visualizations Engine
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="soft" size="sm" icon={RefreshCw} loading={refreshing} onClick={refetch}>
            Sync
          </Button>
          <Button as={Link} to="/upload" variant="primary" size="sm" icon={CloudUpload} className="shadow-md shadow-brand/20">
            Ingest Data
          </Button>
        </div>
      </div>

      <PageHeader
        eyebrow="Intelligence Studio"
        title={firstName ? `Welcome back, ${firstName}` : 'Intelligence Portfolio'}
        description="Comprehensive telemetry, automated statistical distributions, and smart visualizations."
      />
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <SkeletonGrid count={4} />
        <SkeletonCard className="h-80" />
      </div>
    )
  }

  if (error && !datasets.length) {
    return (
      <div className="space-y-6">
        {header}
        <div className="dp-card">
          <ErrorState error={error} onRetry={refetch} title="Could not load your datasets" />
        </div>
      </div>
    )
  }

  /* Empty State with 1-Click Interactive Sample Ingestion Hub */
  if (!datasets.length) {
    return (
      <div className="space-y-6 animate-rise">
        {header}

        <div className="dp-card relative overflow-hidden p-6 sm:p-10 border-line-strong/60 shadow-xl bg-cyber-grid">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand/10 text-brand shadow-lg pulse-radar">
              <Sparkles size={28} className="animate-spin" style={{ animationDuration: '6s' }} />
            </span>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-ink">
              Ready for Intelligent Analysis
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Drop in any CSV or Excel file to begin, or test-drive the studio immediately using curated real-world matrices:
            </p>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Button as={Link} to="/upload" variant="primary" size="lg" icon={CloudUpload} className="shadow-lg shadow-brand/25 font-bold">
                Upload My Dataset
              </Button>
            </div>
          </div>

          {/* Curated Sample Injection Cards */}
          <div className="mt-10 pt-8 border-t border-line grid gap-4 sm:grid-cols-3">
            {SAMPLE_TEMPLATES.map((sample) => (
              <div
                key={sample.type}
                className="group dp-card-glow p-4 flex flex-col justify-between space-y-3 bg-surface/90"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-subtle text-ink">
                      <sample.icon size={18} className={sample.color} />
                    </span>
                    <Badge tone="brand">{sample.format}</Badge>
                  </div>
                  <h3 className="text-sm font-bold text-ink">{sample.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{sample.subtitle}</p>
                </div>

                <Button
                  variant="soft"
                  size="sm"
                  block
                  iconRight={ArrowRight}
                  loading={loadingSample === sample.type}
                  onClick={() => handleLaunchSample(sample.type)}
                  className="font-bold text-xs"
                >
                  Load Matrix
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-rise">
      {header}

      {/* Cyber Metric Stat Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Active Datasets"
          value={formatNumber(datasets.length)}
          icon={Database}
          hint="Catalogued in workspace"
        />
        <StatTile
          label="Total Records"
          value={formatCompact(totals.rows)}
          icon={Rows3}
          hint={`${formatNumber(totals.rows)} profiled rows`}
        />
        <StatTile
          label="Data Points"
          value={formatCompact(totals.totalCells)}
          icon={Columns3}
          hint={`${totals.columns} features tracked`}
        />
        <StatTile
          label="Latest Ingestion"
          value={totals.latest ? formatRelative(totals.latest) : '—'}
          icon={Sparkles}
          tone="success"
          hint={datasets[0] ? truncate(datasets[0].filename, 22) : undefined}
        />
      </div>

      {/* Visual Analytics & Recent Ingestions Grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="dp-card-glow overflow-hidden p-1 bg-surface">
          <ChartCard
            title="Distribution Scale: Rows by Dataset"
            chartType="hbar"
            data={rowsByDataset}
            xLabel="dataset"
            yLabel="rows"
            height={Math.max(280, rowsByDataset.length * 36)}
            reason="Quantifies distribution scale across all ingested datasets to verify statistical representation."
          />
        </div>

        <section className="dp-card-glow flex flex-col overflow-hidden bg-surface">
          <header className="flex items-center justify-between gap-2 border-b border-line px-5 py-4 bg-subtle/40">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-brand" />
              <h2 className="text-sm font-extrabold text-ink">Recent Ingestions</h2>
            </div>
            <Link to="/datasets" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
              Browse all <ArrowRight size={13} />
            </Link>
          </header>

          <ul className="dp-scroll max-h-[28rem] divide-y divide-line">
            {datasets.slice(0, 8).map((dataset) => (
              <li key={dataset.id} className="group">
                <Link
                  to={`/datasets/${dataset.id}`}
                  className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-subtle/80 no-underline"
                >
                  <span className="dp-tile size-10 shrink-0 rounded-xl transition-transform group-hover:scale-105" aria-hidden="true">
                    <ChartColumn size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink group-hover:text-brand transition-colors" title={dataset.filename}>
                      {dataset.filename}
                    </span>
                    <span className="dp-num block text-xs text-faint mt-0.5">
                      {formatCompact(dataset.rows)} rows · {dataset.columns} cols
                      {dataset.uploadedAt ? ` · ${formatRelative(dataset.uploadedAt)}` : ''}
                    </span>
                  </span>
                  <Badge className="shrink-0">{fileExtensionLabel(dataset.fileType)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Quick Launchpad Action Bar */}
      <div className="rounded-2xl border border-line-strong/50 bg-gradient-to-r from-brand/10 via-surface to-accent/10 p-5 sm:p-6 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-extrabold text-ink flex items-center gap-2 justify-center sm:justify-start">
            <Zap size={18} className="text-brand" /> Ready to explore full distributions?
          </h3>
          <p className="text-xs text-muted max-w-xl">
            Each dataset workspace provides automatic data cleaning reports, column-by-column outlier detection, an interactive chart builder, and correlation heatmaps.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button as={Link} to="/datasets" variant="soft" icon={Database} className="font-bold">
            All Datasets
          </Button>
          <Button as={Link} to="/upload" variant="primary" icon={CloudUpload} className="font-bold shadow-md shadow-brand/20">
            Ingest New File
          </Button>
        </div>
      </div>
    </div>
  )
}
