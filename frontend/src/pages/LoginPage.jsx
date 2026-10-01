import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ChartColumn,
  Flame,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
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
    title: 'Upload and it is ready',
    body: 'CSV and Excel files are cleaned, typed, and profiled on ingest with cloud sync.',
  },
  {
    icon: Flame,
    title: 'Interactive Preprocessing',
    body: 'Impute missing values, drop outliers, normalize, and cast types in 1 click.',
  },
  {
    icon: ChartColumn,
    title: 'Build any view instantly',
    body: 'Dynamic gesture-driven charts, correlation matrix, and instant PNG/CSV export.',
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

  if (initialising) return <LoadingScreen label="Checking your session…" />
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
    <div className="relative min-h-dvh flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-canvas">
      {/* Dynamic Ambient Background Glows */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 size-[32rem] rounded-full blur-[120px] opacity-40"
        style={{ background: 'radial-gradient(circle, var(--dp-brand) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 size-[32rem] rounded-full blur-[120px] opacity-35"
        style={{ background: 'radial-gradient(circle, var(--dp-accent) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-4xl grid gap-8 lg:grid-cols-2 items-center">
        {/* Left Side: Brand Story & Interactive Highlights */}
        <div className="hidden lg:flex flex-col justify-center space-y-6 animate-rise">
          <div className="flex items-center gap-3">
            <span
              className="grid size-12 place-items-center rounded-2xl text-white shadow-2xl"
              style={{ background: 'linear-gradient(135deg, var(--dp-chart-1), var(--dp-chart-7))' }}
              aria-hidden="true"
            >
              <Activity size={24} />
            </span>
            <div>
              <p className="text-2xl font-black tracking-tight text-ink">DataPulse</p>
              <p className="text-xs font-bold uppercase tracking-wider text-brand">Intelligence Studio</p>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl leading-tight">
              Turn raw datasets into actionable intelligence.
            </h1>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Automated data cleaning, statistical distribution profiling, interactive preprocessing,
              and instant chart recommendations.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {FEATURES.map((item) => (
              <div key={item.title} className="flex items-start gap-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand mt-0.5">
                  <item.icon size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-ink">{item.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-faint">
            <ShieldCheck size={14} className="text-success" />
            <span>Secure Firebase Cloud integration & local processing</span>
          </div>
        </div>

        {/* Right Side: Futuristic 3D Holographic Tilt Login Card */}
        <TiltCard
          maxTilt={6}
          scale={1.01}
          className="dp-card w-full max-w-md mx-auto p-6 sm:p-8 border border-line-strong/60 shadow-2xl backdrop-blur-2xl animate-pop"
        >
          {/* Header */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[0.6875rem] font-bold text-brand uppercase tracking-wider">
                <Sparkles size={12} /> Studio Access
              </span>
              <span className="text-[0.6875rem] text-faint font-semibold">DataPulse v1.2</span>
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-ink">
              Welcome to DataPulse
            </h2>
            <p className="mt-1 text-xs text-muted">
              Choose your preferred access method to enter the studio.
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
              className={`rounded-lg py-1.5 transition-all ${
                authMode === 'google'
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('email')
                clearError()
              }}
              className={`rounded-lg py-1.5 transition-all ${
                authMode === 'email'
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Email / Pass
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('demo')
                clearError()
              }}
              className={`rounded-lg py-1.5 transition-all ${
                authMode === 'demo'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-brand hover:text-ink'
              }`}
            >
              Instant Demo
            </button>
          </div>

          {/* Error Message Banner */}
          {error ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs" role="alert">
              <TriangleAlert size={15} className="mt-0.5 shrink-0 text-danger" />
              <p className="flex-1 text-ink">{error}</p>
              <button type="button" onClick={clearError} className="font-bold text-muted hover:text-ink">
                ✕
              </button>
            </div>
          ) : null}

          {/* Mode 1: Google Sign In */}
          {authMode === 'google' ? (
            <div className="mt-6 space-y-4">
              <Button
                variant="primary"
                size="lg"
                block
                loading={signingIn}
                onClick={() => signInWithGoogle().catch(() => {})}
                className="h-11 shadow-lg shadow-brand/20 font-bold"
              >
                {signingIn ? 'Connecting with Google…' : 'Continue with Google'}
              </Button>

              <div className="rounded-xl border border-line bg-subtle/50 p-3 text-xs text-muted flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-brand shrink-0" />
                <span>Single sign-on via official Google OAuth. Zero setup.</span>
              </div>
            </div>
          ) : null}

          {/* Mode 2: Email & Password */}
          {authMode === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="mt-5 space-y-3.5">
              {isRegistering ? (
                <div>
                  <label className="dp-label block mb-1">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-3 text-faint" />
                    <input
                      type="text"
                      required
                      placeholder="Alex Vance"
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
                    placeholder="user@example.com"
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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="dp-input w-full pl-9 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                loading={signingIn}
                className="mt-4 h-11 font-bold"
              >
                {signingIn
                  ? 'Verifying…'
                  : isRegistering
                  ? 'Create New Account'
                  : 'Sign In with Email'}
              </Button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering)
                    clearError()
                  }}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  {isRegistering
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          ) : null}

          {/* Mode 3: Instant Demo Mode */}
          {authMode === 'demo' ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-brand/30 bg-brand/10 p-3.5 text-xs text-ink space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-brand">
                  <Sparkles size={14} /> 1-Click Guest Test Drive
                </p>
                <p className="text-muted leading-relaxed">
                  Explore the studio immediately with preloaded sample datasets (E-commerce Sales, Healthcare Vitality, SaaS Metrics), interactive gestures, charts, and data preprocessing without needing credentials.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                block
                iconRight={ArrowRight}
                loading={signingIn}
                onClick={() => signInAsDemo()}
                className="h-11 font-bold shadow-lg shadow-brand/25"
              >
                Launch Demo Studio
              </Button>
            </div>
          ) : null}
        </TiltCard>
      </div>
    </div>
  )
}
