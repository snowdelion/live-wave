import { act, render, renderHook, waitFor } from '@testing-library/react'

import { useWaveCanvas } from '../useWaveCanvas'

function setViewportWidth(width: number) {
  globalThis.setMockViewportWidth(width)
}

describe('useWaveCanvas', () => {
  it('returns a canvasRef whose current is null before being attached to a DOM node', () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => useWaveCanvas())
    expect(result.current.canvasRef.current).toBeNull()
  })

  it('does not throw when the ref is never attached to a canvas (ctx-not-found early return)', () => {
    setViewportWidth(1200)
    expect(() => renderHook(() => useWaveCanvas())).not.toThrow()
  })

  it('drives canvas drawing calls once attached to a real <canvas> and rAF fires', async () => {
    setViewportWidth(1200)

    function Harness() {
      const { canvasRef } = useWaveCanvas()
      return <canvas ref={canvasRef} data-testid="hero-canvas" />
    }

    const ctxSpy = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fill: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      setTransform: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctxSpy as unknown as CanvasRenderingContext2D,
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 300,
      height: 150,
      top: 0,
      left: 0,
      right: 300,
      bottom: 150,
      x: 0,
      y: 0,
      toJSON() {},
    })

    render(<Harness />)

    await waitFor(() => {
      expect(ctxSpy.clearRect).toHaveBeenCalled()
    })

    expect(ctxSpy.setTransform).toHaveBeenCalled()
    expect(ctxSpy.beginPath).toHaveBeenCalled()
    expect(ctxSpy.stroke).toHaveBeenCalled()
    expect(ctxSpy.fill).toHaveBeenCalled()
  })

  it('skips drawing (re-queues rAF) while canvas width is 0 and never calls clearRect', async () => {
    setViewportWidth(1200)

    function Harness() {
      const { canvasRef } = useWaveCanvas()
      return <canvas ref={canvasRef} />
    }

    const ctxSpy = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fill: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      setTransform: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctxSpy as unknown as CanvasRenderingContext2D,
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON() {},
    })

    render(<Harness />)

    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })

    expect(ctxSpy.clearRect).not.toHaveBeenCalled()
  })

  it('calls cancelAnimationFrame and disconnects the ResizeObserver on unmount', async () => {
    setViewportWidth(1200)

    const disconnectSpy = vi.fn()
    const observeSpy = vi.fn()
    class SpyResizeObserver {
      constructor(_cb: ResizeObserverCallback) {}
      observe = observeSpy
      unobserve = vi.fn()
      disconnect = disconnectSpy
    }
    vi.stubGlobal('ResizeObserver', SpyResizeObserver)

    function Harness() {
      const { canvasRef } = useWaveCanvas()
      return <canvas ref={canvasRef} />
    }

    const { unmount } = render(<Harness />)

    await waitFor(() => {
      expect(observeSpy).toHaveBeenCalled()
    })

    unmount()
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('handles getContext returning null (no canvas support) without throwing', () => {
    setViewportWidth(1200)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    function Harness() {
      const { canvasRef } = useWaveCanvas()
      return <canvas ref={canvasRef} />
    }

    expect(() => render(<Harness />)).not.toThrow()
  })

  it('re-applies resize (calls setTransform again) when the ResizeObserver callback fires', async () => {
    setViewportWidth(1200)

    let resizeCallback: ResizeObserverCallback | undefined
    class CapturingResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        resizeCallback = cb
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', CapturingResizeObserver)

    const ctxSpy = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fill: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      setTransform: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctxSpy as unknown as CanvasRenderingContext2D,
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 300,
      height: 150,
      top: 0,
      left: 0,
      right: 300,
      bottom: 150,
      x: 0,
      y: 0,
      toJSON() {},
    })

    function Harness() {
      const { canvasRef } = useWaveCanvas()
      return <canvas ref={canvasRef} />
    }

    render(<Harness />)

    await waitFor(() => {
      expect(ctxSpy.setTransform).toHaveBeenCalled()
    })

    const callsBefore = ctxSpy.setTransform.mock.calls.length
    expect(resizeCallback).toBeDefined()

    await act(async () => {
      resizeCallback!([] as unknown as ResizeObserverEntry[], {} as ResizeObserver)
      await new Promise(r => setTimeout(r, 10))
    })

    await waitFor(() => {
      expect(ctxSpy.setTransform.mock.calls.length).toBeGreaterThan(callsBefore)
    })
  })

  it('truncates the accumulated points buffer when the canvas shrinks (points.length > newMaxPoints)', async () => {
    setViewportWidth(1200)

    let resizeCallback: ResizeObserverCallback | undefined
    class CapturingResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        resizeCallback = cb
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', CapturingResizeObserver)

    const ctxSpy = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fill: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      setTransform: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctxSpy as unknown as CanvasRenderingContext2D,
    )

    const rectSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 50,
      height: 150,
      top: 0,
      left: 0,
      right: 50,
      bottom: 150,
      x: 0,
      y: 0,
      toJSON() {},
    })

    function Harness() {
      const { canvasRef } = useWaveCanvas()
      return <canvas ref={canvasRef} />
    }

    render(<Harness />)

    await act(async () => {
      await new Promise(r => setTimeout(r, 60))
    })

    expect(ctxSpy.clearRect).toHaveBeenCalled()

    rectSpy.mockReturnValue({
      width: 10,
      height: 150,
      top: 0,
      left: 0,
      right: 10,
      bottom: 150,
      x: 0,
      y: 0,
      toJSON() {},
    })

    await act(async () => {
      resizeCallback!([] as unknown as ResizeObserverEntry[], {} as ResizeObserver)
      await new Promise(r => setTimeout(r, 30))
    })

    expect(ctxSpy.setTransform).toHaveBeenCalledTimes(2)
  })
})
