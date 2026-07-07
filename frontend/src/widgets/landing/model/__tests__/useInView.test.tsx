import { act, render, renderHook } from '@testing-library/react'
import { useMediaQuery } from 'react-responsive'

import { useInView } from '../useInView'

// --- mocks ---
vi.mock('react-responsive', () => ({
  useMediaQuery: vi.fn(),
}))

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []

  callback: ObserverCallback
  options: IntersectionObserverInit | undefined
  observedTargets: Element[] = []
  observe = vi.fn((target: Element) => this.observedTargets.push(target))
  unobserve = vi.fn(
    (target: Element) => (this.observedTargets = this.observedTargets.filter(t => t !== target)),
  )
  disconnect = vi.fn(() => (this.observedTargets = []))
  takeRecords = vi.fn(() => [])

  constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback
    this.options = options
    MockIntersectionObserver.instances.push(this)
  }

  trigger(entries: Partial<IntersectionObserverEntry>[]) {
    this.callback(entries)
  }
}

const mockedUseMediaQuery = useMediaQuery as unknown as ReturnType<typeof vi.fn>
function setBreakpoints({
  isMobile = false,
  isTablet = false,
}: { isMobile?: boolean; isTablet?: boolean } = {}) {
  mockedUseMediaQuery.mockReset()
  mockedUseMediaQuery.mockImplementation((query: { maxWidth?: number; minWidth?: number }) => {
    if (query.maxWidth === 639) return isMobile
    if (query.minWidth === 640 && query.maxWidth === 1023) return isTablet
    return false
  })
}

beforeEach(() => {
  MockIntersectionObserver.instances = []
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  setBreakpoints()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function getLatestObserver() {
  const instance = MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1]
  if (!instance) throw new Error('No IntersectionObserver instance was created')
  return instance
}

// --- tests ---
describe('useInView', () => {
  it('returns isInView=false initially and a ref object', () => {
    const { result } = renderHook(() => useInView())

    expect(result.current.isInView).toBe(false)
    expect(result.current.ref).toEqual({ current: null })
  })

  it('does not call observe when ref.current is null', () => {
    renderHook(() => useInView())

    const observer = getLatestObserver()
    expect(observer.observe).not.toHaveBeenCalled()
  })

  it('uses threshold 0.1 on mobile', () => {
    setBreakpoints({ isMobile: true, isTablet: false })

    renderHook(() => useInView())

    const observer = getLatestObserver()
    expect(observer.options).toEqual({ threshold: 0.1 })
  })

  it('uses threshold 0.2 on tablet', () => {
    setBreakpoints({ isMobile: false, isTablet: true })

    renderHook(() => useInView())

    const observer = getLatestObserver()
    expect(observer.options).toEqual({ threshold: 0.2 })
  })

  it('uses threshold 0.3 on desktop (default branch)', () => {
    setBreakpoints({ isMobile: false, isTablet: false })

    renderHook(() => useInView())

    const observer = getLatestObserver()
    expect(observer.options).toEqual({ threshold: 0.3 })
  })

  it('observes the element once ref is attached to a DOM node', () => {
    function TestComponent() {
      const { ref } = useInView()
      return <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="target" />
    }

    render(<TestComponent />)

    const observer = getLatestObserver()
    expect(observer.observe).toHaveBeenCalledTimes(1)
    expect(observer.observedTargets).toHaveLength(1)
  })

  it('sets isInView to true and unobserves the target when the entry intersects', () => {
    let hookResult: ReturnType<typeof useInView> | undefined

    function TestComponent() {
      hookResult = useInView()
      return <div ref={hookResult.ref as React.RefObject<HTMLDivElement>} />
    }

    const { rerender } = render(<TestComponent />)
    const observer = getLatestObserver()
    const target = observer.observedTargets[0]

    act(() => {
      observer.trigger([{ isIntersecting: true, target } as Partial<IntersectionObserverEntry>])
    })
    rerender(<TestComponent />)

    expect(hookResult?.isInView).toBe(true)
    expect(observer.unobserve).toHaveBeenCalledWith(target)
  })

  it('does not set isInView or unobserve when the entry is not intersecting', () => {
    let hookResult: ReturnType<typeof useInView> | undefined

    function TestComponent() {
      hookResult = useInView()
      return <div ref={hookResult.ref as React.RefObject<HTMLDivElement>} />
    }

    const { rerender } = render(<TestComponent />)
    const observer = getLatestObserver()
    const target = observer.observedTargets[0]

    act(() => {
      observer.trigger([{ isIntersecting: false, target } as Partial<IntersectionObserverEntry>])
    })
    rerender(<TestComponent />)

    expect(hookResult?.isInView).toBe(false)
    expect(observer.unobserve).not.toHaveBeenCalled()
  })

  it('does not throw and leaves isInView false when entries array is empty', () => {
    let hookResult: ReturnType<typeof useInView> | undefined

    function TestComponent() {
      hookResult = useInView()
      return <div ref={hookResult.ref as React.RefObject<HTMLDivElement>} />
    }

    const { rerender } = render(<TestComponent />)
    const observer = getLatestObserver()

    expect(() => {
      act(() => {
        observer.trigger([])
      })
    }).not.toThrow()
    rerender(<TestComponent />)

    expect(hookResult?.isInView).toBe(false)
  })

  it('disconnects the observer on unmount', () => {
    const { unmount } = renderHook(() => useInView())
    const observer = getLatestObserver()

    unmount()

    expect(observer.disconnect).toHaveBeenCalledTimes(1)
  })

  it('recreates the observer with new options when breakpoint flags change', () => {
    setBreakpoints({ isMobile: true, isTablet: false })
    const { rerender } = renderHook(() => useInView())

    expect(MockIntersectionObserver.instances).toHaveLength(1)
    expect(getLatestObserver().options).toEqual({ threshold: 0.1 })

    setBreakpoints({ isMobile: false, isTablet: true })
    rerender()

    expect(MockIntersectionObserver.instances.length).toBeGreaterThan(1)
    expect(getLatestObserver().options).toEqual({ threshold: 0.2 })
    expect(MockIntersectionObserver?.instances[0]?.disconnect).toHaveBeenCalledTimes(1)
  })
})
