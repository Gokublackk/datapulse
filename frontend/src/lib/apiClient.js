import axios from 'axios'
import { auth, waitForAuthReady } from './firebase'

/** Emitted when the API rejects our credentials so AuthProvider can sign out. */
export const UNAUTHORIZED_EVENT = 'datapulse:unauthorized'

function resolveBaseUrl() {
  const explicit = import.meta.env.VITE_API_BASE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')
  // In dev, `/api` is proxied to the backend by Vite (see vite.config.js),
  // which avoids CORS entirely. A built bundle talks to the API directly.
  return import.meta.env.DEV ? '/api' : 'http://127.0.0.1:8000'
}

export const API_BASE_URL = resolveBaseUrl()

/** Normalised error shape every caller can rely on. */
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'unknown', details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45_000,
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.request.use(async (config) => {
  await waitForAuthReady()
  const user = auth.currentUser
  if (user) {
    // No force-refresh: the SDK refreshes the token automatically when it is
    // close to expiring, so this stays a local read on the hot path.
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  } else {
    const demoUser = localStorage.getItem('datapulse_demo_user')
    if (demoUser) {
      config.headers.Authorization = 'Bearer demo-token-explorer'
    }
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  } else if (config.data !== undefined) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

function readDetail(payload) {
  if (!payload) return null
  if (typeof payload === 'string') return payload
  const { detail, message, error } = payload
  if (typeof detail === 'string') return detail
  // FastAPI validation errors arrive as a list of {loc, msg, type}.
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg).filter(Boolean).join('; ') || null
  }
  if (typeof message === 'string') return message
  if (typeof error === 'string') return error
  return null
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel?.(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(new ApiError('Request cancelled', { code: 'cancelled' }))
    }

    const status = error.response?.status ?? 0
    const detail = readDetail(error.response?.data)

    if (status === 401 || status === 403) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { status } }))
    }

    const isLocalhostFallback = !import.meta.env.DEV && (API_BASE_URL.includes('127.0.0.1') || API_BASE_URL.includes('localhost'))
    const message =
      detail ||
      (status === 0
        ? (isLocalhostFallback
            ? `Cannot reach backend at ${API_BASE_URL}. In Vercel, please set VITE_API_BASE_URL to your Render backend URL (e.g. https://your-backend.onrender.com) in Project Settings > Environment Variables and redeploy.`
            : `Cannot reach the DataPulse API at ${API_BASE_URL}. Is the Render backend awake and running?`)
        : status === 401
          ? 'Your session expired. Please sign in again.'
          : status === 403
            ? 'You do not have access to this resource.'
            : status === 404
              ? 'That resource no longer exists.'
              : status === 413
                ? 'That file is too large to upload.'
                : status >= 500
                  ? 'The server ran into a problem handling that request.'
                  : error.message || 'Something went wrong.')

    return Promise.reject(
      new ApiError(message, {
        status,
        code: status === 0 ? 'network' : `http_${status}`,
        details: error.response?.data ?? null,
      }),
    )
  },
)

export default apiClient
