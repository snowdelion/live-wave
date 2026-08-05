import { Logger, NotFoundException } from '@nestjs/common'
import { StatusEnum } from '@prisma/client'

import { getTimelineSql } from '../analytics.sql'

import { TimelineService } from './timeline.service'

vi.mock('../analytics.sql', () => ({
  getDailyStatsSql: vi.fn(),
  getIncidentsCountSql: vi.fn(),
  getIncidentsSql: vi.fn(),
  getTimelineSql: vi.fn(),
  getUptimeItemSql: vi.fn(),
}))

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
    check: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
    ...overrides,
  }
}

describe('TimelineService', () => {
  let service: TimelineService
  let prisma: ReturnType<typeof makePrisma>

  let loggerErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    prisma = makePrisma()
    service = new TimelineService(prisma as never)
    loggerErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    loggerErrorSpy.mockRestore()
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
      prisma.check.count.mockResolvedValue(100)
      prisma.$queryRaw.mockResolvedValue(makeTimelineRaw())

      const result = await service.getTimeline('user-1', 'monitor-1', startDate)

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ up: 9, down: 1, averageResponseTime: 200 })
      expect(result[0].date).toBeInstanceOf(Date)
    })

    it('returns raw checks when total checks are less than 40', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.check.count.mockResolvedValue(39)
      prisma.check.findMany.mockResolvedValue([
        {
          checkedAt: new Date('2024-01-01'),
          status: StatusEnum.up,
          responseTime: 100,
          error: null,
        },
        {
          checkedAt: new Date('2024-01-02'),
          status: StatusEnum.down,
          responseTime: null,
          error: 'Timeout',
        },
      ])

      const result = await service.getTimeline('user-1', 'monitor-1', startDate)

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        up: 1,
        down: 0,
        uptime: 100,
        averageResponseTime: 100,
        p95ResponseTime: null,
      })
      expect(result[1]).toMatchObject({
        up: 0,
        down: 1,
        uptime: 0,
        averageResponseTime: null,
        p95ResponseTime: null,
      })
    })

    it('maps null averageResponseTime to null', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.check.count.mockResolvedValue(100)
      prisma.$queryRaw.mockResolvedValue([
        { bucket: new Date(), up: BigInt(5), down: BigInt(0), averageResponseTime: null },
      ])

      const [point] = await service.getTimeline('user-1', 'monitor-1', startDate)

      expect(point.averageResponseTime).toBeNull()
    })

    it('converts BigInt up/down counts to numbers', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.check.count.mockResolvedValue(100)
      prisma.$queryRaw.mockResolvedValue([
        { bucket: new Date(), up: BigInt(42), down: BigInt(3), averageResponseTime: 100 },
      ])

      const [point] = await service.getTimeline('user-1', 'monitor-1', startDate)

      expect(typeof point.up).toBe('number')
      expect(typeof point.down).toBe('number')
      expect(point.up).toBe(42)
      expect(point.down).toBe(3)
    })

    it('re-throws database errors from getRawTimeline', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.check.count.mockResolvedValue(100)
      prisma.$queryRaw.mockRejectedValue(new Error('Timeline DB exploded'))

      await expect(service.getTimeline('user-1', 'monitor-1', new Date())).rejects.toThrow(
        'Timeline DB exploded',
      )
    })
  })

  describe('bucket size selection', () => {
    const cases: [number, number][] = [
      [30, 1],
      [60 * 5, 5],
      [60 * 24, 30],
      [60 * 48, 60],
      [60 * 96, 120],
    ]

    it.each(cases)(
      'window of %i minutes uses %i-minute buckets',
      async (windowMinutes, expectedBucket) => {
        prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
        prisma.check.count.mockResolvedValue(100)
        prisma.$queryRaw.mockResolvedValue([])

        const startDate = new Date(Date.now() - windowMinutes * 60 * 1000)
        await service.getTimeline('user-1', 'monitor-1', startDate)

        expect(getTimelineSql).toHaveBeenCalledWith('monitor-1', startDate, expectedBucket)
      },
    )
  })
})
