import { NotFoundException } from '@nestjs/common'

import type { Logger } from '@/shared/logger/logger.service'
import type { RedisService } from '@/shared/redis/redis.service'

import { OverviewService } from './overview.service'

vi.mock('../analytics.sql', () => ({
  getIncidentsCountSql: vi.fn(),
  getIncidentsSql: vi.fn(),
  getTimelineSql: vi.fn(),
  getUptimeItemSql: vi.fn(),
}))

const mockMonitor = { userId: 'user-1', name: 'My Monitor' }
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
} as unknown as RedisService

const makeUptimeRaw = (overrides = {}) => [
  {
    uptime: 99.5,
    averageResponseTime: 123.4,
    p95ResponseTime: 150,
    totalChecks: 200,
    up: 190,
    down: 10,
    ...overrides,
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

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger),
} as unknown as Logger

describe('OverviewService', () => {
  let service: OverviewService
  let prisma: ReturnType<typeof makePrisma>

  beforeEach(() => {
    prisma = makePrisma()

    service = new OverviewService(prisma as never, mockRedis, mockLogger)
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
      prisma.$queryRaw.mockResolvedValueOnce(makeUptimeRaw())

      const result = await service.getOverview('user-1', 'monitor-1', 7)

      expect(result).toMatchObject({
        totalChecks: 200,
        uptime: 99.5,
        averageResponseTime: 123.4,
        up: 190,
        down: 10,
      })
    })

    it('sets averageResponseTime to null when uptime row is missing', async () => {
      prisma.monitor.findUnique.mockResolvedValue(mockMonitor)
      prisma.$queryRaw
        .mockResolvedValueOnce([{ uptime: null, averageResponseTime: null, totalChecks: null }])
        .mockResolvedValueOnce([])

      const result = await service.getOverview('user-1', 'monitor-1')

      expect(result.uptime).toBe(0)
      expect(result.averageResponseTime).toBeNull()
      expect(result.totalChecks).toBe(0)
    })
  })

  describe('error propagation', () => {
    it('re-throws database errors from getOverview (getUptime)', async () => {
      prisma.monitor.findUnique.mockResolvedValue(mockMonitor)
      prisma.$queryRaw.mockRejectedValue(new Error('DB exploded'))

      await expect(service.getOverview('user-1', 'monitor-1')).rejects.toThrow('DB exploded')
    })

    it('calls logger.error with message and stack when an Error is thrown', async () => {
      const err = new Error('oops')
      prisma.monitor.findUnique.mockResolvedValue(mockMonitor)
      prisma.$queryRaw.mockRejectedValue(err)

      await expect(service.getOverview('user-1', 'monitor-1')).rejects.toThrow('oops')

      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('oops'), {
        context: expect.any(String),
        stack: err.stack,
      })
    })

    it('calls logger.error with "Unknown error" and no stack for non-Error throws', async () => {
      prisma.monitor.findUnique.mockResolvedValue(mockMonitor)
      prisma.$queryRaw.mockRejectedValue('raw string error')

      await expect(service.getOverview('user-1', 'monitor-1')).rejects.toBe('raw string error')

      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Unknown error'), {
        context: expect.any(String),
        stack: undefined,
      })
    })
  })
})
