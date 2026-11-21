import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ChartColumn,
  CheckCircle2,
  Cpu,
  Flame,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Radio,
  Rocket,
  ShieldCheck,
  Sparkles,
  Terminal,
  TriangleAlert,
  User,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthProvider'
import { Button } from '../components/ui/Button'
import { TiltCard } from '../components/ui/GestureCards'
import { LoadingScreen } from '../components/ui/Skeleton'

const FEATURES = [
  {
    icon: Zap,
    title: 'Autonomous Ingestion Engine',
    body: 'CSV and Excel files are cleaned, typed, and profiled on ingest with real-time cloud sync.',
    tag: 'Instant Sync',
  },
  {
    icon: Flame,
    title: 'Interactive Preprocessing Lab',
    body: 'Impute missing values, drop outliers, normalize, and cast types with live before/after diffs.',
    tag: 'One-Click ML Prep',
  },
  {
    icon: ChartColumn,
    title: 'Smart Visualization Matrix',
    body: 'Automated chart recommendations, correlation heatmap, and multi-format exports.',
    tag: 'AI Recommender',
  },
]

export default function LoginPage() {
  const {
    isAuthenticated,
    initialising,
    signingIn,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAsDemo,
    clearError,
  } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from ?? '/'

  const [authMode, setAuthMode] = useState('google') // 'google' | 'email' | 'demo'
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, from, navigate])

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: 'Required', color: 'bg-muted/20' }
    let s = 0
    if (password.length >= 6) s += 1
    if (password.length >= 9) s += 1
    if (/[0-9]/.test(password)) s += 1
    if (/[^A-Za-z0-9]/.test(password)) s += 1
    if (s <= 1) return { score: 1, label: 'Weak', color: 'bg-danger' }
    if (s === 2) return { score: 2, label: 'Moderate', color: 'bg-warn' }
    if (s === 3) return { score: 3, label: 'Strong', color: 'bg-accent' }
    return { score: 4, label: 'Quantum-Grade', color: 'bg-success' }
  }, [password])

  if (initialising) return <LoadingScreen label="Booting Intelligence Studio…" />
  if (isAuthenticated) return <Navigate to={from} replace />

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    try {
      if (isRegistering) {
        await signUpWithEmail(email, password, displayName)
      } else {
        await signInWithEmail(email, password)
      }
    } catch {
      // Error handled in AuthProvider state
    }
  }

  return (
    <div className="relative min-h-dvh flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-canvas bg-cyber-grid">
      {/* Dynamic Ambient Background Glows */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 size-[36rem] rounded-full blur-[140px] opacity-50 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, var(--dp-brand) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 size-[36rem] rounded-full blur-[140px] opacity-40 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, var(--dp-accent) 0%, transparent 70%)', animationDelay: '-1.5s' }}
      />

      <div className="relative z-10 w-full max-w-5xl grid gap-10 lg:grid-cols-12 items-center">
        {/* Left Side: Brand Story & Interactive Telemetry Engine */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-7 animate-rise">
          {/* Header Brand */}
          <div className="flex items-center gap-3.5">
            <span
              className="relative grid size-13 place-items-center rounded-2xl text-white shadow-2xl pulse-radar"
              style={{ background: 'linear-gradient(135deg, var(--dp-chart-1), var(--dp-chart-7))' }}
              aria-hidden="true"
            >
              <Activity size={26} className="animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black tracking-tight text-ink">DataPulse</span>
                <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-widest text-brand border border-brand/30">
                  v2.0 Pro Engine
                </span>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Enterprise Autonomous Intelligence Studio
              </p>
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl leading-[1.15]">
              Turn raw datasets into{' '}
              <span className="bg-gradient-to-r from-brand via-accent to-success bg-clip-text text-transparent">
                actionable intelligence.
              </span>
            </h1>
            <p className="mt-3.5 text-sm text-muted leading-relaxed max-w-lg">
              Engineered for data scientists, analysts, and founders. Experience automated data cleaning,
              high-speed distribution profiling, one-click preprocessing, and AI-recommended visualizations.
            </p>
          </div>

          {/* Futuristic Live Telemetry HUD Widget */}
          <div className="rounded-2xl border border-line-strong/50 bg-surface/75 p-4 shadow-xl backdrop-blur-xl space-y-3 hud-corner">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-ink">
                <Radio size={14} className="text-success animate-pulse" />
                <span>INTELLIGENCE STREAM ACTIVE</span>
              </span>
              <span className="font-mono text-[0.6875rem] text-faint">NODE-CLUSTER: US-CLOUD-01</span>
            </div>

            {/* Live Waveform SVG Monitor */}
            <div className="h-10 w-full overflow-hidden rounded-xl bg-canvas/80 border border-line/60 flex items-center px-3">
              <svg className="w-full h-8 text-brand stroke-current fill-none stroke-[2] opacity-85" viewBox="0 0 400 30">
                <path
                  d="M0 15 Q 25 5, 50 15 T 100 15 T 150 5 T 200 25 T 250 10 T 300 20 T 350 5 T 400 15"
                  className="animate-pulse"
                />
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-[0.6875rem]">
              <div className="rounded-lg bg-subtle p-1.5 border border-line">
                <span className="block text-faint text-[0.625rem]">INGESTION SPEED</span>
                <span className="font-bold text-ink">1.2M rows/s</span>
              </div>
              <div className="rounded-lg bg-subtle p-1.5 border border-line">
                <span className="block text-faint text-[0.625rem]">PIPELINE HEALTH</span>
                <span className="font-bold text-success">99.98% OK</span>
              </div>
              <div className="rounded-lg bg-subtle p-1.5 border border-line">
                <span className="block text-faint text-[0.625rem]">LATENCY</span>
                <span className="font-bold text-accent">&lt; 4ms</span>
              </div>
            </div>
          </div>

          {/* Core Feature Highlights */}
          <div className="grid gap-3 pt-1">
            {FEATURES.map((item) => (
              <div
                key={item.title}
                className="group flex items-start gap-3.5 rounded-xl border border-line/70 bg-surface/50 p-3 hover:border-brand/40 hover:bg-surface/90 transition-all duration-200"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand mt-0.5 group-hover:scale-110 transition-transform">
                  <item.icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-ink">{item.title}</h3>
                    <span className="text-[0.625rem] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                      {item.tag}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-1 flex items-center gap-3 text-xs font-semibold text-faint">
            <span className="inline-flex items-center gap-1.5 text-success">
              <ShieldCheck size={15} /> End-to-end token verification
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-accent">
              <Cpu size={15} /> Local & Cloud Analytics
            </span>
          </div>
        </div>

        {/* Right Side: Futuristic 3D Holographic Launchpad Card */}
        <div className="lg:col-span-5 w-full">
          <div className="glow-border-wrap shadow-2xl">
            <TiltCard
              maxTilt={5}
              scale={1.01}
              className="dp-card w-full p-6 sm:p-8 bg-surface/90 backdrop-blur-2xl border-none"
            >
              {/* Header */}
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[0.6875rem] font-bold text-brand uppercase tracking-wider border border-brand/25">
                    <Sparkles size={12} className="text-brand animate-spin" style={{ animationDuration: '4s' }} /> Studio Access
                  </span>
                  <span className="text-[0.6875rem] text-faint font-mono font-semibold">RELEASE 2.0</span>
                </div>
                <h2 className="mt-3.5 text-2xl font-black tracking-tight text-ink">
                  Launchpad
                </h2>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Authenticate your workspace credentials to enter the intelligence studio.
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl border border-line bg-subtle p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('google')
                    clearError()
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
                    authMode === 'google'
                      ? 'bg-surface text-ink shadow-sm border border-line'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <Globe size={13} className={authMode === 'google' ? 'text-brand' : ''} />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('email')
                    clearError()
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
                    authMode === 'email'
                      ? 'bg-surface text-ink shadow-sm border border-line'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <Mail size={13} className={authMode === 'email' ? 'text-accent' : ''} />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('demo')
                    clearError()
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
                    authMode === 'demo'
                      ? 'bg-brand text-white shadow-md'
                      : 'text-brand hover:text-ink'
                  }`}
                >
                  <Rocket size={13} />
                  Demo
                </button>
              </div>

              {/* Error Message Banner */}
              {error ? (
                <div
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-danger/40 bg-danger/10 p-3.5 text-xs animate-shake"
                  role="alert"
                >
                  <TriangleAlert size={16} className="mt-0.5 shrink-0 text-danger" />
                  <p className="flex-1 text-ink leading-relaxed">{error}</p>
                  <button type="button" onClick={clearError} className="font-bold text-muted hover:text-ink">
                    ✕
                  </button>
                </div>
              ) : null}

              {/* Mode 1: Google OAuth Sign In */}
              {authMode === 'google' ? (
                <div className="mt-6 space-y-4">
                  <Button
                    variant="primary"
                    size="lg"
                    block
                    loading={signingIn}
                    onClick={() => signInWithGoogle().catch(() => {})}
                    className="h-12 shadow-xl shadow-brand/25 font-extrabold text-sm tracking-wide"
                  >
                    {signingIn ? 'Connecting with Google OAuth…' : 'Continue with Google'}
                  </Button>

                  <div className="rounded-xl border border-line bg-subtle/60 p-3.5 text-xs text-muted flex items-start gap-2.5">
                    <ShieldCheck size={18} className="text-brand shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-ink">Official Single Sign-On</p>
                      <p className="text-[0.6875rem] text-faint mt-0.5">
                        Secured via Google Identity. Authorized tokens are signed and verified cryptographically.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Mode 2: Email & Password (Login / Registration) */}
              {authMode === 'email' ? (
                <form onSubmit={handleEmailSubmit} className="mt-5 space-y-3.5">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold text-ink">
                      {isRegistering ? 'Create Studio Account' : 'Account Sign In'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(!isRegistering)
                        clearError()
                      }}
                      className="text-xs font-bold text-brand hover:underline"
                    >
                      {isRegistering ? 'Have an account? Sign In' : 'Need an account? Sign Up'}
                    </button>
                  </div>

                  {isRegistering ? (
                    <div>
                      <label className="dp-label block mb-1">Full Name</label>
                      <div className="relative">
                        <User size={15} className="absolute left-3 top-3 text-faint" />
                        <input
                          type="text"
                          required
                          placeholder="Nikhil P"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="dp-input w-full pl-9 text-sm"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label className="dp-label block mb-1">Email Address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-3 text-faint" />
                      <input
                        type="email"
                        required
                        placeholder="analyst@datapulse.io"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="dp-input w-full pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="dp-label block mb-1">Password</label>
                    <div className="relative">
                      <KeyRound size={15} className="absolute left-3 top-3 text-faint" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="dp-input w-full pl-9 text-sm"
                      />
                    </div>

                    {/* Interactive Password Strength Gauge during Signup */}
                    {isRegistering && password ? (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[0.625rem] font-bold">
                          <span className="text-faint">Security Index:</span>
                          <span className="text-ink">{passwordStrength.label}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 h-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`rounded-full transition-all duration-300 ${
                                passwordStrength.score >= level ? passwordStrength.color : 'bg-subtle'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    block
                    loading={signingIn}
                    className="mt-4 h-11 font-bold shadow-lg shadow-brand/20"
                  >
                    {signingIn
                      ? 'Authenticating Credentials…'
                      : isRegistering
                      ? 'Create Studio Account'
                      : 'Sign In to Workspace'}
                  </Button>
                </form>
              ) : null}

              {/* Mode 3: Instant Demo Studio Mode */}
              {authMode === 'demo' ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-brand/30 bg-brand/10 p-4 text-xs text-ink space-y-2">
                    <p className="font-extrabold flex items-center gap-1.5 text-brand text-sm">
                      <Rocket size={16} /> 1-Click Guest Test Drive
                    </p>
                    <p className="text-muted leading-relaxed">
                      Instant zero-credential access. Launch immediately with fully profiled real-world datasets:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="rounded-md bg-surface px-2 py-1 text-[0.625rem] font-bold text-ink border border-line">
                        📊 E-Commerce Sales (CSV)
                      </span>
                      <span className="rounded-md bg-surface px-2 py-1 text-[0.625rem] font-bold text-ink border border-line">
                        🏥 Healthcare Vitality (XLSX)
                      </span>
                      <span className="rounded-md bg-surface px-2 py-1 text-[0.625rem] font-bold text-ink border border-line">
                        ☁️ SaaS Retention (CSV)
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    block
                    iconRight={ArrowRight}
                    loading={signingIn}
                    onClick={() => signInAsDemo()}
                    className="h-12 font-extrabold shadow-xl shadow-brand/25 text-sm"
                  >
                    Launch Instant Studio Mode
                  </Button>
                </div>
              ) : null}
            </TiltCard>
          </div>
        </div>
      </div>
    </div>
  )
}
