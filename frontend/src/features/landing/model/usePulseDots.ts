import { useEffect, useMemo, useState } from 'react'
import { useMediaQuery } from 'react-responsive'

export function usePulseDots() {
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 })
  const isDesktop = useMediaQuery({ minWidth: 1024 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const shouldShowDots = mounted && (isTablet || isDesktop)

  const dotsCoords = useMemo(() => {
    if (!shouldShowDots) return []
    const coords = isTablet ? 'md' : 'lg'

    return PULSE_DOTS.map(dot => ({
      left: `${dot[coords].x}%`,
      top: `${dot[coords].y}%`,
      delay: `${dot.delay}s`,
    }))
  }, [shouldShowDots, isTablet])

  return { dotsCoords, shouldShowDots }
}

const PULSE_DOTS = [
  { lg: { x: 18, y: 32 }, md: { x: 49, y: 22 }, delay: 0 },
  { lg: { x: 42, y: 15 }, md: { x: 64, y: 5 }, delay: 0.4 },
  { lg: { x: 83, y: 22 }, md: { x: 90, y: 8 }, delay: 1.2 },
  { lg: { x: 31, y: 62 }, md: { x: 55, y: 52 }, delay: 0.6 },
  { lg: { x: 67, y: 48 }, md: { x: 80, y: 38 }, delay: 0.8 },
  { lg: { x: 56, y: 71 }, md: { x: 72, y: 61 }, delay: 1.0 },
  { lg: { x: 76, y: 67 }, md: { x: 91, y: 57 }, delay: 0.2 },
]
