import apiClient from '../lib/apiClient'

/** Unwraps the backend's `{ success, data }` envelope. */
const unwrap = (response) => response.data?.data ?? response.data

/**
 * Returns the caller's personal workspace, creating it on first visit.
 * Deduplicated per session because several pages need it on mount.
 */
let cachedWorkspace = null

export async function getWorkspace({ force = false } = {}) {
  if (force) cachedWorkspace = null
  if (!cachedWorkspace) {
    cachedWorkspace = apiClient
      .get('/dashboards/default')
      .then((response) => response.data)
      .catch((error) => {
        cachedWorkspace = null
        throw error
      })
  }
  return cachedWorkspace
}

/** Called on sign-out so the next user does not inherit this workspace. */
export function clearWorkspaceCache() {
  cachedWorkspace = null
}

export async function listWorkspaces() {
  const response = await apiClient.get('/dashboards/')
  return Array.isArray(response.data) ? response.data : unwrap(response) ?? []
}

export async function checkApiHealth() {
  const response = await apiClient.get('/health', { timeout: 6000 })
  return response.data
}
