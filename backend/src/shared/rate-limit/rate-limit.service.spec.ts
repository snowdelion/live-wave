import { REDIS_KEYS } from '../redis/redis.constants'
import type { RedisService } from '../redis/redis.service'

import { RateLimitService } from './rate-limit.service'

const mockMulti = {
  incr: vi.fn().mockReturnThis(),
  exec: vi.fn(),
}

const mockRedis = {
  multi: vi.fn(() => mockMulti),
  expire: vi.fn(),
  incr: vi.fn(),
}

describe('RateLimitService', () => {
  let service: RateLimitService

  beforeEach(() => {
    vi.clearAllMocks()
    mockRedis.multi.mockReturnValue(mockMulti)
    mockMulti.incr.mockReturnThis()
    service = new RateLimitService(mockRedis as unknown as RedisService)
  })

  describe('domain', () => {
    const domain = 'example.com'
    const domainKey = REDIS_KEYS.domainRateLimit(domain)

    it('should return false when under the rate limit', async () => {
      mockRedis.incr.mockResolvedValue(3)

      const result = await service.domain({ domain })

      expect(result).toBe(false)
    })

    it('should return false when count equals the limit', async () => {
      mockRedis.incr.mockResolvedValue(6)

      const result = await service.domain({ domain })

      expect(result).toBe(false)
    })

    it('should return true when count exceeds the default limit', async () => {
      mockRedis.incr.mockResolvedValue(7)

      const result = await service.domain({ domain })

      expect(result).toBe(true)
    })

    it('should return true when count exceeds a custom maxPerMinute', async () => {
      mockRedis.incr.mockResolvedValue(4)

      const result = await service.domain({ domain, maxPerMinute: 3 })

      expect(result).toBe(true)
    })

    it('should return false when count is within a custom maxPerMinute', async () => {
      mockRedis.incr.mockResolvedValue(3)

      const result = await service.domain({ domain, maxPerMinute: 3 })

      expect(result).toBe(false)
    })

    it('should set expiry with default expireSeconds on first request', async () => {
      mockRedis.incr.mockResolvedValue(1)

      await service.domain({ domain })

      expect(mockRedis.expire).toHaveBeenCalledWith(domainKey, 60)
      expect(mockRedis.expire).toHaveBeenCalledTimes(1)
    })

    it('should set expiry with custom expireSeconds on first request', async () => {
      mockRedis.incr.mockResolvedValue(1)

      await service.domain({ domain, expireSeconds: 120 })

      expect(mockRedis.expire).toHaveBeenCalledWith(domainKey, 120)
    })

    it('should not set expiry when count is greater than 1', async () => {
      mockRedis.incr.mockResolvedValue(2)

      await service.domain({ domain })

      expect(mockRedis.expire).not.toHaveBeenCalled()
    })

    it('should call incr with the correct Redis key', async () => {
      mockRedis.incr.mockResolvedValue(1)

      await service.domain({ domain })

      expect(mockRedis.incr).toHaveBeenCalledWith(domainKey)
    })
  })
})
