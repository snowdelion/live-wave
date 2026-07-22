import { renderHook, act } from '@testing-library/react'

import { useDeleteMonitor, useMonitors } from '@/entities/monitor'

import { useMonitorTable } from '../useMonitorTable'

vi.mock('@/entities/monitor', async () => {
  const actual = await vi.importActual('@/entities/monitor')
  return {
    ...actual,
    useMonitors: vi.fn(),
    useDeleteMonitor: vi.fn(),
  }
})

function makeMonitor(overrides: Partial<{ id: string; name: string; type: string }> = {}) {
  return {
    id: 'mon_1',
    name: 'My Server',
    type: 'HTTP',
    ...overrides,
  } as never
}

describe('useMonitorTable', () => {
  const deleteMutate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useDeleteMonitor).mockReturnValue({
      mutate: deleteMutate,
    } as never)
  })

  describe('when monitors data is missing', () => {
    it('should default filtered to an empty array and isEmpty to true', () => {
      vi.mocked(useMonitors).mockReturnValue({ data: undefined } as never)

      const { result } = renderHook(() => useMonitorTable({ search: '', typeFilter: 'ALL' }))

      expect(result.current.filtered).toEqual([])
      expect(result.current.isEmpty).toBe(true)
    })
  })

  describe('when monitors list is empty', () => {
    it('should set isEmpty to true', () => {
      vi.mocked(useMonitors).mockReturnValue({ data: { monitors: [] } } as never)

      const { result } = renderHook(() => useMonitorTable({ search: '', typeFilter: 'ALL' }))

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.filtered).toEqual([])
    })
  })

  describe('filtering', () => {
    const monitors = [
      makeMonitor({ id: '1', name: 'Production API', type: 'HTTP' }),
      makeMonitor({ id: '2', name: 'Staging DB', type: 'TCP' }),
      makeMonitor({ id: '3', name: 'Ping Router', type: 'ICMP' }),
    ]

    beforeEach(() => {
      vi.mocked(useMonitors).mockReturnValue({ data: { monitors } } as never)
    })

    it('should return all monitors when search is empty and typeFilter is ALL', () => {
      const { result } = renderHook(() => useMonitorTable({ search: '', typeFilter: 'ALL' }))

      expect(result.current.filtered).toHaveLength(3)
      expect(result.current.isEmpty).toBe(false)
    })

    it('should filter by name case-insensitively', () => {
      const { result } = renderHook(() =>
        useMonitorTable({ search: 'production', typeFilter: 'ALL' }),
      )

      expect(result.current.filtered).toEqual([monitors[0]])
    })

    it('should filter by partial name match', () => {
      const { result } = renderHook(() => useMonitorTable({ search: 'ing', typeFilter: 'ALL' }))

      expect(result.current.filtered).toEqual([monitors[1], monitors[2]])
    })

    it('should filter by type', () => {
      const { result } = renderHook(() =>
        useMonitorTable({ search: '', typeFilter: 'TCP' as never }),
      )

      expect(result.current.filtered).toEqual([monitors[1]])
    })

    it('should filter by both name and type together', () => {
      const { result } = renderHook(() =>
        useMonitorTable({ search: 'staging', typeFilter: 'TCP' as never }),
      )

      expect(result.current.filtered).toEqual([monitors[1]])
    })

    it('should return an empty array when no monitor matches the search', () => {
      const { result } = renderHook(() =>
        useMonitorTable({ search: 'nonexistent', typeFilter: 'ALL' }),
      )

      expect(result.current.filtered).toEqual([])
      expect(result.current.hasNoResults).toBe(true)
    })

    it('should return an empty array when no monitor matches the type filter', () => {
      const { result } = renderHook(() =>
        useMonitorTable({ search: '', typeFilter: 'DNS' as never }),
      )

      expect(result.current.filtered).toEqual([])
      expect(result.current.hasNoResults).toBe(true)
    })

    it('should match typeFilter case-insensitively against uppercase monitor type', () => {
      const { result } = renderHook(() =>
        useMonitorTable({ search: '', typeFilter: 'tcp' as never }),
      )

      expect(result.current.filtered).toEqual([monitors[1]])
    })
  })

  describe('no-results messaging', () => {
    beforeEach(() => {
      vi.mocked(useMonitors).mockReturnValue({ data: { monitors: [] } } as never)
    })

    it('should show default title/description when no search and no filter', () => {
      const { result } = renderHook(() => useMonitorTable({ search: '', typeFilter: 'ALL' }))

      expect(result.current.noResultsTitle).toBe('No monitors found for "ALL"')
      expect(result.current.noResultsDescription).toBe('No monitors match your current filters')
    })

    it('should show search-only messaging when only search is provided', () => {
      const { result } = renderHook(() => useMonitorTable({ search: 'foo', typeFilter: 'ALL' }))

      expect(result.current.noResultsTitle).toBe('No monitors found for "foo"')
      expect(result.current.noResultsDescription).toBe('Try adjusting your search term')
    })

    it('should show filter-only messaging when only typeFilter is provided', () => {
      const { result } = renderHook(() =>
        useMonitorTable({ search: '', typeFilter: 'TCP' as never }),
      )

      expect(result.current.noResultsTitle).toBe('No TCP monitors found')
      expect(result.current.noResultsDescription).toBe(
        'Try selecting a different type or clearing the filter',
      )
    })

    it('should show combined messaging when both search and typeFilter are provided', () => {
      const { result } = renderHook(() =>
        useMonitorTable({ search: 'foo', typeFilter: 'TCP' as never }),
      )

      expect(result.current.noResultsTitle).toBe('No monitors found for "foo" with "TCP" type')
      expect(result.current.noResultsDescription).toBe(
        'Try adjusting your search or filter to see more results',
      )
    })

    it('should treat whitespace-only search as no search', () => {
      const { result } = renderHook(() => useMonitorTable({ search: '   ', typeFilter: 'ALL' }))

      expect(result.current.noResultsTitle).toBe('No monitors found for "ALL"')
      expect(result.current.noResultsDescription).toBe('No monitors match your current filters')
    })
  })

  describe('deleteTarget', () => {
    it('should default deleteTarget to null', () => {
      vi.mocked(useMonitors).mockReturnValue({ data: { monitors: [] } } as never)

      const { result } = renderHook(() => useMonitorTable({ search: '', typeFilter: 'ALL' }))

      expect(result.current.deleteTarget).toBeNull()
    })

    it('should update deleteTarget when setDeleteTarget is called', () => {
      vi.mocked(useMonitors).mockReturnValue({ data: { monitors: [] } } as never)

      const { result } = renderHook(() => useMonitorTable({ search: '', typeFilter: 'ALL' }))

      const target = makeMonitor({ id: 'mon_9' })

      act(() => {
        result.current.setDeleteTarget(target)
      })

      expect(result.current.deleteTarget).toBe(target)
    })

    it('should reset deleteTarget to null', () => {
      vi.mocked(useMonitors).mockReturnValue({ data: { monitors: [] } } as never)

      const { result } = renderHook(() => useMonitorTable({ search: '', typeFilter: 'ALL' }))

      act(() => {
        result.current.setDeleteTarget(makeMonitor())
      })
      act(() => {
        result.current.setDeleteTarget(null)
      })

      expect(result.current.deleteTarget).toBeNull()
    })
  })

  describe('deleteMonitor', () => {
    it('should expose the mutate function from useDeleteMonitor', () => {
      vi.mocked(useMonitors).mockReturnValue({ data: { monitors: [] } } as never)

      const { result } = renderHook(() => useMonitorTable({ search: '', typeFilter: 'ALL' }))

      expect(result.current.deleteMonitor).toBe(deleteMutate)
    })
  })
})
