import { LoaderCircle } from 'lucide-react'

/** Single shimmering block. Give it a width/height via className. */
export function Skeleton({ className = 'h-4 w-full' }) {
  return <span className={`dp-skeleton block ${className}`} aria-hidden="true" />
}

/** Stack of skeleton lines, last one short so it reads like a paragraph. */
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={`h-3 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = 'h-64' }) {
  return (
    <div className={`dp-card animate-fade p-5 ${className}`} aria-hidden="true">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-6 w-40" />
      <Skeleton className="mt-6 h-[calc(100%-5.5rem)] w-full rounded-xl" />
    </div>
  )
}

/** Grid of placeholder cards used while a page's first payload lands. */
export function SkeletonGrid({ count = 4, className = '', itemClassName = 'h-32' }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} className={itemClassName} />
      ))}
    </div>
  )
}

export function Spinner({ size = 18, className = '', label = 'Loading' }) {
  return (
    <LoaderCircle size={size} className={`animate-spin text-brand ${className}`} role="status" aria-label={label} />
  )
}

/** Full-height centred spinner for route-level Suspense fallbacks. */
export function LoadingScreen({ label = 'Loading DataPulse…' }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3" role="status">
      <Spinner size={26} label={label} />
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}
