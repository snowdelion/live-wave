import { useEffect, useRef } from 'react'

export function useWaveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
      if (points.length > newMaxPoints) points = points.slice(points.length - newMaxPoints)
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

  return { canvasRef }
}
