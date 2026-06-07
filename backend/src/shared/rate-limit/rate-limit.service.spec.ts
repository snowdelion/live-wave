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

  describe('checkRules', () => {
    const rules = [
      { key: 'minute', limit: 10, windowSeconds: 60 },
      { key: 'hour', limit: 100, windowSeconds: 3600 },
    ] as const

    it('should return true when all counts are within their limits', async () => {
      mockMulti.exec.mockResolvedValue([
        [null, 5],
        [null, 50],
      ])

      const result = await service.checkRules('user:123', rules)

      expect(result).toBe(true)
    })

    it('should return true when counts equal their limits', async () => {
      mockMulti.exec.mockResolvedValue([
        [null, 10],
        [null, 100],
      ])

      const result = await service.checkRules('user:123', rules)

      expect(result).toBe(true)
    })

    it('should return false when first rule limit is exceeded', async () => {
      mockMulti.exec.mockResolvedValue([
        [null, 11],
        [null, 50],
      ])

      const result = await service.checkRules('user:123', rules)

      expect(result).toBe(false)
    })

    it('should return false when second rule limit is exceeded', async () => {
      mockMulti.exec.mockResolvedValue([
        [null, 5],
        [null, 101],
      ])

      const result = await service.checkRules('user:123', rules)

      expect(result).toBe(false)
    })

    it('should call incr for each rule key via the pipeline', async () => {
      mockMulti.exec.mockResolvedValue([
        [null, 1],
        [null, 1],
      ])
      mockRedis.expire.mockResolvedValue(1)

      await service.checkRules('user:123', rules)

      expect(mockRedis.multi).toHaveBeenCalledTimes(1)
      expect(mockMulti.incr).toHaveBeenCalledWith('user:123:minute')
      expect(mockMulti.incr).toHaveBeenCalledWith('user:123:hour')
      expect(mockMulti.exec).toHaveBeenCalledTimes(1)
    })

    it('should set expiry for keys with count of 1 (first request in window)', async () => {
      mockMulti.exec.mockResolvedValue([
        [null, 1],
        [null, 1],
      ])
      mockRedis.expire.mockResolvedValue(1)

      await service.checkRules('user:123', rules)

      expect(mockRedis.expire).toHaveBeenCalledWith('user:123:minute', 60)
      expect(mockRedis.expire).toHaveBeenCalledWith('user:123:hour', 3600)
      expect(mockRedis.expire).toHaveBeenCalledTimes(2)
    })

    it('should only set expiry for keys whose count is 1', async () => {
      mockMulti.exec.mockResolvedValue([
        [null, 1],
        [null, 5],
      ])
      mockRedis.expire.mockResolvedValue(1)

      await service.checkRules('user:123', rules)

      expect(mockRedis.expire).toHaveBeenCalledWith('user:123:minute', 60)
      expect(mockRedis.expire).not.toHaveBeenCalledWith('user:123:hour', expect.anything())
      expect(mockRedis.expire).toHaveBeenCalledTimes(1)
    })

    it('should return false when a Redis pipeline error occurs', async () => {
      mockMulti.exec.mockResolvedValue([
        [new Error('Redis error'), null],
        [null, 1],
      ])

      const result = await service.checkRules('user:123', rules)

      expect(result).toBe(false)
    })

    it('should return false when exec result contains a non-numeric value', async () => {
      mockMulti.exec.mockResolvedValue([
        [null, 'not-a-number'],
        [null, 1],
      ])

      const result = await service.checkRules('user:123', rules)

      expect(result).toBe(false)
    })

    it('should build keys using the provided prefix', async () => {
      const singleRule = [{ key: 'req', limit: 5, windowSeconds: 30 }] as const
      mockMulti.exec.mockResolvedValue([[null, 1]])
      mockRedis.expire.mockResolvedValue(1)

      await service.checkRules('api:v2', singleRule)

      expect(mockMulti.incr).toHaveBeenCalledWith('api:v2:req')
    })

    it('should return true for an empty rules array', async () => {
      mockMulti.exec.mockResolvedValue([])

      const result = await service.checkRules('user:123', [])

      expect(result).toBe(true)
    })
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
