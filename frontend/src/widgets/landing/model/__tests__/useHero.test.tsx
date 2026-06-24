import { act, render, renderHook, waitFor } from '@testing-library/react'
import { useHero } from '../useHero'

function setViewportWidth(width: number) {
  globalThis.setMockViewportWidth(width)
}

beforeEach(() => {
  setViewportWidth(1024)

  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb: FrameRequestCallback) => {
      return setTimeout(() => cb(performance.now()), 0) as unknown as number
    }),
  )
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => clearTimeout(id)),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useHero - uptime bars', () => {
  it('produces 90 bars on desktop width (>= 1024)', async () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => useHero())

    await waitFor(() => {
      expect(result.current.uptimeBars).toHaveLength(90)
    })
  })

  it('produces 30 bars on mobile width (<= 500)', async () => {
    setViewportWidth(400)
    const { result } = renderHook(() => useHero())

    await waitFor(() => {
      expect(result.current.uptimeBars).toHaveLength(30)
    })
  })

  it('produces 40 bars on large-mobile width (501-639)', async () => {
    setViewportWidth(600)
    const { result } = renderHook(() => useHero())

    await waitFor(() => {
      expect(result.current.uptimeBars).toHaveLength(40)
    })
  })

  it('produces 60 bars on small-tablet width (640-767)', async () => {
    setViewportWidth(700)
    const { result } = renderHook(() => useHero())

    await waitFor(() => {
      expect(result.current.uptimeBars).toHaveLength(60)
    })
  })

  it('produces 90 bars on tablet width (768-1023, falls through to default)', async () => {
    setViewportWidth(900)
    const { result } = renderHook(() => useHero())

    await waitFor(() => {
      expect(result.current.uptimeBars).toHaveLength(90)
    })
  })

  it('computes uptimePercentage consistent with the bars returned', async () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => useHero())

    await waitFor(() => {
      expect(result.current.uptimePercentage).not.toBeNull()
    })

    const bars = result.current.uptimeBars
    const expectedPct = ((bars.filter(b => b.ok).length / bars.length) * 100).toFixed(2)
    expect(result.current.uptimePercentage).toBe(expectedPct)
  })

  it('assigns height 100 to ok bars and a value in [10, 50) to non-ok bars', async () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => useHero())

    await waitFor(() => {
      expect(result.current.uptimeBars.length).toBeGreaterThan(0)
    })

    for (const bar of result.current.uptimeBars) {
      if (bar.ok) {
        expect(bar.height).toBe(100)
      } else {
        expect(bar.height).toBeGreaterThanOrEqual(10)
        expect(bar.height).toBeLessThan(50)
      }
    }
  })

  it('assigns each bar a unique id matching its index', async () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => useHero())

    await waitFor(() => {
      expect(result.current.uptimeBars.length).toBe(90)
    })

    result.current.uptimeBars.forEach((bar, i) => {
      expect(bar.id).toBe(i)
    })
  })

  it('handles the all-bars-down edge case without producing NaN%', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
    setViewportWidth(1200)
    const { result } = renderHook(() => useHero())

    expect(result.current.uptimePercentage).toBe('0.00')
    randomSpy.mockRestore()
  })

  it('handles the all-bars-up edge case (100% uptime)', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1)
    setViewportWidth(1200)
    const { result } = renderHook(() => useHero())

    expect(result.current.uptimePercentage).toBe('100.00')
    randomSpy.mockRestore()
  })
})

describe('useHero - dots / mounted / tablet logic', () => {
  it('starts with shouldShowDots false synchronously before the mount effect flushes, even on desktop width', () => {
    setViewportWidth(1200)
    let firstRenderShouldShowDots: boolean | undefined
    function Probe() {
      const hero = useHero()
      if (firstRenderShouldShowDots === undefined) {
        firstRenderShouldShowDots = hero.shouldShowDots
      }
      return null
    }
    render(<Probe />)
    expect(firstRenderShouldShowDots).toBe(false)
  })

  it('shows dots on desktop width after mount (shouldShowDots = true)', async () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => useHero())

    await waitFor(() => {
      expect(result.current.shouldShowDots).toBe(true)
    })

    expect(result.current.dotsCoords).toHaveLength(7)
    result.current.dotsCoords.forEach(coord => {
      expect(coord).toBeDefined()
      expect(coord).toHaveProperty('left')
      expect(coord).toHaveProperty('top')
      expect(coord).toHaveProperty('delay')
    })
  })

  it('hides dots on mobile width (shouldShowDots = false) and all coords are undefined', async () => {
    setViewportWidth(400)
    const { result } = renderHook(() => useHero())

    await waitFor(() => {
      expect(result.current.uptimeBars.length).toBeGreaterThan(0)
    })

    expect(result.current.shouldShowDots).toBe(false)
    result.current.dotsCoords.forEach(coord => {
      expect(coord).toBeUndefined()
    })
  })

  it('uses "md" coordinates when in the tablet range (768-1023)', async () => {
    setViewportWidth(900)
    const { result } = renderHook(() => useHero())

    await waitFor(() => {
      expect(result.current.shouldShowDots).toBe(true)
    })

    expect(result.current.dotsCoords[0]?.left).toBe('49%')
  })

  it('uses "lg" coordinates when above tablet range (>= 1024)', async () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => useHero())

    await waitFor(() => {
      expect(result.current.shouldShowDots).toBe(true)
    })

    expect(result.current.dotsCoords[0]?.left).toBe('18%')
  })

  it('produces exactly 7 dot delay strings matching PULSE_DOTS source values', async () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => useHero())

    await waitFor(() => {
      expect(result.current.shouldShowDots).toBe(true)
    })

    const expectedDelays = ['0s', '0.4s', '1.2s', '0.6s', '0.8s', '1s', '0.2s']
    const actualDelays = result.current.dotsCoords.map(c => c?.delay)
    expect(actualDelays).toEqual(expectedDelays)
  })
})

describe('useHero - canvas wave animation effect', () => {
  it('returns a canvasRef whose current is null before being attached to a DOM node', () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => useHero())
    expect(result.current.canvasRef.current).toBeNull()
  })

  it('does not throw when the ref is never attached to a canvas (ctx-not-found early return)', () => {
    setViewportWidth(1200)
    expect(() => renderHook(() => useHero())).not.toThrow()
  })

  it('drives canvas drawing calls once attached to a real <canvas> and rAF fires', async () => {
    setViewportWidth(1200)

    function Harness() {
      const { canvasRef } = useHero()
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
      const { canvasRef } = useHero()
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
      const { canvasRef } = useHero()
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
      const { canvasRef } = useHero()
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
      const { canvasRef } = useHero()
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
      const { canvasRef } = useHero()
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
