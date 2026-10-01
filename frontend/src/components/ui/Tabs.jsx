import { useRef } from 'react'

/**
 * Horizontal tab strip following the ARIA tabs pattern, with arrow-key
 * navigation. `tabs` is `[{ id, label, icon?, badge? }]`.
 */
export function Tabs({ tabs, value, onChange, className = '', idPrefix = 'tab' }) {
  const stripRef = useRef(null)

  const onKeyDown = (event) => {
    const index = tabs.findIndex((tab) => tab.id === value)
    if (index < 0) return
    let next = null
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    if (next === null) return
    event.preventDefault()
    const target = tabs[next]
    onChange(target.id)
    stripRef.current?.querySelector(`#${idPrefix}-${target.id}`)?.focus()
  }

  return (
    <div
      ref={stripRef}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={`dp-scroll no-scrollbar -mb-px flex gap-5 border-b border-line ${className}`}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            id={`${idPrefix}-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className="dp-tab flex shrink-0 items-center gap-2"
          >
            {Icon ? <Icon size={15} aria-hidden="true" /> : null}
            {tab.label}
            {tab.badge != null ? (
              <span className="dp-num rounded-full bg-subtle px-1.5 py-0.5 text-[0.6875rem] text-muted">
                {tab.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/** Panel body paired with <Tabs>; only the selected one is rendered. */
export function TabPanel({ id, value, idPrefix = 'tab', className = '', children }) {
  if (id !== value) return null
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-${id}`}
      tabIndex={0}
      className={`animate-fade outline-none ${className}`}
    >
      {children}
    </div>
  )
}
