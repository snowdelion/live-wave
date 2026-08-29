import { render, renderHook, waitFor } from '@testing-library/react'

import { usePulseDots } from '../usePulseDots'

function setViewportWidth(width: number) {
  globalThis.setMockViewportWidth(width)
}

describe('usePulseDots', () => {
  it('starts with shouldShowDots false synchronously before the mount effect flushes, even on desktop width', () => {
    setViewportWidth(1200)
    let firstRenderShouldShowDots: boolean | undefined
    function Probe() {
      const hero = usePulseDots()
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
    const { result } = renderHook(() => usePulseDots())

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

  it('uses "md" coordinates when in the tablet range (768-1023)', async () => {
    setViewportWidth(900)
    const { result } = renderHook(() => usePulseDots())

    await waitFor(() => {
      expect(result.current.shouldShowDots).toBe(true)
    })

    expect(result.current.dotsCoords[0]?.left).toBe('49%')
  })

  it('uses "lg" coordinates when above tablet range (>= 1024)', async () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => usePulseDots())

    await waitFor(() => {
      expect(result.current.shouldShowDots).toBe(true)
    })

    expect(result.current.dotsCoords[0]?.left).toBe('18%')
  })

  it('produces exactly 7 dot delay strings matching PULSE_DOTS source values', async () => {
    setViewportWidth(1200)
    const { result } = renderHook(() => usePulseDots())

    await waitFor(() => {
      expect(result.current.shouldShowDots).toBe(true)
    })

    const expectedDelays = ['0s', '0.4s', '1.2s', '0.6s', '0.8s', '1s', '0.2s']
    const actualDelays = result.current.dotsCoords.map(c => c?.delay)
    expect(actualDelays).toEqual(expectedDelays)
  })
})
