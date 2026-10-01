import { useState } from 'react'
import { LogOut, Menu, Moon, Search, Sun } from 'lucide-react'
import { useAuth } from '../../context/AuthProvider'
import { useTheme } from '../../context/ThemeProvider'
import { initialsOf } from '../../lib/format'
import { Kbd } from '../ui/Badge'

/** Sticky app bar: menu trigger, command-palette entry, theme switch, account. */
export default function Topbar({ onOpenNav, onOpenPalette }) {
  const { user, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName = user?.displayName || user?.email || 'Signed in'

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenNav}
          className="dp-btn dp-btn-icon dp-btn-ghost size-9 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onOpenPalette}
          className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-line bg-subtle px-3 py-2 text-left text-sm text-faint transition-colors hover:border-line-strong sm:max-w-sm"
        >
          <Search size={15} className="shrink-0" aria-hidden="true" />
          <span className="truncate">Search datasets, jump to a page…</span>
          <span className="ml-auto hidden shrink-0 items-center gap-1 sm:flex">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="dp-btn dp-btn-icon dp-btn-ghost size-9"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Light theme' : 'Dark theme'}
          >
            {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-subtle"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="size-8 rounded-lg border border-line object-cover"
                />
              ) : (
                <span
                  className="grid size-8 place-items-center rounded-lg text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--dp-chart-1), var(--dp-chart-7))' }}
                  aria-hidden="true"
                >
                  {initialsOf(displayName)}
                </span>
              )}
              <span className="hidden max-w-32 truncate text-sm font-semibold text-ink sm:block">
                {user?.displayName || user?.email?.split('@')[0] || 'Account'}
              </span>
            </button>

            {menuOpen ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <div
                  role="menu"
                  className="dp-card absolute right-0 z-50 mt-2 w-60 animate-pop overflow-hidden p-1.5"
                >
                  <div className="px-2.5 py-2">
                    <p className="truncate text-sm font-bold text-ink">{user?.displayName || 'Signed in'}</p>
                    <p className="truncate text-xs text-faint">{user?.email}</p>
                  </div>
                  <hr className="dp-divider my-1" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      void signOut()
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
                  >
                    <LogOut size={15} aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
