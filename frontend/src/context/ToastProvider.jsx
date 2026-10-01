import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { CircleAlert, CircleCheckBig, Info, TriangleAlert, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CircleCheckBig,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
}

const ACCENTS = {
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warn',
  info: 'text-brand',
}

let sequence = 0

/** Global, screen-reader-announced notifications. */
export function ToastProvider({ children, max = 4 }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message, { variant = 'info', title = '', duration = 5200 } = {}) => {
      if (!message && !title) return null
      sequence += 1
      const id = `toast-${sequence}`
      setToasts((current) => [...current.slice(-(max - 1)), { id, message, variant, title }])
      if (duration > 0) {
        timersRef.current.set(
          id,
          window.setTimeout(() => dismiss(id), duration),
        )
      }
      return id
    },
    [dismiss, max],
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const value = useMemo(
    () => ({
      toast: push,
      dismiss,
      success: (message, options) => push(message, { ...options, variant: 'success' }),
      error: (message, options) => push(message, { ...options, variant: 'error' }),
      warning: (message, options) => push(message, { ...options, variant: 'warning' }),
      info: (message, options) => push(message, { ...options, variant: 'info' }),
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant] ?? Info
          return (
            <div
              key={toast.id}
              role={toast.variant === 'error' ? 'alert' : 'status'}
              aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
              className="dp-card pointer-events-auto flex w-full max-w-sm animate-pop items-start gap-3 p-3.5 shadow-xl"
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${ACCENTS[toast.variant] ?? ''}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                {toast.title ? <p className="text-sm font-semibold text-ink">{toast.title}</p> : null}
                {toast.message ? (
                  <p className={`text-sm ${toast.title ? 'text-muted' : 'text-ink'}`}>{toast.message}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="dp-btn dp-btn-icon dp-btn-ghost -mr-1 -mt-1 size-7"
                aria-label="Dismiss notification"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
