import { useSwipe, use3DTilt } from '../../hooks/useGesture'

/**
 * 3D Holographic Tilt Card with interactive pointer specular sheen.
 */
export function TiltCard({
  children,
  className = '',
  maxTilt = 7,
  scale = 1.012,
  ...props
}) {
  const tiltRef = use3DTilt({ maxTilt, scale })

  return (
    <div
      ref={tiltRef}
      className={`dp-tilt-card relative overflow-hidden transition-all duration-300 ${className}`}
      {...props}
    >
      {/* Specular lighting effect overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(255, 255, 255, 0.12), transparent 60%)',
          opacity: 'var(--glow-opacity, 0)',
        }}
      />
      {children}
    </div>
  )
}

/**
 * Gesture Swipe Area that detects horizontal swipes across tabs or carousels.
 */
export function SwipeContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = '',
}) {
  const { handlers, swiping, swipeOffset } = useSwipe({
    onSwipeLeft,
    onSwipeRight,
    threshold: 45,
  })

  return (
    <div
      {...handlers}
      className={`relative touch-pan-y select-none ${className}`}
      style={{
        transform: swiping ? `translateX(${Math.max(-20, Math.min(20, swipeOffset.x * 0.15))}px)` : undefined,
        transition: swiping ? 'none' : 'transform 0.25s ease-out',
      }}
    >
      {children}
    </div>
  )
}
