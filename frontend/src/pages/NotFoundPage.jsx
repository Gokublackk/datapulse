import { Link, useLocation } from 'react-router-dom'
import { CloudUpload, Compass, Database, House } from 'lucide-react'
import { Button } from '../components/ui/Button'

/** Terminal route for anything the router does not recognise. */
export default function NotFoundPage() {
  const location = useLocation()

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-16 text-center">
      <span className="dp-tile size-14" aria-hidden="true">
        <Compass size={26} />
      </span>

      <p className="dp-eyebrow mt-6">Error 404</p>
      <h1 className="text-balance-tight mt-2 text-2xl font-bold tracking-tight text-ink">
        There is nothing at this address
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        <code className="dp-num rounded-md bg-subtle px-1.5 py-0.5 text-xs text-ink">{location.pathname}</code>{' '}
        does not match any page. The dataset may have been removed, or the link may be incomplete.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Button as={Link} to="/" variant="primary" icon={House}>
          Back to overview
        </Button>
        <Button as={Link} to="/datasets" variant="soft" icon={Database}>
          Your datasets
        </Button>
        <Button as={Link} to="/upload" variant="ghost" icon={CloudUpload}>
          Upload
        </Button>
      </div>
    </div>
  )
}
