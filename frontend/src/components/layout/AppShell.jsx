import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { CircleCheckBig, TriangleAlert } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import CommandPalette from './CommandPalette'
import { LoadingScreen } from '../ui/Skeleton'
import { ErrorBoundary } from '../common/ErrorBoundary'
import { useHotkey } from '../../hooks/useHotkey'
import { checkApiHealth } from '../../api/workspaces'
import { API_BASE_URL } from '../../lib/apiClient'

/** Small live indicator so a stopped backend is obvious instead of mysterious. */
function ApiStatus() {
  const [state, setState] = useState('checking')

  useEffect(() => {
    let active = true
    const ping = () =>
      checkApiHealth()
        .then(() => active && setState('online'))
        .catch(() => active && setState('offline'))
    ping()
    const timer = window.setInterval(ping, 60_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  if (state === 'checking') return null

  const online = state === 'online'
  return (
    <div
      className={`dp-card-quiet flex items-start gap-2 p-2.5 text-xs ${online ? 'text-muted' : 'text-danger'}`}
      title={API_BASE_URL}
    >
      {online ? (
        <CircleCheckBig size={13} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
      ) : (
        <TriangleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
      )}
      <span className="min-w-0">
        <span className="block font-bold">{online ? 'API connected' : 'API unreachable'}</span>
        <span className="block truncate text-faint">{online ? 'Backend responding' : 'Start the FastAPI server'}</span>
      </span>
    </div>
  )
}

/** Authenticated chrome: rail, top bar, command palette and the routed page. */
export default function AppShell() {
  const [navOpen, setNavOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const location = useLocation()

  // Opening the palette closes the mobile drawer, so a jump from the palette
  // never leaves the drawer covering the page it lands on. Every link inside
  // the drawer closes it on click, so no route-change effect is needed.
  const openPalette = () => {
    setNavOpen(false)
    setPaletteOpen(true)
  }

  useHotkey('mod+k', () => {
    setNavOpen(false)
    setPaletteOpen((open) => !open)
  }, { allowInInput: true })
  useHotkey('escape', () => setNavOpen(false))

  return (
    <div className="flex min-h-dvh">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} footer={<ApiStatus />} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenNav={() => setNavOpen(true)} onOpenPalette={openPalette} />
        <main id="main" className="mx-auto w-full max-w-[100rem] flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<LoadingScreen />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {paletteOpen ? <CommandPalette onClose={() => setPaletteOpen(false)} /> : null}
    </div>
  )
}
