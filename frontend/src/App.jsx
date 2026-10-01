import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import { LoadingScreen } from './components/ui/Skeleton'

// Split at the route boundary: the login screen ships in the entry chunk, and
// the charting stack only downloads once a signed-in route needs it.
const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const DatasetsPage = lazy(() => import('./pages/DatasetsPage'))
const DatasetWorkspacePage = lazy(() => import('./pages/DatasetWorkspacePage'))
const UploadPage = lazy(() => import('./pages/UploadPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

/** Old `/datasets/:id/analytics` links now open the studio's charts tab. */
function LegacyAnalyticsRedirect() {
  const { datasetId } = useParams()
  return <Navigate to={`/datasets/${datasetId}?tab=charts`} replace />
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading DataPulse…" />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="datasets" element={<DatasetsPage />} />
          <Route path="datasets/:datasetId" element={<DatasetWorkspacePage />} />
          <Route path="datasets/:datasetId/analytics" element={<LegacyAnalyticsRedirect />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
