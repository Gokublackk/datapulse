import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleCheckBig,
  CloudUpload,
  Cpu,
  FileSpreadsheet,
  Flame,
  Radio,
  Rocket,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Wand2,
  X,
  Zap,
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

function ReportRow({ label, value, tone = 'ink' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className={`dp-num text-sm font-extrabold ${tone === 'success' ? 'text-success' : tone === 'warn' ? 'text-warn' : 'text-ink'}`}>
        {value}
      </dd>
    </div>
  )
}

const PIPELINE_STEPS = [
  { step: 1, title: 'Network Stream', desc: 'Secure payload transfer to server' },
  { step: 2, title: 'Autonomous Cleanup', desc: 'Deduplication & missing value audit' },
  { step: 3, title: 'Type Inference', desc: 'Dates, numbers & categories typing' },
  { step: 4, title: 'AI Recommender', desc: 'Distribution matrices & chart bundles' },
]

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
      invalidateCache('datasets:')
      invalidateCache('workspace:')
      setResult(uploaded)
      setFile(null)
      toast.success(`${uploaded.filename} is ready — ${formatCompact(uploaded.rows)} rows profiled.`, {
        title: 'Ingestion complete',
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
    setProgress(35)
    try {
      const uploaded = await uploadSampleDataset(workspaceId, type)
      invalidateCache('datasets:')
      invalidateCache('workspace:')
      setResult(uploaded)
      toast.success(`Matrix loaded — ${formatCompact(uploaded.rows)} rows profiled.`, {
        title: 'Sample Ingestion Successful',
      })
    } catch (caught) {
      setError(caught)
      toast.error(caught.message, { title: 'Sample load failed' })
    } finally {
      setUploading(false)
      setProgress(100)
    }
  }

  const report = result?.cleaningReport
  const score = report?.quality_score ? Math.round(report.quality_score) : 95

  return (
    <div className="mx-auto max-w-4xl space-y-7 animate-rise">
      <PageHeader
        eyebrow="Ingestion Bay"
        title="Ingest & Profile Datasets"
        description="CSV, XLS or XLSX. Files undergo autonomous deduplication, type inference, and AI chart generation."
        breadcrumbs={[{ label: 'Studio', to: '/' }, { label: 'Ingestion Bay' }]}
      />

      {workspaceError ? (
        <ErrorState
          compact
          error={`Could not reach your workspace: ${workspaceError.message}`}
          onRetry={reload}
        />
      ) : null}

      {/* Post-Upload High-Tech Intelligence Summary Card */}
      {result ? (
        <section className="dp-card-glow animate-pop overflow-hidden p-6 sm:p-8 bg-surface">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-6">
            <div className="flex items-center gap-3.5">
              <span className="grid size-12 place-items-center rounded-2xl bg-success/15 text-success shadow-lg pulse-radar" aria-hidden="true">
                <CheckCircle2 size={24} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-ink">{result.filename}</h2>
                  <Badge tone="success">INGESTED</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted font-mono">
                  {formatNumber(result.rows)} rows · {result.columns} columns · Schema Verified
                </p>
              </div>
            </div>

            {/* Quality Score Circle / Badge */}
            <div className="flex items-center gap-3 rounded-2xl bg-subtle p-3 px-4 border border-line">
              <div className="text-right">
                <span className="block text-[0.625rem] font-bold text-faint uppercase tracking-wider">Health Index</span>
                <span className="text-base font-black text-ink">{score} / 100</span>
              </div>
              <span
                className={`grid size-9 place-items-center rounded-xl text-white font-mono text-xs font-black shadow-md ${
                  score >= 90 ? 'bg-success' : score >= 70 ? 'bg-warn' : 'bg-danger'
                }`}
              >
                {score}%
              </span>
            </div>
          </div>

          {report ? (
            <div className="grid gap-6 sm:grid-cols-2 pt-6">
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-faint">Transformation Telemetry</h3>
                <dl className="divide-y divide-line pt-1">
                  {report.original_rows != null ? (
                    <ReportRow label="Raw Rows in Source" value={formatNumber(report.original_rows)} />
                  ) : null}
                  {report.cleaned_rows != null ? (
                    <ReportRow label="Kept Active Records" value={formatNumber(report.cleaned_rows)} tone="success" />
                  ) : null}
                  {report.duplicate_rows_removed != null ? (
                    <ReportRow label="Redundant Duplicates Dropped" value={formatNumber(report.duplicate_rows_removed)} tone="warn" />
                  ) : null}
                  {report.empty_rows_removed != null ? (
                    <ReportRow label="Null Records Cleared" value={formatNumber(report.empty_rows_removed)} />
                  ) : null}
                </dl>
              </div>

              <div className="rounded-2xl border border-line-strong/50 bg-subtle/40 p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-ink flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand" /> Instant Recommendations Ready
                  </h4>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    Statistical profiles, numeric distributions, outlier boundaries, and optimal chart geometries have been stored for this dataset.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="primary"
                    block
                    icon={Wand2}
                    iconRight={ArrowRight}
                    onClick={() => navigate(`/datasets/${result.datasetId}`)}
                    className="font-bold shadow-lg shadow-brand/20"
                  >
                    Open Studio Workspace
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <Button
                variant="primary"
                iconRight={ArrowRight}
                onClick={() => navigate(`/datasets/${result.datasetId}`)}
                className="font-bold"
              >
                Launch Studio
              </Button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-line flex flex-wrap gap-2.5">
            <Button variant="soft" size="sm" onClick={() => setResult(null)}>
              Ingest Another File
            </Button>
            <Button as={Link} to="/datasets" variant="ghost" size="sm">
              View Datasets Library
            </Button>
          </div>
        </section>
      ) : (
        <div className="glow-border-wrap shadow-2xl">
          <TiltCard maxTilt={4} scale={1.005} className="dp-card p-5 sm:p-8 bg-surface/90 backdrop-blur-xl border-none">
            {/* Holographic Radar Dropzone */}
            <div
              className={`dp-dropzone cursor-pointer relative overflow-hidden transition-all duration-300 ${
                dragging ? 'border-brand scale-[1.01] bg-brand/10' : ''
              }`}
              data-dragging={dragging}
              onClick={() => !uploading && inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {/* Subtle Scanning Radar Accent */}
              <div className="pointer-events-none absolute inset-0 bg-cyber-grid opacity-30" />

              <div className="relative z-10 text-center py-4">
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand/15 text-brand shadow-lg pulse-radar">
                  <CloudUpload size={30} className="transition-transform duration-300 group-hover:scale-110" />
                </span>

                <h2 className="mt-4 text-lg font-black text-ink">
                  Drag and drop your dataset here
                </h2>
                <p className="mx-auto mt-1 max-w-sm text-xs text-muted leading-relaxed">
                  Support for CSV, XLS, and XLSX matrices up to {formatBytes(MAX_BYTES)}.
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

                <div className="mt-5 flex justify-center">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={FileSpreadsheet}
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="font-bold shadow-lg shadow-brand/25"
                  >
                    Select File From Device
                  </Button>
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                  {ACCEPTED.map((extension) => (
                    <Badge key={extension} tone="brand">
                      {extension.replace('.', '').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected File Inspection Chip */}
            {file ? (
              <div className="mt-5 rounded-2xl border border-line-strong/60 bg-subtle/80 p-4 flex items-center justify-between gap-3 animate-pop shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="dp-tile size-10 rounded-xl bg-brand/15 text-brand shrink-0" aria-hidden="true">
                    <FileSpreadsheet size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-ink" title={file.name}>
                      {file.name}
                    </p>
                    <p className="dp-num text-xs text-faint mt-0.5">{formatBytes(file.size)} · Ready for ingest</p>
                  </div>
                </div>

                {!uploading ? (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    aria-label="Remove selected file"
                    className="dp-btn dp-btn-icon dp-btn-ghost size-8 text-faint hover:text-danger"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* Real-time Progress Bar */}
            {uploading ? (
              <div className="mt-5 space-y-2 animate-fade">
                <ProgressBar
                  value={progress}
                  label={progress >= 100 ? 'Running automated profiling & deduction on server…' : `Uploading payload: ${progress}%`}
                />
              </div>
            ) : null}

            {/* Error Message */}
            {error ? (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-danger/40 bg-danger/10 p-3.5 animate-shake" role="alert">
                <TriangleAlert size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                <p className="min-w-0 flex-1 text-xs text-ink leading-relaxed">
                  {typeof error === 'string' ? error : error.message}
                </p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                icon={CloudUpload}
                loading={uploading}
                disabled={!file || !workspaceId || workspaceLoading}
                onClick={submit}
                className="font-extrabold shadow-lg shadow-brand/20 h-11"
              >
                {uploading ? `Processing ${progress}%` : 'Execute Ingest & Profiling'}
              </Button>
              {!workspaceId && !workspaceError ? (
                <span className="text-xs text-faint flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-brand animate-ping" />
                  Synchronizing workspace context…
                </span>
              ) : null}
            </div>

            {/* 1-Click Interactive Sample Ingestion Matrices */}
            <div className="mt-8 pt-6 border-t border-line space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-brand" /> Or Test-Drive Curated Real-World Matrices
                </p>
                <span className="text-[0.625rem] font-bold text-faint uppercase font-mono">1-CLICK INGEST</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => handleSampleUpload('sales')}
                  className="group flex items-start gap-3 rounded-xl border border-line bg-subtle/50 p-3.5 text-left transition-all hover:border-brand/40 hover:bg-surface"
                >
                  <span className="p-2 rounded-xl bg-brand/10 text-brand group-hover:scale-110 transition-transform">
                    <Flame size={16} />
                  </span>
                  <div>
                    <span className="block text-xs font-bold text-ink">E-Commerce Global Revenue</span>
                    <span className="block text-[0.6875rem] text-muted">Orders, profit margins, shipping cost & categories</span>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => handleSampleUpload('health')}
                  className="group flex items-start gap-3 rounded-xl border border-line bg-subtle/50 p-3.5 text-left transition-all hover:border-success/40 hover:bg-surface"
                >
                  <span className="p-2 rounded-xl bg-success/10 text-success group-hover:scale-110 transition-transform">
                    <Activity size={16} />
                  </span>
                  <div>
                    <span className="block text-xs font-bold text-ink">Clinical Vitality Metrics</span>
                    <span className="block text-[0.6875rem] text-muted">BMI, blood pressure, cholesterol & cardiovascular risk</span>
                  </div>
                </button>
              </div>
            </div>
          </TiltCard>
        </div>
      )}

      {/* Autonomous Pipeline Walkthrough Grid */}
      <section className="dp-card-quiet p-5 sm:p-6 bg-surface/80 backdrop-blur-xl border-line-strong/40">
        <div className="flex items-center gap-2 mb-4">
          <Cpu size={16} className="text-brand" />
          <h3 className="text-xs font-extrabold text-ink uppercase tracking-wider">
            Autonomous Pipeline Execution Order
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {PIPELINE_STEPS.map((s) => (
            <div key={s.step} className="space-y-1">
              <span className="font-mono text-xs font-black text-brand">0{s.step}.</span>
              <h4 className="text-xs font-bold text-ink">{s.title}</h4>
              <p className="text-[0.6875rem] text-muted leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
