import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { CornerDownLeft, Database, Moon, Search, Sun } from 'lucide-react'
import { NAV_ITEMS } from './Sidebar'
import { useTheme } from '../../context/ThemeProvider'
import { listMyDatasets } from '../../api/datasets'
import { readCache, writeCache } from '../../hooks/useAsyncData'
import { formatCompact } from '../../lib/format'
import { Kbd } from '../ui/Badge'

/** Naive subsequence match — good enough to feel fuzzy without a dependency. */
function matches(haystack, needle) {
  if (!needle) return true
  const text = haystack.toLowerCase()
  let cursor = 0
  for (const char of needle.toLowerCase()) {
    cursor = text.indexOf(char, cursor)
    if (cursor === -1) return false
    cursor += 1
  }
  return true
}

/**
 * ⌘/Ctrl+K launcher: jumps between pages, opens any dataset by name, and
 * toggles the theme. Mounted only while open, so its query resets every time.
 * The dataset list paints from the same cache the pages fill, then refreshes.
 */
export default function CommandPalette({ onClose }) {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [datasets, setDatasets] = useState(() => readCache('datasets:my') ?? [])
  const listRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    listMyDatasets({ signal: controller.signal })
      .then((list) => {
        writeCache('datasets:my', list)
        setDatasets(list)
      })
      .catch(() => {
        // A failed lookup just means no dataset commands this time.
      })
    return () => controller.abort()
  }, [])

  const commands = useMemo(() => {
    const items = NAV_ITEMS.map((item) => ({
      id: `nav:${item.to}`,
      group: 'Navigate',
      label: item.label,
      hint: item.hint,
      icon: item.icon,
      run: () => navigate(item.to),
    }))

    items.push({
      id: 'theme',
      group: 'Preferences',
      label: isDark ? 'Switch to light theme' : 'Switch to dark theme',
      hint: 'Applies immediately and is remembered',
      icon: isDark ? Sun : Moon,
      run: toggleTheme,
    })

    datasets.forEach((dataset) => {
      items.push({
        id: `dataset:${dataset.id}`,
        group: 'Datasets',
        label: dataset.filename,
        hint: `${formatCompact(dataset.rows)} rows · ${dataset.columns} columns`,
        icon: Database,
        run: () => navigate(`/datasets/${dataset.id}`),
      })
    })

    return items
  }, [datasets, isDark, navigate, toggleTheme])

  const filtered = useMemo(
    () => commands.filter((item) => matches(`${item.label} ${item.group}`, query.trim())).slice(0, 40),
    [commands, query],
  )

  const runCommand = useCallback(
    (item) => {
      if (!item) return
      onClose()
      item.run()
    },
    [onClose],
  )

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => (filtered.length ? (index + 1) % filtered.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => (filtered.length ? (index - 1 + filtered.length) % filtered.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      runCommand(filtered[active])
    }
  }

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, filtered])

  let lastGroup = null

  return createPortal(
    <div
      className="fixed inset-0 z-[75] flex items-start justify-center bg-black/55 p-4 pt-[10vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="dp-card w-full max-w-xl animate-pop overflow-hidden"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search size={17} className="shrink-0 text-faint" aria-hidden="true" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            placeholder="Search datasets or type a command…"
            aria-label="Search commands"
            className="w-full border-0 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          <Kbd>esc</Kbd>
        </div>

        <div ref={listRef} className="dp-scroll max-h-80 p-1.5" role="listbox" aria-label="Results">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-faint">No matches for “{query}”.</p>
          ) : (
            filtered.map((item, index) => {
              const showGroup = item.group !== lastGroup
              lastGroup = item.group
              const isActive = index === active
              return (
                <div key={item.id}>
                  {showGroup ? <p className="dp-label px-2.5 pb-1 pt-2.5">{item.group}</p> : null}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-active={isActive}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => runCommand(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${isActive ? 'bg-brand/12 text-ink' : 'text-muted hover:bg-subtle'}`}
                  >
                    <item.icon size={16} className="shrink-0 text-brand" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{item.label}</span>
                      {item.hint ? <span className="block truncate text-xs text-faint">{item.hint}</span> : null}
                    </span>
                    {isActive ? <CornerDownLeft size={13} className="shrink-0 text-faint" aria-hidden="true" /> : null}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
