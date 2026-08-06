import { useEffect, useMemo, useRef, useState } from 'react'
import { useMediaQuery } from 'react-responsive'

export function useHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [uptimeBars, setUptimeBars] = useState<{ ok: boolean; height: number; id: number }[]>([])
  const [uptimePercentage, setUptimePercentage] = useState<string | null>(null)

  const isMobile = useMediaQuery({ maxWidth: 500 })
  const isLargeMobile = useMediaQuery({ minWidth: 501, maxWidth: 639 })
  const isSmallTablet = useMediaQuery({ minWidth: 640, maxWidth: 767 })
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 })

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const getBarsLength = useMemo(() => {
    if (isMobile) return 30
    if (isLargeMobile) return 40
    if (isSmallTablet) return 60
    return 90
  }, [isLargeMobile, isMobile, isSmallTablet])

  const fullBars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => {
        const ok = Math.random() > 0.08
        return {
          id: i,
          ok,
          height: ok ? 100 : Math.floor(Math.random() * 40 + 10),
        }
      }),
    [],
  )

  useEffect(() => {
    const bars = fullBars.slice(0, getBarsLength)
    setUptimeBars(bars)
    const upDays = bars.filter(bar => bar.ok).length
    setUptimePercentage(((upDays / bars.length) * 100).toFixed(2))
  }, [fullBars, getBarsLength])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let t = 0
    let points: number[] = []
    let dpr = window.devicePixelRatio || 1
    let cssWidth = 0
    let cssHeight = 0
    let needsResize = true

    const ro = new ResizeObserver(() => {
      needsResize = true
    })
    ro.observe(canvas)

    function applyResize() {
      if (!canvas || !ctx) return
      const rect = canvas.getBoundingClientRect()
      const newWidth = Math.round(rect.width)
      const newHeight = Math.round(rect.height)

      cssWidth = newWidth
      cssHeight = newHeight
      dpr = window.devicePixelRatio || 1

      canvas.width = Math.round(cssWidth * dpr)
      canvas.height = Math.round(cssHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const newMaxPoints = cssWidth
      if (points.length > newMaxPoints) {
        points = points.slice(points.length - newMaxPoints)
      }
    }

    function drawWave() {
      if (!canvas || !ctx) return
      if (needsResize) {
        applyResize()
        needsResize = false
      }

      if (cssWidth === 0) {
        requestAnimationFrame(drawWave)
        return
      }

      const maxPoints = cssWidth

      ctx.clearRect(0, 0, cssWidth, cssHeight)

      const y = Math.sin(t * 0.04) * 18 + Math.sin(t * 0.07) * 10 + cssHeight / 2
      points.push(y)
      if (points.length > maxPoints) points.shift()

      ctx.beginPath()
      ctx.moveTo(0, cssHeight)
      for (let i = 0; i < points.length; i++) ctx.lineTo(i, points[i]!)

      ctx.lineTo(points.length, cssHeight)
      ctx.closePath()

      const grad = ctx.createLinearGradient(0, 0, 0, cssHeight)
      grad.addColorStop(0, 'rgba(0,230,118,0.18)')
      grad.addColorStop(1, 'rgba(0,230,118,0)')
      ctx.fillStyle = grad
      ctx.fill()

      ctx.beginPath()
      for (let i = 0; i < points.length; i++) {
        const y = points[i]
        if (y !== undefined) {
          const x = (i / (maxPoints - 1)) * cssWidth
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
      }
      ctx.strokeStyle = 'rgba(0,230,118,0.7)'
      ctx.lineWidth = 2
      ctx.stroke()

      const last = points.length - 1
      if (last >= 0) {
        const ly = points[last]
        if (ly !== undefined) {
          const lx = (last / (maxPoints - 1)) * cssWidth
          ctx.beginPath()
          ctx.arc(lx, ly, 4, 0, Math.PI * 2)
          ctx.fillStyle = '#00e676'
          ctx.fill()
        }
      }

      t++
      requestAnimationFrame(drawWave)
    }

    const raf = requestAnimationFrame(drawWave)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  const shouldShowDots = useMediaQuery({ minWidth: 768 }) && mounted
  const dotsCoords = PULSE_DOTS.map(dot => {
    if (!shouldShowDots) return undefined
    const coords = isTablet ? 'md' : 'lg'

    return {
      left: `${dot[coords].x}%`,
      top: `${dot[coords].y}%`,
      delay: `${dot.delay}s`,
    }
  })

  return { canvasRef, uptimeBars, uptimePercentage, dotsCoords, shouldShowDots }
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
