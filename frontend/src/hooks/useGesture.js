import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook to detect swipe gestures (touch & pointer).
 * Great for mobile touchscreens, tablets, and mouse drag.
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 45,
} = {}) {
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 })
  const [swiping, setSwiping] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 })

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches ? e.touches[0] : e
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
    setSwiping(true)
    setSwipeOffset({ x: 0, y: 0 })
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!touchStartRef.current.time) return
    const touch = e.touches ? e.touches[0] : e
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y
    setSwipeOffset({ x: dx, y: dy })
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current.time) return
    const { x: dx, y: dy } = swipeOffset
    const dt = Date.now() - touchStartRef.current.time

    // Only count as swipe if under 600ms and exceeds threshold
    if (dt < 600) {
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      if (absX > absY && absX > threshold) {
        if (dx < 0 && onSwipeLeft) onSwipeLeft()
        else if (dx > 0 && onSwipeRight) onSwipeRight()
      } else if (absY > absX && absY > threshold) {
        if (dy < 0 && onSwipeUp) onSwipeUp()
        else if (dy > 0 && onSwipeDown) onSwipeDown()
      }
    }

    touchStartRef.current = { x: 0, y: 0, time: 0 }
    setSwiping(false)
    setSwipeOffset({ x: 0, y: 0 })
  }, [swipeOffset, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onPointerDown: handleTouchStart,
      onPointerMove: handleTouchMove,
      onPointerUp: handleTouchEnd,
    },
    swiping,
    swipeOffset,
  }
}

/**
 * 3D Holographic Card Tilt Hook.
 * Attaches pointer tracking for 3D perspective rotation, scale bounce, and luminous glass reflection.
 */
export function use3DTilt({
  maxTilt = 8,
  scale = 1.015,
  perspective = 1000,
  speed = 400,
} = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let animationFrameId = null

    const handlePointerMove = (event) => {
      const rect = element.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateX = ((y - centerY) / centerY) * -maxTilt
      const rotateY = ((x - centerX) / centerX) * maxTilt

      // Normalize pointer coordinates 0..1 for specular shine
      const normX = Math.round((x / rect.width) * 100)
      const normY = Math.round((y / rect.height) * 100)

      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(() => {
        element.style.transform = `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
        element.style.setProperty('--glow-x', `${normX}%`)
        element.style.setProperty('--glow-y', `${normY}%`)
        element.style.setProperty('--glow-opacity', '1')
      })
    }

    const handlePointerLeave = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      element.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
      element.style.setProperty('--glow-opacity', '0')
    }

    element.style.transition = `transform ${speed}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerleave', handlePointerLeave)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [maxTilt, scale, perspective, speed])

  return ref
}
