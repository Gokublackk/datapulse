import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'datapulse:theme'
const ThemeContext = createContext(null)

function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage blocked — fall through to the system preference */
  }
  return null
}

function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/**
 * Owns the light/dark token switch.
 *
 * The initial value has to agree with the pre-paint script in index.html,
 * which reads the same localStorage key — otherwise the first frame flashes
 * the wrong palette.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => readStoredTheme() ?? systemTheme())
  const [explicit, setExplicit] = useState(() => readStoredTheme() !== null)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.dataset.theme = theme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#07080f' : '#f6f7fb')
  }, [theme])

  useEffect(() => {
    if (!explicit) return undefined
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
    return undefined
  }, [theme, explicit])

  // Follow the OS until the user makes a choice.
  useEffect(() => {
    if (explicit || !window.matchMedia) return undefined
    const list = window.matchMedia('(prefers-color-scheme: light)')
    const update = (event) => setTheme(event.matches ? 'light' : 'dark')
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [explicit])

  const applyTheme = useCallback((next) => {
    setExplicit(true)
    setTheme(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setExplicit(true)
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', setTheme: applyTheme, toggleTheme }),
    [theme, applyTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')
  return context
}
