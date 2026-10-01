import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChartColumn,
  CloudUpload,
  Columns3,
  Database,
  RefreshCw,
  Rows3,
} from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { SearchInput, Select } from '../components/ui/Field'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { TiltCard } from '../components/ui/GestureCards'
import { listMyDatasets } from '../api/datasets'
import { useAsyncData } from '../hooks/useAsyncData'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { fileExtensionLabel, formatCompact, formatDate, formatRelative } from '../lib/format'

const SORTS = [
  { value: 'recent', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'rows-desc', label: 'Most rows' },
  { value: 'columns-desc', label: 'Most columns' },
  { value: 'name-asc', label: 'Name, A → Z' },
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
    <TiltCard maxTilt={8} scale={1.02} className="h-full">
      <Link
        to={`/datasets/${dataset.id}`}
        className="dp-card group flex h-full flex-col p-4 sm:p-5 no-underline"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="dp-tile" aria-hidden="true">
            <ChartColumn size={18} />
          </span>
          <div className="flex items-center gap-1.5">
            {dataset.firebaseStorageUrl ? (
              <Badge tone="brand">Cloud</Badge>
            ) : null}
            <Badge>{fileExtensionLabel(dataset.fileType)}</Badge>
          </div>
        </div>

      <h2 className="mt-3.5 line-clamp-2 text-sm font-bold text-ink" title={dataset.filename}>
        {dataset.filename}
      </h2>
      <p className="mt-1 text-xs text-faint">
        {dataset.uploadedAt ? `Uploaded ${formatRelative(dataset.uploadedAt)}` : `Dataset #${dataset.id}`}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3.5">
        <div>
          <dt className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-faint">
            <Rows3 size={11} aria-hidden="true" />
            Rows
          </dt>
          <dd className="dp-num text-base font-bold text-ink">{formatCompact(dataset.rows)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-faint">
            <Columns3 size={11} aria-hidden="true" />
            Columns
          </dt>
          <dd className="dp-num text-base font-bold text-ink">{dataset.columns}</dd>
        </div>
      </dl>

      <p className="mt-4 flex items-center gap-1.5 text-xs font-bold text-brand">
        Open studio
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </p>
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
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query, 180)
  const [sort, setSort] = useState('recent')

  const datasets = data ?? NO_DATASETS

  const visible = useMemo(() => {
    const needle = debounced.trim().toLowerCase()
    const filtered = needle
      ? datasets.filter((dataset) => dataset.filename.toLowerCase().includes(needle))
      : datasets
    return [...filtered].sort(COMPARATORS[sort] ?? COMPARATORS.recent)
  }, [datasets, debounced, sort])

  const newest = datasets.reduce((best, dataset) => (time(dataset.uploadedAt) > time(best?.uploadedAt) ? dataset : best), null)

  const header = (
    <PageHeader
      eyebrow="Datasets"
      title="Your datasets"
      description="Open any dataset to profile it, build charts and export what you find."
      breadcrumbs={[{ label: 'Overview', to: '/' }, { label: 'Datasets' }]}
      meta={
        datasets.length ? (
          <>
            <Badge tone="brand">{datasets.length} total</Badge>
            <Badge>
              {formatCompact(datasets.reduce((sum, dataset) => sum + dataset.rows, 0))} rows combined
            </Badge>
            {newest?.uploadedAt ? <Badge>Latest {formatDate(newest.uploadedAt)}</Badge> : null}
          </>
        ) : null
      }
      actions={
        <>
          <Button variant="soft" icon={RefreshCw} loading={refreshing} onClick={refetch}>
            Refresh
          </Button>
          <Button as={Link} to="/upload" variant="primary" icon={CloudUpload}>
            Upload
          </Button>
        </>
      }
    />
  )

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <SkeletonGrid count={8} itemClassName="h-52" />
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
    <div className="space-y-6">
      {header}

      {datasets.length ? (
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by filename…"
            className="min-w-48 flex-1 sm:max-w-sm"
          />
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            options={SORTS}
            aria-label="Sort datasets"
            wrapperClassName="w-auto"
            className="w-auto"
          />
          <p className="ml-auto text-xs text-faint">
            Showing <span className="dp-num font-bold text-ink">{visible.length}</span> of {datasets.length}
          </p>
        </div>
      ) : null}

      {datasets.length === 0 ? (
        <div className="dp-card">
          <EmptyState
            icon={Database}
            title="No datasets yet"
            description="Upload a CSV or Excel file and it will appear here, cleaned and profiled."
            action={
              <Button as={Link} to="/upload" variant="primary" icon={CloudUpload}>
                Upload a file
              </Button>
            }
          />
        </div>
      ) : visible.length === 0 ? (
        <div className="dp-card">
          <EmptyState
            icon={Database}
            title={`No dataset matches “${query}”`}
            description="Try a different part of the filename."
            action={
              <Button variant="soft" onClick={() => setQuery('')}>
                Clear search
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visible.map((dataset) => (
            <DatasetCard key={dataset.id} dataset={dataset} />
          ))}
        </div>
      )}
    </div>
  )
}
