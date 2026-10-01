import { Component } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'

/**
 * Catches render-time crashes so one bad chart cannot blank the whole app.
 * Wrapped around the router and again around each chart card.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[DataPulse] render error:', error, info?.componentStack)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    const { children, fallback, compact = false, title = 'This view failed to render' } = this.props

    if (!error) return children
    if (typeof fallback === 'function') return fallback(error, this.reset)
    if (fallback) return fallback

    if (compact) {
      return (
        <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 p-5 text-center" role="alert">
          <TriangleAlert size={18} className="text-danger" aria-hidden="true" />
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="max-w-xs text-xs text-muted">{error.message}</p>
          <button type="button" onClick={this.reset} className="dp-btn dp-btn-sm dp-btn-soft mt-1">
            <RefreshCw size={13} aria-hidden="true" />
            Retry
          </button>
        </div>
      )
    }

    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="dp-card w-full max-w-lg p-7 text-center" role="alert">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-danger/15 text-danger" aria-hidden="true">
            <TriangleAlert size={22} />
          </span>
          <h1 className="mt-4 text-lg font-bold text-ink">{title}</h1>
          <p className="mt-2 text-sm text-muted">{error.message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={this.reset} className="dp-btn dp-btn-primary">
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
            <button type="button" onClick={() => window.location.assign('/')} className="dp-btn dp-btn-soft">
              Back to overview
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
