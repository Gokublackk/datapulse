import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ChartColumn,
  CloudUpload,
  Columns3,
  Database,
  RefreshCw,
  Rows3,
  Sparkles,
} from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { StatTile } from '../components/ui/StatTile'
import { SkeletonCard, SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { SectionTitle } from '../components/ui/Card'
import ChartCard from '../components/charts/ChartCard'
import { listMyDatasets } from '../api/datasets'
import { useAsyncData } from '../hooks/useAsyncData'
import { useAuth } from '../context/AuthProvider'
import { fileExtensionLabel, formatCompact, formatNumber, formatRelative, truncate } from '../lib/format'

/** Stable empty fallback so the memos below are not invalidated every render. */
const NO_DATASETS = []

/** Portfolio view across every dataset the signed-in user owns. */
export default function OverviewPage() {
  const { user } = useAuth()
  const fetcher = useCallback((signal) => listMyDatasets({ signal }), [])
  const { data, error, loading, refreshing, refetch } = useAsyncData(fetcher, { key: 'datasets:my' })

  const datasets = data ?? NO_DATASETS

  const totals = useMemo(() => {
    const rows = datasets.reduce((sum, dataset) => sum + dataset.rows, 0)
    const columns = datasets.reduce((sum, dataset) => sum + dataset.columns, 0)
    const latest = datasets.reduce(
      (newest, dataset) =>
        dataset.uploadedAt && (!newest || new Date(dataset.uploadedAt) > new Date(newest)) ? dataset.uploadedAt : newest,
      null,
    )
    const widest = datasets.reduce((best, dataset) => (!best || dataset.columns > best.columns ? dataset : best), null)
    return { rows, columns, latest, widest }
  }, [datasets])

  const rowsByDataset = useMemo(
    () =>
      [...datasets]
        .sort((a, b) => b.rows - a.rows)
        .slice(0, 10)
        .map((dataset) => ({ label: truncate(dataset.filename.replace(/\.[^.]+$/, ''), 22), value: dataset.rows })),
    [datasets],
  )

  const firstName = user?.displayName?.split(' ')[0]

  const header = (
    <PageHeader
      eyebrow="Overview"
      title={firstName ? `Welcome back, ${firstName}` : 'Your data workspace'}
      description="Everything you have uploaded, profiled and ready to explore."
      actions={
        <>
          <Button variant="soft" icon={RefreshCw} loading={refreshing} onClick={refetch}>
            Refresh
          </Button>
          <Button as={Link} to="/upload" variant="primary" icon={CloudUpload}>
            Upload dataset
          </Button>
        </>
      }
    />
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

  if (!datasets.length) {
    return (
      <div className="space-y-6">
        {header}
        <div className="dp-card">
          <EmptyState
            icon={CloudUpload}
            title="Upload your first dataset"
            description="Drop in a CSV or Excel file. DataPulse cleans it, infers column types, scores its quality and proposes the charts worth looking at."
            action={
              <Button as={Link} to="/upload" variant="primary" icon={CloudUpload}>
                Upload a file
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Datasets" value={formatNumber(datasets.length)} icon={Database} hint="In your workspace" />
        <StatTile
          label="Total rows"
          value={formatCompact(totals.rows)}
          icon={Rows3}
          hint={`${formatNumber(totals.rows)} records`}
        />
        <StatTile
          label="Total columns"
          value={formatNumber(totals.columns)}
          icon={Columns3}
          hint={totals.widest ? `Widest: ${truncate(totals.widest.filename, 18)}` : undefined}
        />
        <StatTile
          label="Last upload"
          value={totals.latest ? formatRelative(totals.latest) : '—'}
          icon={Sparkles}
          tone="success"
          hint={datasets[0] ? truncate(datasets[0].filename, 22) : undefined}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ChartCard
          title="Rows per dataset"
          chartType="hbar"
          data={rowsByDataset}
          xLabel="dataset"
          yLabel="rows"
          height={Math.max(260, rowsByDataset.length * 34)}
          reason="The ten largest datasets by row count. Larger files support finer segmentation before groups get thin."
        />

        <section className="dp-card flex flex-col overflow-hidden">
          <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3.5">
            <h2 className="text-sm font-bold text-ink">Recent uploads</h2>
            <Link to="/datasets" className="text-xs font-bold text-brand hover:underline">
              View all
            </Link>
          </header>
          <ul className="dp-scroll max-h-[26rem] divide-y divide-line">
            {datasets.slice(0, 8).map((dataset) => (
              <li key={dataset.id}>
                <Link
                  to={`/datasets/${dataset.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-subtle"
                >
                  <span className="dp-tile size-9 shrink-0 rounded-lg" aria-hidden="true">
                    <ChartColumn size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink" title={dataset.filename}>
                      {dataset.filename}
                    </span>
                    <span className="dp-num block text-xs text-faint">
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

      <SectionTitle
        eyebrow="Next step"
        title="Open a dataset to start exploring"
        subtitle="Each dataset opens into a studio with insights, an interactive chart builder, recommended charts, a searchable table and a quality report."
        actions={
          <Button as={Link} to="/datasets" variant="soft" icon={Database}>
            Browse datasets
          </Button>
        }
      />
    </div>
  )
}
