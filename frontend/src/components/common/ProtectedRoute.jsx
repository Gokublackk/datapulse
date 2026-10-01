import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthProvider'
import { LoadingScreen } from '../ui/Skeleton'

/**
 * Gate for authenticated routes. Waits for Firebase to restore the persisted
 * session before deciding, otherwise a hard refresh bounces to /login, and
 * remembers where the user was headed so login can send them back.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initialising } = useAuth()
  const location = useLocation()

  if (initialising) return <LoadingScreen label="Restoring your session…" />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return children
}
