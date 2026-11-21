import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChartColumn,
  CheckCircle2,
  CloudUpload,
  Columns3,
  Database,
  FileSpreadsheet,
  Filter,
  Grid,
  Layers,
  List,
  RefreshCw,
  Rocket,
  Rows3,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { SearchInput, Select } from '../components/ui/Field'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { TiltCard } from '../components/ui/GestureCards'
import { listMyDatasets, uploadSampleDataset } from '../api/datasets'
import { useAsyncData, invalidateCache } from '../hooks/useAsyncData'
import { useWorkspace } from '../context/WorkspaceProvider'
import { useToast } from '../context/ToastProvider'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { fileExtensionLabel, formatCompact, formatDate, formatRelative } from '../lib/format'

const SORTS = [
  { value: 'recent', label: 'Newest Ingestion' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'rows-desc', label: 'Most Records' },
  { value: 'columns-desc', label: 'Widest Schema' },
  { value: 'name-asc', label: 'Alphabetical A → Z' },
]

const time = (value) => (value ? new Date(value).getTime() : 0)

const COMPARATORS = {
  recent: (a, b) => time(b.uploadedAt) - time(a.uploadedAt) || b.id - a.id,
  oldest: (a, b) => time(a.uploadedAt) - time(b.uploadedAt) || a.id - b.id,
  'rows-desc': (a, b) => b.rows - a.rows,
  'columns-desc': (a, b) => b.columns - a.columns,
  'name-asc': (a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }),
}

function DatasetCard({ dataset }) {
  return (
    <TiltCard maxTilt={6} scale={1.015} className="h-full">
      <Link
        to={`/datasets/${dataset.id}`}
        className="dp-card-glow group flex h-full flex-col justify-between p-5 no-underline bg-surface/90"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <span
              className="dp-tile size-11 rounded-xl group-hover:scale-105 transition-transform shadow-md"
              aria-hidden="true"
            >
              <ChartColumn size={20} />
            </span>
            <div className="flex items-center gap-1.5">
              {dataset.firebaseStorageUrl ? (
                <Badge tone="brand">Cloud Synced</Badge>
              ) : null}
              <Badge tone={dataset.fileType?.includes('xls') ? 'accent' : 'brand'}>
                {fileExtensionLabel(dataset.fileType)}
              </Badge>
            </div>
          </div>

          <div>
            <h2
              className="line-clamp-2 text-sm font-black text-ink group-hover:text-brand transition-colors leading-snug"
              title={dataset.filename}
            >
              {dataset.filename}
            </h2>
            <p className="mt-1 font-mono text-[0.6875rem] text-faint">
              {dataset.uploadedAt ? `Ingested ${formatRelative(dataset.uploadedAt)}` : `Matrix #${dataset.id}`}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-line space-y-3">
          <dl className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-subtle p-2 border border-line/60">
              <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-faint">Rows</dt>
              <dd className="dp-num text-sm font-black text-ink">{formatCompact(dataset.rows)}</dd>
            </div>
            <div className="rounded-lg bg-subtle p-2 border border-line/60">
              <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-faint">Columns</dt>
              <dd className="dp-num text-sm font-black text-ink">{dataset.columns}</dd>
            </div>
          </dl>

          <div className="flex items-center justify-between text-xs font-bold text-brand group-hover:translate-x-0.5 transition-transform">
            <span>Launch Studio</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </Link>
    </TiltCard>
  )
}

/** Stable empty fallback so the filter/sort memo is not invalidated every render. */
const NO_DATASETS = []

/** Searchable, sortable index of the user's datasets. */
export default function DatasetsPage() {
  const fetcher = useCallback((signal) => listMyDatasets({ signal }), [])
  const { data, error, loading, refreshing, refetch } = useAsyncData(fetcher, { key: 'datasets:my' })
  const { workspaceId } = useWorkspace()
  const toast = useToast()

  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query, 180)
  const [sort, setSort] = useState('recent')
  const [formatFilter, setFormatFilter] = useState('all') // 'all' | 'csv' | 'excel'
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'
  const [loadingSample, setLoadingSample] = useState(false)

  const datasets = data ?? NO_DATASETS

  const visible = useMemo(() => {
    const needle = debounced.trim().toLowerCase()
    let filtered = datasets

    if (needle) {
      filtered = filtered.filter((d) => d.filename.toLowerCase().includes(needle))
    }

    if (formatFilter === 'csv') {
      filtered = filtered.filter((d) => d.fileType?.includes('csv'))
    } else if (formatFilter === 'excel') {
      filtered = filtered.filter((d) => d.fileType?.includes('xls'))
    }

    return [...filtered].sort(COMPARATORS[sort] ?? COMPARATORS.recent)
  }, [datasets, debounced, sort, formatFilter])

  const handleInjectSample = async () => {
    if (!workspaceId) return
    setLoadingSample(true)
    try {
      const res = await uploadSampleDataset(workspaceId, 'sales')
      invalidateCache('datasets:')
      invalidateCache('workspace:')
      toast.success(`${res.filename} added to library!`)
      refetch()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoadingSample(false)
    }
  }

  const header = (
    <PageHeader
      eyebrow="Datasets Library"
      title="Master Dataset Catalog"
      description="Access schema structures, distribution profiles, and interactive chart studios for all ingested files."
      breadcrumbs={[{ label: 'Studio', to: '/' }, { label: 'Datasets' }]}
      meta={
        datasets.length ? (
          <>
            <Badge tone="brand">{datasets.length} catalogued</Badge>
            <Badge>
              {formatCompact(datasets.reduce((sum, dataset) => sum + dataset.rows, 0))} rows total
            </Badge>
          </>
        ) : null
      }
      actions={
        <>
          <Button variant="soft" icon={RefreshCw} loading={refreshing} onClick={refetch}>
            Sync
          </Button>
          <Button as={Link} to="/upload" variant="primary" icon={CloudUpload} className="shadow-md shadow-brand/20">
            Ingest Dataset
          </Button>
        </>
      }
    />
  )

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <SkeletonGrid count={8} itemClassName="h-56" />
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

  return (
    <div className="space-y-6 animate-rise">
      {header}

      {/* Cyber Search & Controls Ribbon */}
      {datasets.length ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-strong/50 bg-surface/70 p-3 backdrop-blur-xl shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Filter matrices by keyword…"
              className="flex-1 min-w-44 sm:max-w-xs"
            />

            {/* Format Filter Chips */}
            <div className="flex items-center rounded-xl border border-line bg-subtle p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormatFilter('all')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  formatFilter === 'all' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter('csv')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  formatFilter === 'csv' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter('excel')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  formatFilter === 'excel' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                Excel
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              options={SORTS}
              aria-label="Sort datasets"
              wrapperClassName="w-auto"
              className="w-auto text-xs font-bold"
            />

            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center rounded-xl border border-line bg-subtle p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
                title="Grid View"
              >
                <Grid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
                title="Matrix List View"
              >
                <List size={15} />
              </button>
            </div>

            <span className="font-mono text-xs text-faint pl-1">
              {visible.length}/{datasets.length}
            </span>
          </div>
        </div>
      ) : null}

      {/* Catalog Render */}
      {datasets.length === 0 ? (
        <div className="dp-card p-10 text-center space-y-4">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand pulse-radar">
            <Database size={26} />
          </span>
          <h3 className="text-xl font-black text-ink">Catalog is currently empty</h3>
          <p className="text-sm text-muted max-w-md mx-auto">
            Upload your CSV or Excel files to begin statistical distribution analysis, or test with sample revenue metrics.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button as={Link} to="/upload" variant="primary" icon={CloudUpload} className="font-bold">
              Ingest a File
            </Button>
            <Button variant="soft" icon={Rocket} loading={loadingSample} onClick={handleInjectSample} className="font-bold">
              Load Sample Data
            </Button>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="dp-card p-8 text-center space-y-3">
          <h3 className="text-base font-bold text-ink">No dataset matches “{query}”</h3>
          <p className="text-xs text-muted">Try clearing the search query or selecting a different format filter.</p>
          <Button variant="soft" size="sm" onClick={() => { setQuery(''); setFormatFilter('all'); }}>
            Reset Filters
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visible.map((dataset) => (
            <DatasetCard key={dataset.id} dataset={dataset} />
          ))}
        </div>
      ) : (
        /* Matrix Table View */
        <div className="dp-card-glow overflow-hidden bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-line">
              <thead className="bg-subtle/60 text-faint font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Dataset Filename</th>
                  <th className="px-5 py-3.5">Format</th>
                  <th className="px-5 py-3.5">Record Volume</th>
                  <th className="px-5 py-3.5">Features</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-subtle/50 transition-colors group">
                    <td className="px-5 py-4 font-bold text-ink">
                      <Link to={`/datasets/${dataset.id}`} className="hover:text-brand transition-colors no-underline flex items-center gap-2.5">
                        <ChartColumn size={15} className="text-brand shrink-0" />
                        <span className="truncate max-w-xs">{dataset.filename}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={dataset.fileType?.includes('xls') ? 'accent' : 'brand'}>
                        {fileExtensionLabel(dataset.fileType)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 dp-num font-bold text-ink">{formatNumber(dataset.rows)}</td>
                    <td className="px-5 py-4 dp-num text-muted">{dataset.columns}</td>
                    <td className="px-5 py-4 text-faint font-mono">
                      {dataset.uploadedAt ? formatRelative(dataset.uploadedAt) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button as={Link} to={`/datasets/${dataset.id}`} size="sm" variant="soft" iconRight={ArrowRight}>
                        Open Studio
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
