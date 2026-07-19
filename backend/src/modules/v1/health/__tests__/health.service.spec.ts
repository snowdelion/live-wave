import { HttpStatus } from '@nestjs/common'

import type { PrismaService } from '@/shared/prisma/prisma.service'
import type { RedisService } from '@/shared/redis/redis.service'

import { HealthService } from '../health.service'

// --- helpers ---
const mockPrisma = {
  $queryRaw: vi.fn(),
} as unknown as PrismaService

const mockRedis = {
  ping: vi.fn(),
} as unknown as RedisService

// --- tests ---
describe('HealthService', () => {
  let service: HealthService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new HealthService(
      mockPrisma as unknown as PrismaService,
      mockRedis as unknown as RedisService,
    )
  })

  describe('getReadinessStatus', () => {
    it('returns 200 and isHealthy=true when both database and redis are up', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ 1: 1 }])

      const result = await service.getReadinessStatus()

      expect(result.statusCode).toBe(HttpStatus.OK)
      expect(result.body.isHealthy).toBe(true)
      expect(result.body.checks).toEqual({ database: 'up', redis: 'up' })
      expect(result.body.errors).toEqual({})
    })

    it('returns 503 and isHealthy=false when database is down', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockRejectedValue(new Error('Connection refused'))

      const result = await service.getReadinessStatus()

      expect(result.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE)
      expect(result.body.isHealthy).toBe(false)
      expect(result.body.checks).toEqual({ database: 'down', redis: 'up' })
      expect(result.body.errors).toEqual({ database: 'Connection refused' })
    })

    it('returns 503 and isHealthy=false when redis is down', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([{ 1: 1 }])
      vi.mocked(mockRedis.ping).mockRejectedValue(new Error('Redis unavailable'))

      const result = await service.getReadinessStatus()

      expect(result.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE)
      expect(result.body.isHealthy).toBe(false)
      expect(result.body.checks).toEqual({ database: 'up', redis: 'down' })
      expect(result.body.errors).toEqual({ redis: 'Redis unavailable' })
    })

    it('returns 503 and isHealthy=false when both services are down', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockRejectedValue(new Error('DB error'))
      vi.mocked(mockRedis.ping).mockRejectedValue(new Error('Redis error'))

      const result = await service.getReadinessStatus()

      expect(result.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE)
      expect(result.body.isHealthy).toBe(false)
      expect(result.body.checks).toEqual({ database: 'down', redis: 'down' })
      expect(result.body.errors).toEqual({ database: 'DB error', redis: 'Redis error' })
    })

    it('uses fallback error message when a non-Error is thrown', async () => {
      vi.mocked(mockPrisma.$queryRaw).mockRejectedValue('some string error')
      vi.mocked(mockRedis.ping).mockRejectedValue(null)

      const result = await service.getReadinessStatus()

      expect(result.body.errors).toEqual({
        database: 'Service unavailable',
        redis: 'Service unavailable',
      })
    })
  })
})
