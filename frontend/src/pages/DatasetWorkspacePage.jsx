import { useCallback, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ChartColumn,
  Columns3,
  Database,
  Download,
  Lightbulb,
  RefreshCw,
  Rows3,
  Sheet,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wand2,
} from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { StatTile } from '../components/ui/StatTile'
import { Tabs, TabPanel } from '../components/ui/Tabs'
import { SearchInput, Select } from '../components/ui/Field'
import { SkeletonCard, SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { SwipeContainer } from '../components/ui/GestureCards'
import ChartCard from '../components/charts/ChartCard'
import ChartGrid from '../components/charts/ChartGrid'
import VisualExplorer from '../components/charts/VisualExplorer'
import ColumnProfileCard from '../components/data/ColumnProfileCard'
import CorrelationMatrix from '../components/data/CorrelationMatrix'
import DataTable from '../components/data/DataTable'
import InsightFeed from '../components/data/InsightFeed'
import QualityReport from '../components/data/QualityReport'
import PreprocessingStudio from '../components/data/PreprocessingStudio'
import { getDatasetData, getDatasetQuality, listMyDatasets } from '../api/datasets'
import { generateDatasetCharts, loadChartBundle } from '../api/charts'
import { invalidateCache, useAsyncData } from '../hooks/useAsyncData'
import { useToast } from '../context/ToastProvider'
import { COLUMN_TYPE, aggregateRows, correlationMatrix, profileDataset, toNumber } from '../lib/profile'
import { buildInsights, suggestCharts } from '../lib/insights'
import { downloadCsv, downloadJson } from '../lib/exporters'
import { formatCompact, formatNumber, formatPercent } from '../lib/format'

const TAB_IDS = ['overview', 'columns', 'preprocess', 'explore', 'charts', 'data', 'quality']

// Shared empty fallbacks: a fresh [] on every render would break every memo
// below, and profiling a wide dataset is not cheap enough to redo for nothing.
const NO_ROWS = []
const NO_COLUMNS = []

const TYPE_FILTERS = [
  { value: 'all', label: 'All types' },
  { value: COLUMN_TYPE.NUMBER, label: 'Numbers' },
  { value: COLUMN_TYPE.DATE, label: 'Dates' },
  { value: COLUMN_TYPE.CATEGORY, label: 'Categories' },
  { value: COLUMN_TYPE.BOOLEAN, label: 'Booleans' },
  { value: COLUMN_TYPE.TEXT, label: 'Text' },
]

const baseName = (filename) => String(filename ?? 'dataset').replace(/\.[^.]+$/, '')

/**
 * Chart data for one locally-derived suggestion.
 *
 * Histograms reuse the bins the profiler already computed; scatter plots sample
 * complete pairs; everything else goes through the same group-by the explorer
 * uses, so a suggested chart and a hand-built one always agree.
 */
function suggestionData(suggestion, rows, profile) {
  if (suggestion.chartType === 'histogram') {
    const column = profile.byName?.[suggestion.dimension]
    return (column?.histogram ?? []).map((bin) => ({ label: bin.label, value: bin.count }))
  }

  if (suggestion.chartType === 'scatter') {
    const points = []
    for (const row of rows) {
      const x = toNumber(row?.[suggestion.dimension])
      const y = toNumber(row?.[suggestion.measure])
      if (x !== null && y !== null) points.push({ x, y })
      if (points.length >= 3000) break
    }
    return points
  }

  const isDate = profile.byName?.[suggestion.dimension]?.type === COLUMN_TYPE.DATE
  return aggregateRows(rows, {
    dimension: suggestion.dimension,
    measure: suggestion.measure,
    aggregation: suggestion.aggregation,
    limit: suggestion.chartType === 'donut' ? 7 : 12,
    sort: isDate ? 'label-asc' : 'value-desc',
    dateGrain: isDate ? 'month' : 'none',
  })
}

/**
 * The dataset studio: one fetch of the rows, then every view is derived in the
 * browser. Charts and the quality report are fetched lazily when their tab is
 * first opened, and the active tab lives in the URL so it can be shared.
 */
export default function DatasetWorkspacePage() {
  const { datasetId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  const requested = searchParams.get('tab')
  const tab = TAB_IDS.includes(requested) ? requested : 'overview'
  const setTab = useCallback(
    (id) => setSearchParams(id === 'overview' ? {} : { tab: id }, { replace: true }),
    [setSearchParams],
  )

  const nextTab = useCallback(() => {
    const idx = TAB_IDS.indexOf(tab)
    if (idx < TAB_IDS.length - 1) setTab(TAB_IDS[idx + 1])
  }, [tab, setTab])

  const prevTab = useCallback(() => {
    const idx = TAB_IDS.indexOf(tab)
    if (idx > 0) setTab(TAB_IDS[idx - 1])
  }, [tab, setTab])

  const [explorerSeed, setExplorerSeed] = useState(null)
  const [columnQuery, setColumnQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [generating, setGenerating] = useState(false)

  const dataFetcher = useCallback((signal) => getDatasetData(datasetId, { signal }), [datasetId])
  const { data, error, loading, refreshing, refetch } = useAsyncData(dataFetcher, {
    key: `datasets:${datasetId}:data`,
  })

  // Warm from the list the Overview and Datasets pages already cached.
  const summaryFetcher = useCallback((signal) => listMyDatasets({ signal }), [])
  const { data: summaries } = useAsyncData(summaryFetcher, { key: 'datasets:my' })

  const chartsFetcher = useCallback((signal) => loadChartBundle(datasetId, { signal }), [datasetId])
  const charts = useAsyncData(chartsFetcher, {
    key: `datasets:${datasetId}:charts`,
    enabled: tab === 'charts',
  })

  const qualityFetcher = useCallback((signal) => getDatasetQuality(datasetId, { signal }), [datasetId])
  const quality = useAsyncData(qualityFetcher, {
    key: `datasets:${datasetId}:quality`,
    enabled: tab === 'quality',
  })

  const rows = data?.rows ?? NO_ROWS
  const columns = data?.columns ?? NO_COLUMNS
  const summary = summaries?.find((item) => String(item.id) === String(datasetId))
  const filename = summary?.filename ?? `Dataset #${datasetId}`

  const profile = useMemo(() => profileDataset(rows, columns), [rows, columns])
  const correlations = useMemo(() => correlationMatrix(rows, profile.measures), [rows, profile])
  const insights = useMemo(() => buildInsights(profile, correlations, rows), [profile, correlations, rows])

  const suggestions = useMemo(
    () => suggestCharts(profile, 6).map((item) => ({ ...item, data: suggestionData(item, rows, profile) })),
    [profile, rows],
  )

  const visibleColumns = useMemo(() => {
    const needle = columnQuery.trim().toLowerCase()
    return profile.columns.filter(
      (column) =>
        (typeFilter === 'all' || column.type === typeFilter) &&
        (!needle || column.name.toLowerCase().includes(needle)),
    )
  }, [profile, columnQuery, typeFilter])

  const exploreCorrelation = useCallback(
    (pair) => {
      setExplorerSeed({
        chartType: 'scatter',
        dimension: pair.x,
        measure: pair.x,
        measureY: pair.y,
        aggregation: 'sum',
      })
      setTab('explore')
    },
    [setTab],
  )

  const regenerate = async () => {
    setGenerating(true)
    try {
      await generateDatasetCharts(datasetId)
      invalidateCache(`datasets:${datasetId}:charts`)
      await charts.refetch()
      toast.success('Chart recommendations refreshed.')
    } catch (caught) {
      toast.error(caught.message, { title: 'Could not generate charts' })
    } finally {
      setGenerating(false)
    }
  }

  const exportRows = () => {
    downloadCsv(rows, columns, `${baseName(filename)}.csv`)
    toast.success(`Exported ${formatCompact(rows.length)} rows.`)
  }

  const exportProfile = () => {
    downloadJson(
      {
        dataset: filename,
        datasetId: Number(datasetId),
        exportedAt: new Date().toISOString(),
        rowCount: profile.rowCount,
        columnCount: profile.columnCount,
        completeness: Number(profile.completeness.toFixed(2)),
        duplicateRows: profile.duplicateRows,
        missingCells: profile.missingCells,
        columns: profile.columns.map((column) => ({
          name: column.name,
          type: column.type,
          present: column.present,
          missing: column.missing,
          unique: column.unique,
          outliers: column.outliers ?? 0,
          stats: column.stats ?? null,
        })),
        insights: insights.map(({ id, tone, title, body, metric }) => ({ id, tone, title, body, metric })),
        correlations: correlations.pairs,
      },
      `${baseName(filename)}-profile.json`,
    )
    toast.success('Profile exported as JSON.')
  }

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: Lightbulb, badge: insights.length || undefined },
      { id: 'columns', label: 'Columns', icon: Columns3, badge: profile.columnCount || undefined },
      { id: 'preprocess', label: 'Preprocess', icon: Wand2 },
      { id: 'explore', label: 'Explore', icon: SlidersHorizontal },
      { id: 'charts', label: 'Recommended', icon: ChartColumn, badge: charts.data?.charts?.length || undefined },
      { id: 'data', label: 'Data', icon: Sheet, badge: profile.rowCount ? formatCompact(profile.rowCount) : undefined },
      { id: 'quality', label: 'Quality', icon: ShieldCheck },
    ],
    [insights.length, profile.columnCount, profile.rowCount, charts.data],
  )

  const header = (
    <PageHeader
      eyebrow="Dataset studio"
      title={filename}
      description="Profiled in your browser over every row the API returned — findings, distributions, relationships and an interactive chart builder."
      breadcrumbs={[
        { label: 'Overview', to: '/' },
        { label: 'Datasets', to: '/datasets' },
        { label: filename },
      ]}
      meta={
        data ? (
          <>
            <Badge tone="brand">{formatCompact(data.totalRows)} rows</Badge>
            <Badge>{data.totalColumns} columns</Badge>
            <Badge tone={profile.completeness >= 99 ? 'success' : 'warn'}>
              {formatPercent(profile.completeness)} complete
            </Badge>
            {summary?.firebaseStorageUrl ? (
              <a
                href={summary.firebaseStorageUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Download from Firebase Cloud Storage"
              >
                <Badge tone="brand">Firebase Synced</Badge>
              </a>
            ) : null}
            {profile.sampled ? (
              <Badge tone="warn">profiled on the first {formatCompact(profile.sampledRows)} rows</Badge>
            ) : null}
          </>
        ) : null
      }
      actions={
        <>
          <Button variant="soft" icon={RefreshCw} loading={refreshing} onClick={refetch}>
            Refresh
          </Button>
          <Button variant="soft" icon={Sheet} onClick={exportRows} disabled={!rows.length}>
            CSV
          </Button>
          <Button variant="soft" icon={Download} onClick={exportProfile} disabled={!rows.length}>
            Profile
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
        <SkeletonCard className="h-96" />
      </div>
    )
  }

  if (error && !rows.length) {
    return (
      <div className="space-y-6">
        {header}
        <div className="dp-card">
          <ErrorState
            error={error}
            onRetry={refetch}
            title="Could not open this dataset"
            className="!py-12"
          />
          <div className="flex justify-center pb-8">
            <Button as={Link} to="/datasets" variant="soft" icon={Database}>
              Back to datasets
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="space-y-6">
        {header}
        <div className="dp-card">
          <EmptyState
            icon={Database}
            title="This dataset has no rows"
            description="The file was ingested but every row was removed during cleaning, so there is nothing to profile."
            action={
              <Button as={Link} to="/upload" variant="primary" icon={Sparkles}>
                Upload another file
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {header}

      {error ? <ErrorState compact error={error} onRetry={refetch} /> : null}

      <Tabs tabs={tabs} value={tab} onChange={setTab} idPrefix="studio" />

      <SwipeContainer onSwipeLeft={nextTab} onSwipeRight={prevTab} className="min-h-[500px]">

      <TabPanel id="overview" value={tab} idPrefix="studio" className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Rows"
            value={formatCompact(profile.rowCount)}
            icon={Rows3}
            hint={`${formatNumber(profile.rowCount)} records`}
          />
          <StatTile
            label="Columns"
            value={formatNumber(profile.columnCount)}
            icon={Columns3}
            hint={`${profile.measures.length} measures · ${profile.dimensions.length} dimensions`}
          />
          <StatTile
            label="Completeness"
            value={formatPercent(profile.completeness)}
            icon={ShieldCheck}
            tone={profile.completeness >= 99 ? 'success' : 'warn'}
            hint={`${formatCompact(profile.missingCells)} empty cells`}
          />
          <StatTile
            label="Duplicate rows"
            value={formatCompact(profile.duplicateRows)}
            icon={Database}
            tone={profile.duplicateRows ? 'warn' : 'success'}
            hint={profile.duplicateRows ? 'Totals will double-count' : 'Every row is distinct'}
          />
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink">What stands out</h2>
          <InsightFeed insights={insights} />
        </section>

        {suggestions.length ? (
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-ink">Views worth looking at</h2>
                <p className="mt-0.5 text-xs text-muted">
                  Chosen from the column types and drawn from the rows already in memory.
                </p>
              </div>
              <Button size="sm" variant="ghost" icon={SlidersHorizontal} onClick={() => setTab('explore')}>
                Build your own
              </Button>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {suggestions.map((suggestion, index) => (
                <ChartCard
                  key={suggestion.id}
                  title={suggestion.title}
                  chartType={suggestion.chartType}
                  data={suggestion.data}
                  xLabel={suggestion.dimension}
                  yLabel={suggestion.chartType === 'histogram' ? 'records' : suggestion.measure}
                  reason={suggestion.reason}
                  score={suggestion.score}
                  colorOffset={index}
                  height={280}
                />
              ))}
            </div>
          </section>
        ) : null}
      </TabPanel>

      <TabPanel id="columns" value={tab} idPrefix="studio" className="space-y-5">
        <CorrelationMatrix correlations={correlations} onExplore={exploreCorrelation} />

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={columnQuery}
            onChange={setColumnQuery}
            placeholder="Search columns…"
            className="min-w-48 flex-1 sm:max-w-xs"
          />
          <Select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            options={TYPE_FILTERS}
            aria-label="Filter columns by type"
            wrapperClassName="w-auto"
            className="w-auto"
          />
          <p className="ml-auto text-xs text-faint">
            Showing <span className="dp-num font-bold text-ink">{visibleColumns.length}</span> of{' '}
            {profile.columnCount}
          </p>
        </div>

        {visibleColumns.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleColumns.map((column) => (
              <ColumnProfileCard key={column.name} column={column} rowCount={profile.sampledRows} />
            ))}
          </div>
        ) : (
          <div className="dp-card">
            <EmptyState
              icon={Columns3}
              title="No column matches those filters"
              description="Clear the search or choose a different type."
              action={
                <Button
                  variant="soft"
                  onClick={() => {
                    setColumnQuery('')
                    setTypeFilter('all')
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          </div>
        )}
      </TabPanel>

      <TabPanel id="preprocess" value={tab} idPrefix="studio">
        <PreprocessingStudio datasetId={datasetId} profile={profile} onRefresh={refetch} />
      </TabPanel>

      <TabPanel id="explore" value={tab} idPrefix="studio">
        <VisualExplorer
          key={explorerSeed ? `${explorerSeed.measure}:${explorerSeed.measureY}` : 'default'}
          rows={rows}
          profile={profile}
          initial={explorerSeed}
        />
      </TabPanel>

      <TabPanel id="charts" value={tab} idPrefix="studio" className="space-y-4">
        <div className="dp-card-quiet flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-ink">Server recommendations</h2>
            <p className="mt-0.5 text-xs text-muted">
              Aggregated by the backend and stored with the dataset. Regenerating replaces the set.
            </p>
          </div>
          <Button variant="primary" icon={Sparkles} loading={generating} onClick={regenerate}>
            Regenerate
          </Button>
        </div>

        {charts.error && !charts.data?.charts?.length ? (
          <div className="dp-card">
            <ErrorState
              error={charts.error}
              onRetry={charts.refetch}
              title="Could not load the recommended charts"
            />
          </div>
        ) : (
          <ChartGrid
            charts={charts.data?.charts ?? []}
            series={charts.data?.series ?? {}}
            loading={charts.loading}
            emptyAction={
              <Button variant="primary" icon={Sparkles} loading={generating} onClick={regenerate}>
                Generate charts
              </Button>
            }
          />
        )}
      </TabPanel>

      <TabPanel id="data" value={tab} idPrefix="studio">
        <DataTable rows={rows} columns={columns} profile={profile} filename={filename} />
      </TabPanel>

      <TabPanel id="quality" value={tab} idPrefix="studio">
        <QualityReport
          report={quality.data}
          profile={profile}
          loading={quality.loading}
          error={quality.error}
          onRetry={quality.refetch}
        />
      </TabPanel>
      </SwipeContainer>
    </div>
  )
}

