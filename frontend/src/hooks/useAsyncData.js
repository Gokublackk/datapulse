import { useCallback, useEffect, useRef, useState } from 'react'

/** Process-lifetime cache so revisiting a page paints instantly. */
const cache = new Map()

export function readCache(key) {
  return key ? cache.get(key) : undefined
}

export function writeCache(key, value) {
  if (key) cache.set(key, value)
}

export function invalidateCache(prefix) {
  if (!prefix) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}

/**
 * Runs `fetcher(signal)` when `deps` change, with abort on unmount, an
 * optional warm cache, and a `refetch()` that keeps the previous data visible.
 *
 * `fetcher` must be stable — wrap it in useCallback at the call site.
 */
export function useAsyncData(fetcher, { key, enabled = true, deps = [] } = {}) {
  const cached = key ? cache.get(key) : undefined
  const [data, setData] = useState(cached)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(cached === undefined)
  const [refreshing, setRefreshing] = useState(false)
  const controllerRef = useRef(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [])

  const run = useCallback(
    async ({ background = false } = {}) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      if (background) setRefreshing(true)
      else setPending(true)
      setError(null)

      try {
        const result = await fetcher(controller.signal)
        if (controller.signal.aborted || !mountedRef.current) return undefined
        if (key) cache.set(key, result)
        setData(result)
        return result
      } catch (caught) {
        if (controller.signal.aborted || caught?.code === 'cancelled') return undefined
        if (mountedRef.current) setError(caught)
        return undefined
      } finally {
        if (mountedRef.current && !controller.signal.aborted) {
          setPending(false)
          setRefreshing(false)
        }
      }
    },
    [fetcher, key],
  )

  useEffect(() => {
    if (!enabled) return
    void run({ background: cache.has(key) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, run, ...deps])

  const refetch = useCallback(() => run({ background: true }), [run])

  // A disabled hook never reports loading, so a lazily-mounted tab can render
  // its idle state instead of a skeleton.
  return { data, error, loading: enabled && pending, refreshing, refetch, setData }
}
