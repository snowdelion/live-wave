import { renderHook, waitFor } from '@testing-library/react'

import { useUptimeBars } from '../useUptimeBars'

function setViewportWidth(width: number) {
  globalThis.setMockViewportWidth(width)
}

describe('useUptimeBars', () => {
  it('produces 90 bars on desktop width (>= 1024)', async () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => useUptimeBars())

    await waitFor(() => {
      expect(result.current.uptimeBars).toHaveLength(90)
    })
  })

  it('produces 30 bars on mobile width (<= 500)', async () => {
    setViewportWidth(400)
    const { result } = renderHook(() => useUptimeBars())

    await waitFor(() => {
      expect(result.current.uptimeBars).toHaveLength(30)
    })
  })

  it('produces 40 bars on large-mobile width (501-639)', async () => {
    setViewportWidth(600)
    const { result } = renderHook(() => useUptimeBars())

    await waitFor(() => {
      expect(result.current.uptimeBars).toHaveLength(40)
    })
  })

  it('produces 60 bars on small-tablet width (640-767)', async () => {
    setViewportWidth(700)
    const { result } = renderHook(() => useUptimeBars())

    await waitFor(() => {
      expect(result.current.uptimeBars).toHaveLength(60)
    })
  })

  it('produces 90 bars on tablet width (768-1023, falls through to default)', async () => {
    setViewportWidth(900)
    const { result } = renderHook(() => useUptimeBars())

    await waitFor(() => {
      expect(result.current.uptimeBars).toHaveLength(90)
    })
  })

  it('computes uptimePercentage consistent with the bars returned', async () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => useUptimeBars())

    await waitFor(() => {
      expect(result.current.uptimePercentage).not.toBeNull()
    })

    const bars = result.current.uptimeBars
    const expectedPct = ((bars.filter(b => b.ok).length / bars.length) * 100).toFixed(2)
    expect(result.current.uptimePercentage).toBe(expectedPct)
  })

  it('assigns height 100 to ok bars and a value in [10, 50) to non-ok bars', async () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => useUptimeBars())

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
    const { result } = renderHook(() => useUptimeBars())

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
    const { result } = renderHook(() => useUptimeBars())

    expect(result.current.uptimePercentage).toBe('0.00')
    randomSpy.mockRestore()
  })

  it('handles the all-bars-up edge case (100% uptime)', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1)
    setViewportWidth(1200)
    const { result } = renderHook(() => useUptimeBars())

    expect(result.current.uptimePercentage).toBe('100.00')
    randomSpy.mockRestore()
  })
})
