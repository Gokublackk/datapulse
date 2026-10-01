import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CircleCheckBig,
  CloudUpload,
  FileSpreadsheet,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/StatTile'
import { ErrorState } from '../components/ui/EmptyState'
import { TiltCard } from '../components/ui/GestureCards'
import { uploadDataset, uploadSampleDataset } from '../api/datasets'
import { invalidateCache } from '../hooks/useAsyncData'
import { useWorkspace } from '../context/WorkspaceProvider'
import { useToast } from '../context/ToastProvider'
import { formatBytes, formatCompact, formatNumber } from '../lib/format'

const ACCEPTED = ['.csv', '.xls', '.xlsx']
const MAX_BYTES = 60 * 1024 * 1024

function validate(file) {
  if (!file) return 'Choose a file to upload.'
  const name = file.name.toLowerCase()
  if (!ACCEPTED.some((extension) => name.endsWith(extension))) {
    return `Unsupported file type. Upload one of ${ACCEPTED.join(', ')}.`
  }
  if (file.size === 0) return 'That file is empty.'
  if (file.size > MAX_BYTES) return `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_BYTES)}.`
  return null
}

function ReportRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="dp-num text-sm font-bold text-ink">{value}</dd>
    </div>
  )
}

/** Drag-and-drop ingest with real byte progress and the cleaning summary. */
export default function UploadPage() {
  const { workspaceId, loading: workspaceLoading, error: workspaceError, reload } = useWorkspace()
  const navigate = useNavigate()
  const toast = useToast()
  const inputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const choose = useCallback((next) => {
    const message = validate(next)
    if (message) {
      setError(message)
      setFile(null)
      return
    }
    setError(null)
    setResult(null)
    setProgress(0)
    setFile(next)
  }, [])

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    const dropped = event.dataTransfer?.files?.[0]
    if (dropped) choose(dropped)
  }

  const submit = async () => {
    if (!file || !workspaceId) return
    setUploading(true)
    setError(null)
    setProgress(0)
    try {
      const uploaded = await uploadDataset({
        workspaceId,
        file,
        onProgress: setProgress,
      })
      // The dataset lists and this workspace's charts are now stale.
      invalidateCache('datasets:')
      invalidateCache('workspace:')
      setResult(uploaded)
      setFile(null)
      toast.success(`${uploaded.filename} is ready — ${formatCompact(uploaded.rows)} rows profiled.`, {
        title: 'Upload complete',
      })
    } catch (caught) {
      setError(caught)
      toast.error(caught.message, { title: 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  const handleSampleUpload = async (type) => {
    if (!workspaceId) return
    setUploading(true)
    setError(null)
    setProgress(30)
    try {
      const uploaded = await uploadSampleDataset(workspaceId, type)
      invalidateCache('datasets:')
      invalidateCache('workspace:')
      setResult(uploaded)
      toast.success(`Sample dataset loaded — ${formatCompact(uploaded.rows)} rows profiled.`)
    } catch (caught) {
      setError(caught)
      toast.error(caught.message, { title: 'Sample load failed' })
    } finally {
      setUploading(false)
      setProgress(100)
    }
  }

  const report = result?.cleaningReport

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Upload"
        title="Add a dataset"
        description="CSV, XLS or XLSX. The file is cleaned, typed and quality-scored on arrival."
        breadcrumbs={[{ label: 'Overview', to: '/' }, { label: 'Upload' }]}
      />

      {workspaceError ? (
        <ErrorState
          compact
          error={`Could not reach your workspace: ${workspaceError.message}`}
          onRetry={reload}
        />
      ) : null}

      {result ? (
        <section className="dp-card animate-pop p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success" aria-hidden="true">
              <CircleCheckBig size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-ink">{result.filename} is ready</h2>
              <p className="mt-1 text-sm text-muted">
                {formatNumber(result.rows)} rows and {result.columns} columns were ingested and profiled.
              </p>
            </div>
          </div>

          {report ? (
            <dl className="mt-5 divide-y divide-line border-t border-line pt-2">
              {report.original_rows != null ? (
                <ReportRow label="Rows in source file" value={formatNumber(report.original_rows)} />
              ) : null}
              {report.cleaned_rows != null ? (
                <ReportRow label="Rows kept" value={formatNumber(report.cleaned_rows)} />
              ) : null}
              {report.empty_rows_removed != null ? (
                <ReportRow label="Empty rows removed" value={formatNumber(report.empty_rows_removed)} />
              ) : null}
              {report.duplicate_rows_removed != null ? (
                <ReportRow label="Duplicate rows removed" value={formatNumber(report.duplicate_rows_removed)} />
              ) : null}
              {report.missing_values_remaining != null ? (
                <ReportRow label="Missing values remaining" value={formatNumber(report.missing_values_remaining)} />
              ) : null}
              {report.quality_score != null ? (
                <ReportRow label="Quality score" value={`${Math.round(report.quality_score)} / 100`} />
              ) : null}
            </dl>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              variant="primary"
              icon={Sparkles}
              iconRight={ArrowRight}
              onClick={() => navigate(`/datasets/${result.datasetId}`)}
            >
              Open the studio
            </Button>
            <Button variant="soft" onClick={() => setResult(null)}>
              Upload another
            </Button>
            <Button as={Link} to="/datasets" variant="ghost">
              All datasets
            </Button>
          </div>
        </section>
      ) : (
        <TiltCard className="dp-card p-4 sm:p-6">
          <div
            className="dp-dropzone cursor-pointer"
            data-dragging={dragging}
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand/15 text-brand" aria-hidden="true">
                <CloudUpload size={26} />
              </span>
              <h2 className="mt-4 text-base font-bold text-ink">Drop your file here</h2>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
                or browse for a CSV or Excel file. Up to {formatBytes(MAX_BYTES)}.
              </p>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED.join(',')}
                className="sr-only"
                onChange={(event) => {
                  const picked = event.target.files?.[0]
                  if (picked) choose(picked)
                  event.target.value = ''
                }}
              />
              <Button
                className="mt-5"
                variant="primary"
                icon={FileSpreadsheet}
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                Choose file
              </Button>

              <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                {ACCEPTED.map((extension) => (
                  <Badge key={extension}>{extension.replace('.', '').toUpperCase()}</Badge>
                ))}
              </div>
            </div>
          </div>

          {file ? (
            <div className="dp-card-quiet mt-4 flex items-center gap-3 p-3.5">
              <span className="dp-tile shrink-0" aria-hidden="true">
                <FileSpreadsheet size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink" title={file.name}>
                  {file.name}
                </p>
                <p className="dp-num text-xs text-faint">{formatBytes(file.size)}</p>
              </div>
              {!uploading ? (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  aria-label="Remove selected file"
                  className="dp-btn dp-btn-icon dp-btn-ghost size-8"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ) : null}

          {uploading ? (
            <ProgressBar
              className="mt-4"
              value={progress}
              label={progress >= 100 ? 'Cleaning and profiling on the server…' : 'Uploading'}
            />
          ) : null}

          {error ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-danger/40 bg-danger/10 p-3.5" role="alert">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
              <p className="min-w-0 flex-1 text-sm text-ink">
                {typeof error === 'string' ? error : error.message}
              </p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              icon={CloudUpload}
              loading={uploading}
              disabled={!file || !workspaceId || workspaceLoading}
              onClick={submit}
            >
              {uploading ? `Uploading ${progress}%` : 'Upload and profile'}
            </Button>
            {!workspaceId && !workspaceError ? (
              <p className="text-xs text-faint">Preparing your workspace…</p>
            ) : null}
          </div>

          {/* Quick 1-Click Samples */}
          <div className="mt-6 pt-5 border-t border-line">
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2.5">
              Or Try a Curated Sample Dataset
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="soft"
                size="sm"
                icon={Sparkles}
                disabled={uploading}
                onClick={() => handleSampleUpload('sales')}
              >
                Global E-Commerce Sales
              </Button>
              <Button
                variant="soft"
                size="sm"
                icon={Sparkles}
                disabled={uploading}
                onClick={() => handleSampleUpload('health')}
              >
                Healthcare Vitality Metrics
              </Button>
            </div>
          </div>
        </TiltCard>
      )}

      <section className="dp-card-quiet p-4 sm:p-5">
        <h2 className="text-sm font-bold text-ink">What happens on upload</h2>
        <ol className="mt-3 space-y-2.5 text-sm text-muted">
          <li className="flex gap-2.5">
            <span className="dp-num shrink-0 font-bold text-brand">1.</span>
            Blank and duplicate rows are removed and a quality score is computed.
          </li>
          <li className="flex gap-2.5">
            <span className="dp-num shrink-0 font-bold text-brand">2.</span>
            Column types are inferred — numbers, dates, categories and free text.
          </li>
          <li className="flex gap-2.5">
            <span className="dp-num shrink-0 font-bold text-brand">3.</span>
            Distributions, outliers and correlations are profiled, and charts are recommended.
          </li>
        </ol>
      </section>
    </div>
  )
}
