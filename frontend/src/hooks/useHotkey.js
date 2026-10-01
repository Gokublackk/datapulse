import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

/**
 * Binds a document-level keyboard shortcut.
 *
 * @param {string} combo e.g. "mod+k", "escape", "shift+/"
 * @param {(event: KeyboardEvent) => void} handler
 * @param {{ enabled?: boolean, allowInInput?: boolean }} options
 */
export function useHotkey(combo, handler, { enabled = true, allowInInput = false } = {}) {
  // Kept in a ref so a new inline handler on every render does not re-bind the
  // listener. Assigned in an effect, never during render.
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!enabled) return undefined

    const parts = combo.toLowerCase().split('+')
    const key = parts.at(-1)
    const needsMod = parts.includes('mod')
    const needsShift = parts.includes('shift')
    const needsAlt = parts.includes('alt')

    const onKeyDown = (event) => {
      if (!allowInInput) {
        const target = event.target
        const tag = target?.tagName?.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
          return
        }
      }
      const mod = event.metaKey || event.ctrlKey
      if (needsMod !== mod) return
      if (needsShift !== event.shiftKey) return
      if (needsAlt !== event.altKey) return
      if (event.key.toLowerCase() !== key) return
      event.preventDefault()
      handlerRef.current(event)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [combo, enabled, allowInInput])
}

/** Tracks a CSS media query, e.g. useMediaQuery('(min-width: 1024px)'). */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onStoreChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onStoreChange)
      return () => list.removeEventListener('change', onStoreChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  // useSyncExternalStore keeps the boolean in step with the browser without an
  // effect that writes state on mount.
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
