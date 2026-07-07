import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnalyticsController } from '../analytics.controller'
import type { AnalyticsIncidentsQueryDto } from '../dto/requests/analytics-incidents-query.dto'
import type { AnalyticsOverviewQueryDto } from '../dto/requests/analytics-overview-query.dto'
import type { AnalyticsTimelineQueryDto } from '../dto/requests/analytics-timeline-query.dto'

const mockAnalyticsService = {
  getOverview: vi.fn(),
  getIncidents: vi.fn(),
  getTimeline: vi.fn(),
}

describe('AnalyticsController', () => {
  let controller: AnalyticsController

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new AnalyticsController(mockAnalyticsService as any)
  })

  describe('getOverview', () => {
    it('calls analyticsService.getOverview with correct args', async () => {
      const expected = { uptime: 99.9 }
      mockAnalyticsService.getOverview.mockResolvedValue(expected)

      const query: AnalyticsOverviewQueryDto = { days: 14 }
      const result = await controller.getOverview('user-1', 'monitor-1', query)

      expect(mockAnalyticsService.getOverview).toHaveBeenCalledWith('user-1', 'monitor-1', 14)
      expect(result).toBe(expected)
    })

    it('passes undefined days when not provided in query', async () => {
      mockAnalyticsService.getOverview.mockResolvedValue({})

      const query: AnalyticsOverviewQueryDto = {}
      await controller.getOverview('user-1', 'monitor-1', query)

      expect(mockAnalyticsService.getOverview).toHaveBeenCalledWith(
        'user-1',
        'monitor-1',
        undefined,
      )
    })
  })

  describe('getIncidents', () => {
    it('calculates startDate from days when startDate is not provided', async () => {
      mockAnalyticsService.getIncidents.mockResolvedValue([])

      const now = new Date('2024-06-01T12:00:00.000Z').getTime()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const query: AnalyticsIncidentsQueryDto = { days: 30 }
      await controller.getIncidents('user-1', 'monitor-1', query)

      const expectedStart = new Date(now - 30 * 24 * 60 * 60 * 1000)
      expect(mockAnalyticsService.getIncidents).toHaveBeenCalledWith(
        'user-1',
        'monitor-1',
        expectedStart,
      )

      vi.restoreAllMocks()
    })

    it('defaults to 7 days when neither startDate nor days is provided', async () => {
      mockAnalyticsService.getIncidents.mockResolvedValue([])

      const now = new Date('2024-06-01T12:00:00.000Z').getTime()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const query: AnalyticsIncidentsQueryDto = {}
      await controller.getIncidents('user-1', 'monitor-1', query)

      const expectedStart = new Date(now - 7 * 24 * 60 * 60 * 1000)
      expect(mockAnalyticsService.getIncidents).toHaveBeenCalledWith(
        'user-1',
        'monitor-1',
        expectedStart,
      )

      vi.restoreAllMocks()
    })
  })

  describe('getTimeline', () => {
    it('calculates startDate from days for timeline', async () => {
      mockAnalyticsService.getTimeline.mockResolvedValue([])

      const now = new Date('2024-06-01T12:00:00.000Z').getTime()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const query: AnalyticsTimelineQueryDto = { days: 3 }
      await controller.getTimeline('user-1', 'monitor-1', query)

      const expectedStart = new Date(now - 3 * 24 * 60 * 60 * 1000)
      expect(mockAnalyticsService.getTimeline).toHaveBeenCalledWith(
        'user-1',
        'monitor-1',
        expectedStart,
      )

      vi.restoreAllMocks()
    })

    it('defaults to 7 days when no query params given', async () => {
      mockAnalyticsService.getTimeline.mockResolvedValue([])

      const now = new Date('2024-06-01T12:00:00.000Z').getTime()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const query: AnalyticsTimelineQueryDto = {}
      await controller.getTimeline('user-1', 'monitor-1', query)

      const expectedStart = new Date(now - 7 * 24 * 60 * 60 * 1000)
      expect(mockAnalyticsService.getTimeline).toHaveBeenCalledWith(
        'user-1',
        'monitor-1',
        expectedStart,
      )

      vi.restoreAllMocks()
    })
  })

  describe('getStartDate (via public methods)', () => {
    it('produces the same Date for the same startDate string across calls', async () => {
      mockAnalyticsService.getIncidents.mockResolvedValue([])
      mockAnalyticsService.getTimeline.mockResolvedValue([])

      const now = new Date('2024-06-01T12:00:00.000Z').getTime()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const days = 14
      await controller.getIncidents('c', 'm', { days })
      await controller.getTimeline('c', 'm', { days })

      const incidentsDate = mockAnalyticsService.getIncidents.mock.calls[0][2] as Date
      const timelineDate = mockAnalyticsService.getTimeline.mock.calls[0][2] as Date

      expect(incidentsDate.toISOString()).toBe(timelineDate.toISOString())
    })
  })
})
