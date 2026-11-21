import { NavLink } from 'react-router-dom'
import { Activity, CloudUpload, Database, LayoutDashboard, Radio, Sparkles, X } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true, hint: 'Portfolio-wide metrics', shortcut: '⌘1' },
  { to: '/datasets', label: 'Datasets', icon: Database, hint: 'Browse and open datasets', shortcut: '⌘2' },
  { to: '/upload', label: 'Ingestion Bay', icon: CloudUpload, hint: 'Add a CSV or Excel file', shortcut: '⌘3' },
]

function Brand({ onNavigate }) {
  return (
    <NavLink
      to="/"
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-2xl p-1.5 text-ink no-underline transition-all hover:bg-subtle/80"
    >
      <span
        className="relative grid size-10 place-items-center rounded-xl text-white shadow-xl transition-transform duration-300 group-hover:scale-105 pulse-radar"
        style={{ background: 'linear-gradient(135deg, var(--dp-chart-1), var(--dp-chart-7))' }}
        aria-hidden="true"
      >
        <Activity size={20} className="animate-pulse" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="block text-base font-black leading-tight tracking-tight">DataPulse</span>
          <span className="rounded bg-brand/15 px-1.5 py-0.2 text-[0.6rem] font-extrabold text-brand border border-brand/25">
            PRO
          </span>
        </div>
        <span className="block text-[0.6875rem] font-semibold leading-tight text-faint">
          Intelligence Studio
        </span>
      </div>
    </NavLink>
  )
}

/**
 * Fixed rail on desktop, slide-over drawer on mobile. Active styling comes from
 * `aria-current="page"`, which NavLink sets for us.
 */
export default function Sidebar({ open, onClose, footer }) {
  const nav = (
    <nav className="flex flex-1 flex-col gap-1.5" aria-label="Main">
      <div className="flex items-center justify-between px-2 mb-1">
        <p className="dp-label">Studio Modules</p>
        <span className="flex items-center gap-1 text-[0.625rem] font-bold text-success">
          <span className="size-1.5 rounded-full bg-success animate-ping" />
          ONLINE
        </span>
      </div>

      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onClose}
          className="group dp-nav-item relative overflow-hidden transition-all duration-200"
          title={item.hint}
        >
          <item.icon size={17} className="transition-transform group-hover:scale-110" aria-hidden="true" />
          <span className="font-bold flex-1">{item.label}</span>
          {item.shortcut ? (
            <span className="text-[0.625rem] font-mono text-faint opacity-60 group-hover:opacity-100 transition-opacity">
              {item.shortcut}
            </span>
          ) : null}
        </NavLink>
      ))}

      {/* Cyber Quick Info Box */}
      <div className="mt-auto rounded-xl border border-line-strong/40 bg-subtle/50 p-3 text-xs space-y-1.5">
        <div className="flex items-center justify-between text-[0.6875rem] font-bold text-ink">
          <span className="flex items-center gap-1 text-brand">
            <Sparkles size={12} /> Auto-Profiler
          </span>
          <span className="text-success font-mono text-[0.625rem]">v2.0 READY</span>
        </div>
        <p className="text-[0.6875rem] text-muted leading-relaxed">
          Ingestion, outlier detection, and correlation analysis run with instant local caching.
        </p>
      </div>
    </nav>
  )

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-5 border-r border-line bg-surface/80 p-4 backdrop-blur-2xl lg:flex bg-cyber-grid">
        <Brand />
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-5 border-r border-line bg-surface p-4 shadow-2xl transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
          aria-label="Navigation drawer"
        >
          <div className="flex items-center justify-between">
            <Brand onNavigate={onClose} />
            <button
              type="button"
              onClick={onClose}
              className="dp-btn dp-btn-icon dp-btn-ghost size-9"
              aria-label="Close navigation"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
          {nav}
          {footer}
        </aside>
      </div>
    </>
  )
}
