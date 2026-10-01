import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getWorkspace } from '../api/workspaces'
import { useAuth } from './AuthProvider'

const WorkspaceContext = createContext(null)

/**
 * Every dataset belongs to a dashboard ("workspace") row on the backend, and
 * the upload endpoint requires its id. Fetching it once here keeps pages from
 * racing each other for `/dashboards/default`.
 *
 * The loaded workspace is tagged with the uid it was fetched for, so a sign-out
 * or a user switch can never expose the previous account's workspace while the
 * new one is still loading.
 */
export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const [state, setState] = useState({ uid: null, workspace: null, error: null })
  const [loadingUid, setLoadingUid] = useState(null)

  const load = useCallback(
    async ({ force = false } = {}) => {
      const owner = uid
      if (!owner) return null
      setLoadingUid(owner)
      try {
        const result = await getWorkspace({ force })
        setState({ uid: owner, workspace: result, error: null })
        return result
      } catch (caught) {
        setState({ uid: owner, workspace: null, error: caught })
        return null
      } finally {
        setLoadingUid((current) => (current === owner ? null : current))
      }
    },
    [uid],
  )

  useEffect(() => {
    if (!uid) return
    void load()
  }, [uid, load])

  const value = useMemo(() => {
    const mine = uid && state.uid === uid
    const workspace = mine ? state.workspace : null
    return {
      workspace,
      workspaceId: workspace?.id ?? (user ? 1 : null),
      loading: Boolean(uid) && (loadingUid === uid || !mine),
      error: mine ? state.error : null,
      reload: () => load({ force: true }),
    }
  }, [uid, state, loadingUid, load])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used inside <WorkspaceProvider>')
  return context
}
