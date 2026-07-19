import { Logger, NotFoundException } from '@nestjs/common'

import type { RedisService } from '@/shared/redis/redis.service'

import { AnalyticsService } from '../analytics.service'

// --- mocks ---
const mockMonitor = { userId: 'user-1', name: 'My Monitor' }
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
} as unknown as RedisService

const makeUptimeRaw = (overrides = {}) => [
  { uptime: 99.5, averageResponseTime: 123.4, totalChecks: 200, ...overrides },
]

const makeDailyStatsRaw = () => [
  { day: '2024-01-01', uptime: 100, averageResponseTime: 110, failureCount: 0 },
  { day: '2024-01-02', uptime: 95, averageResponseTime: 130, failureCount: 2 },
]

const makeIncidentRaw = (overrides = {}) => [
  {
    startAt: new Date('2024-01-02T10:00:00Z'),
    endAt: new Date('2024-01-02T10:05:00Z'),
    durationMs: 300_000,
    cause: 'Connection refused',
    ...overrides,
  },
]

const makeTimelineRaw = () => [
  {
    bucket: new Date('2024-01-01T00:00:00Z'),
    up: BigInt(9),
    down: BigInt(1),
    averageResponseTime: 200,
  },
  {
    bucket: new Date('2024-01-01T00:05:00Z'),
    up: BigInt(10),
    down: BigInt(0),
    averageResponseTime: 150,
  },
]

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    monitor: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
    ...overrides,
  }
}

// --- tests ---
describe('AnalyticsService', () => {
  let service: AnalyticsService
  let prisma: ReturnType<typeof makePrisma>

  let loggerErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    prisma = makePrisma()
    service = new AnalyticsService(prisma as never, mockRedis)
    loggerErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    loggerErrorSpy.mockRestore()
  })

  describe('getOverview', () => {
    it('throws NotFoundException when monitor does not exist', async () => {
      prisma.monitor.findUnique.mockResolvedValue(null)

      await expect(service.getOverview('user-1', 'monitor-1')).rejects.toThrow(NotFoundException)
    })

    it('throws NotFoundException when monitor belongs to a different user', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'other-user', name: 'X' })

      await expect(service.getOverview('user-1', 'monitor-1')).rejects.toThrow(NotFoundException)
    })

    it('returns a correctly shaped overview', async () => {
      prisma.monitor.findUnique.mockResolvedValue(mockMonitor)
      prisma.$queryRaw
        .mockResolvedValueOnce(makeUptimeRaw())
        .mockResolvedValueOnce(makeDailyStatsRaw())

      const result = await service.getOverview('user-1', 'monitor-1', 7)

      expect(result).toMatchObject({
        monitorId: 'monitor-1',
        monitorName: 'My Monitor',
        periodDays: 7,
        totalChecks: 200,
        uptime: 99.5,
        averageResponseTime: 123.4,
      })
      expect(result.dailyStats).toHaveLength(2)
      expect(result.startDate).toBeInstanceOf(Date)
      expect(result.endDate).toBeInstanceOf(Date)
    })

    it('sets averageResponseTime to null when uptime row is missing', async () => {
      prisma.monitor.findUnique.mockResolvedValue(mockMonitor)
      prisma.$queryRaw
        .mockResolvedValueOnce([{ uptime: null, averageResponseTime: null, totalChecks: null }])
        .mockResolvedValueOnce([])

      const result = await service.getOverview('user-1', 'monitor-1')

      expect(result.uptime).toBeNull()
      expect(result.averageResponseTime).toBeNull()
      expect(result.totalChecks).toBe(0)
    })

    it('defaults to 7 days when the days param is omitted', async () => {
      prisma.monitor.findUnique.mockResolvedValue(mockMonitor)
      prisma.$queryRaw.mockResolvedValue([])

      const result = await service.getOverview('user-1', 'monitor-1')

      expect(result.periodDays).toBe(7)
    })
  })

  describe('getIncidents', () => {
    const startDate = new Date('2024-01-01T00:00:00Z')

    it('throws NotFoundException when monitor does not exist', async () => {
      prisma.monitor.findUnique.mockResolvedValue(null)

      await expect(service.getIncidents('user-1', 'monitor-1', startDate)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('throws NotFoundException when monitor belongs to a different user', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'other-user' })

      await expect(service.getIncidents('user-1', 'monitor-1', startDate)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('returns incidents list and total count', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw
        .mockResolvedValueOnce(makeIncidentRaw())
        .mockResolvedValueOnce([{ count: 1 }])

      const { incidents, total } = await service.getIncidents('user-1', 'monitor-1', startDate)

      expect(total).toBe(1)
      expect(incidents).toHaveLength(1)
      expect(incidents[0]).toMatchObject({
        durationMs: 300_000,
        cause: 'Connection refused',
      })
      expect(incidents[0].startAt).toBeInstanceOf(Date)
    })

    it('maps null durationMs to 0', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw
        .mockResolvedValueOnce(makeIncidentRaw({ durationMs: null, endAt: null }))
        .mockResolvedValueOnce([{ count: 1 }])

      const { incidents } = await service.getIncidents('user-1', 'monitor-1', startDate)

      expect(incidents[0].durationMs).toBe(0)
    })

    it('maps null cause to null', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw
        .mockResolvedValueOnce(makeIncidentRaw({ cause: null }))
        .mockResolvedValueOnce([{ count: 1 }])

      const { incidents } = await service.getIncidents('user-1', 'monitor-1', startDate)

      expect(incidents[0].cause).toBeNull()
    })

    it('returns 0 total when count row is missing', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{}])

      const { total } = await service.getIncidents('user-1', 'monitor-1', startDate)

      expect(total).toBe(0)
    })
  })

  describe('getTimeline', () => {
    const startDate = new Date('2024-01-01T00:00:00Z')

    it('throws NotFoundException when monitor does not exist', async () => {
      prisma.monitor.findUnique.mockResolvedValue(null)

      await expect(service.getTimeline('user-1', 'monitor-1', startDate)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('throws NotFoundException when monitor belongs to a different user', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'other-user' })

      await expect(service.getTimeline('user-1', 'monitor-1', startDate)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('returns mapped timeline buckets', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw.mockResolvedValue(makeTimelineRaw())

      const result = await service.getTimeline('user-1', 'monitor-1', startDate)

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ up: 9, down: 1, averageResponseTime: 200 })
      expect(result[0].timestamp).toBeInstanceOf(Date)
    })

    it('maps null averageResponseTime to null', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw.mockResolvedValue([
        { bucket: new Date(), up: BigInt(5), down: BigInt(0), averageResponseTime: null },
      ])

      const [point] = await service.getTimeline('user-1', 'monitor-1', startDate)

      expect(point.averageResponseTime).toBeNull()
    })

    it('converts BigInt up/down counts to numbers', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw.mockResolvedValue([
        { bucket: new Date(), up: BigInt(42), down: BigInt(3), averageResponseTime: 100 },
      ])

      const [point] = await service.getTimeline('user-1', 'monitor-1', startDate)

      expect(typeof point.up).toBe('number')
      expect(typeof point.down).toBe('number')
      expect(point.up).toBe(42)
      expect(point.down).toBe(3)
    })
  })

  describe('bucket size selection', () => {
    const cases: [number, number][] = [
      [30, 1],
      [60 * 5, 5],
      [60 * 24, 15],
      [60 * 48, 30],
      [60 * 96, 60],
    ]

    it.each(cases)(
      'window of %i minutes uses %i-minute buckets',
      async (windowMinutes, expectedBucket) => {
        prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
        prisma.$queryRaw.mockResolvedValue([])

        const startDate = new Date(Date.now() - windowMinutes * 60 * 1000)
        await service.getTimeline('user-1', 'monitor-1', startDate)

        const callArgs = prisma.$queryRaw.mock.calls[0]
        const flatArgs = callArgs.flat(Infinity)
        expect(flatArgs).toContain(expectedBucket)
      },
    )
  })

  describe('error propagation', () => {
    it('re-throws database errors from getOverview', async () => {
      prisma.monitor.findUnique.mockResolvedValue(mockMonitor)
      prisma.$queryRaw.mockRejectedValue(new Error('DB exploded'))

      await expect(service.getOverview('user-1', 'monitor-1')).rejects.toThrow('DB exploded')
    })

    it('re-throws database errors from getIncidents', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw.mockRejectedValue(new Error('DB exploded'))

      await expect(service.getIncidents('user-1', 'monitor-1', new Date())).rejects.toThrow(
        'DB exploded',
      )
    })

    it('re-throws database errors from getTimeline', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw.mockRejectedValue(new Error('DB exploded'))

      await expect(service.getTimeline('user-1', 'monitor-1', new Date())).rejects.toThrow(
        'DB exploded',
      )
    })

    it('calls logger.error with message and stack when an Error is thrown', async () => {
      const err = new Error('oops')
      prisma.monitor.findUnique.mockResolvedValue(mockMonitor)
      prisma.$queryRaw.mockRejectedValue(err)

      await expect(service.getOverview('user-1', 'monitor-1')).rejects.toThrow('oops')

      expect(loggerErrorSpy).toHaveBeenCalledWith(expect.stringContaining('oops'), err.stack)
    })

    it('calls logger.error with "Unknown error" and no stack for non-Error throws', async () => {
      prisma.monitor.findUnique.mockResolvedValue(mockMonitor)
      prisma.$queryRaw.mockRejectedValue('raw string error')

      await expect(service.getOverview('user-1', 'monitor-1')).rejects.toBe('raw string error')

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error'),
        undefined,
      )
    })

    it('handles non-Error throws from getIncidentsList (lines 183-184)', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw.mockRejectedValue(42)

      await expect(service.getIncidents('user-1', 'monitor-1', new Date())).rejects.toBe(42)

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error'),
        undefined,
      )
    })
  })
})
