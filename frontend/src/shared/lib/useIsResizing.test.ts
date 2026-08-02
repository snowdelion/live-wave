import { act, renderHook } from '@testing-library/react'

import { useIsResizing } from './useIsResizing'

describe('useIsResizing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initially return false', () => {
    const { result } = renderHook(() => useIsResizing())
    expect(result.current).toBe(false)
  })

  it('should set isResizing to true when window resizes', async () => {
    const { result } = renderHook(() => useIsResizing())
    await act(() => window.dispatchEvent(new Event('resize')))
    expect(result.current).toBe(true)
  })

  it('should set isResizing to false after delay', async () => {
    const { result } = renderHook(() => useIsResizing())

    await act(() => window.dispatchEvent(new Event('resize')))
    expect(result.current).toBe(true)

    await act(() => vi.advanceTimersByTime(2000))
    expect(result.current).toBe(false)
  })
})
