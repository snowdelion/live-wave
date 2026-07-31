import { waitFor } from '@testing-library/react'

import { renderHookWithClient } from '@/shared/test-utils'

import { fetchIncidents } from '../api/fetch-incidents'
import { fetchOverview } from '../api/fetch-overview'
import { fetchTimeline } from '../api/fetch-timeline'

import { ANALYTICS_QUERY_KEYS, useOverview, useIncidents, useTimeline } from './analytics-queries'

vi.mock('../api/fetch-incidents')
vi.mock('../api/fetch-overview')
vi.mock('../api/fetch-timeline')

describe('Analytics Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ANALYTICS_QUERY_KEYS', () => {
    it('generates the correct query keys', () => {
      expect(ANALYTICS_QUERY_KEYS.all).toEqual(['analytics'])
      expect(ANALYTICS_QUERY_KEYS.overview('mon-1', 7)).toEqual([
        'analytics',
        'overview',
        'mon-1',
        7,
      ])
      expect(ANALYTICS_QUERY_KEYS.incidents('mon-1', 14)).toEqual([
        'analytics',
        'incidents',
        'mon-1',
        14,
      ])
      expect(ANALYTICS_QUERY_KEYS.timeline('mon-1', 30)).toEqual([
        'analytics',
        'timeline',
        'mon-1',
        30,
      ])
    })
  })

  describe('useOverview', () => {
    it('fetches overview data successfully', async () => {
      const mockData = { monitorId: 'mon-1', uptime: 99.9 }
      vi.mocked(fetchOverview).mockResolvedValue(mockData as any)

      const { result } = renderHookWithClient(() => useOverview('mon-1', 7))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
        expect(result.current.isLoading).toBe(false)
      })

      expect(fetchOverview).toHaveBeenCalledWith('mon-1', 7)
    })

    it('does not fetch if monitorId is empty', async () => {
      const { result } = renderHookWithClient(() => useOverview('', 7))

      await waitFor(() => {
        expect(result.current.fetchStatus).toBe('idle')
        expect(result.current.isLoading).toBe(false)
      })

      expect(fetchOverview).not.toHaveBeenCalled()
    })

    it('defaults to 7 days if days parameter is not provided', async () => {
      vi.mocked(fetchOverview).mockResolvedValue({} as any)

      const { result } = renderHookWithClient(() => useOverview('mon-1'))

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(fetchOverview).toHaveBeenCalledWith('mon-1', 7)
    })
  })

  describe('useIncidents', () => {
    it('fetches incidents data successfully', async () => {
      const mockData = { incidents: [], total: 0 }
      vi.mocked(fetchIncidents).mockResolvedValue(mockData as any)

      const { result } = renderHookWithClient(() => useIncidents('mon-1', 14))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
        expect(result.current.isLoading).toBe(false)
      })

      expect(fetchIncidents).toHaveBeenCalledWith('mon-1', 14)
    })

    it('does not fetch if monitorId is empty', async () => {
      const { result } = renderHookWithClient(() => useIncidents('', 14))

      await waitFor(() => {
        expect(result.current.fetchStatus).toBe('idle')
        expect(result.current.isLoading).toBe(false)
      })

      expect(fetchIncidents).not.toHaveBeenCalled()
    })
  })

  describe('useTimeline', () => {
    it('fetches timeline data successfully', async () => {
      const mockData = [{ date: '2024-01-01', up: 10 }]
      vi.mocked(fetchTimeline).mockResolvedValue(mockData as any)

      const { result } = renderHookWithClient(() => useTimeline('mon-1', 30))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
        expect(result.current.isLoading).toBe(false)
      })

      expect(fetchTimeline).toHaveBeenCalledWith('mon-1', 30)
    })

    it('does not fetch if monitorId is empty', async () => {
      const { result } = renderHookWithClient(() => useTimeline('', 30))

      await waitFor(() => {
        expect(result.current.fetchStatus).toBe('idle')
        expect(result.current.isLoading).toBe(false)
      })

      expect(fetchTimeline).not.toHaveBeenCalled()
    })
  })
})
