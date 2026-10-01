import { NavLink } from 'react-router-dom'
import { Activity, CloudUpload, Database, LayoutDashboard, X } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true, hint: 'Portfolio-wide metrics' },
  { to: '/datasets', label: 'Datasets', icon: Database, hint: 'Browse and open datasets' },
  { to: '/upload', label: 'Upload', icon: CloudUpload, hint: 'Add a CSV or Excel file' },
]

function Brand({ onNavigate }) {
  return (
    <NavLink
      to="/"
      onClick={onNavigate}
      className="flex items-center gap-2.5 rounded-xl px-1 py-1 text-ink no-underline"
    >
      <span
        className="grid size-9 place-items-center rounded-xl text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, var(--dp-chart-1), var(--dp-chart-7))' }}
        aria-hidden="true"
      >
        <Activity size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold leading-tight tracking-tight">DataPulse</span>
        <span className="block text-[0.6875rem] font-semibold leading-tight text-faint">Intelligence Studio</span>
      </span>
    </NavLink>
  )
}

/**
 * Fixed rail on desktop, slide-over drawer on mobile. Active styling comes from
 * `aria-current="page"`, which NavLink sets for us.
 */
export default function Sidebar({ open, onClose, footer }) {
  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
      <p className="dp-label mb-1 px-1">Workspace</p>
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose} className="dp-nav-item" title={item.hint}>
          <item.icon size={17} aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-5 border-r border-line bg-surface/70 p-4 backdrop-blur lg:flex">
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
          className={`absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-5 border-r border-line bg-surface p-4 shadow-2xl transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
          aria-label="Navigation drawer"
        >
          <div className="flex items-center justify-between">
            <Brand onNavigate={onClose} />
            <button type="button" onClick={onClose} className="dp-btn dp-btn-icon dp-btn-ghost size-9" aria-label="Close navigation">
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
