import { Test, type TestingModule } from '@nestjs/testing'

import { RedisService } from '../redis.service'

const mockRedis = {
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  ping: vi.fn(),
}

describe('RedisService', () => {
  let service: RedisService

  beforeEach(async () => {
    vi.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService, { provide: 'REDIS_CLIENT', useValue: mockRedis }],
    }).compile()

    service = module.get<RedisService>(RedisService)
  })

  describe('set', () => {
    it('sets a key without TTL', async () => {
      await service.set('key', 'value')

      expect(mockRedis.set).toHaveBeenCalledOnce()
      expect(mockRedis.set).toHaveBeenCalledWith('key', 'value')
    })

    it('sets a key with TTL', async () => {
      await service.set('key', 'value', 60)

      expect(mockRedis.set).toHaveBeenCalledOnce()
      expect(mockRedis.set).toHaveBeenCalledWith('key', 'value', 'EX', 60)
    })

    it('does not use EX when ttlSeconds is 0', async () => {
      await service.set('key', 'value', 0)

      expect(mockRedis.set).toHaveBeenCalledWith('key', 'value')
    })
  })

  describe('get', () => {
    it('returns the value for an existing key', async () => {
      mockRedis.get.mockResolvedValue('value')

      const result = await service.get('key')

      expect(mockRedis.get).toHaveBeenCalledOnce()
      expect(mockRedis.get).toHaveBeenCalledWith('key')
      expect(result).toBe('value')
    })

    it('returns null for a missing key', async () => {
      mockRedis.get.mockResolvedValue(null)

      const result = await service.get('missing')

      expect(result).toBeNull()
    })
  })

  describe('del', () => {
    it('deletes a key', async () => {
      await service.del('key')

      expect(mockRedis.del).toHaveBeenCalledOnce()
      expect(mockRedis.del).toHaveBeenCalledWith('key')
    })
  })

  describe('ping', () => {
    it('calls ping', async () => {
      mockRedis.ping = vi.fn().mockResolvedValue('PONG')
      await expect(service.ping()).resolves.toBeUndefined()
      expect(mockRedis.ping).toHaveBeenCalledOnce()
    })
  })

  describe('when redis throws', () => {
    const setMessage = 'set failed'
    const getMessage = 'get failed'
    const delMessage = 'del failed'

    beforeEach(() => {
      mockRedis.set.mockRejectedValue(new Error(setMessage))
      mockRedis.get.mockRejectedValue(new Error(getMessage))
      mockRedis.del.mockRejectedValue(new Error(delMessage))
    })

    it('set throws an error', async () => {
      await expect(service.set('key', 'value')).rejects.toThrow(`Redis set failed: ${setMessage}`)
    })

    it('get throws an error', async () => {
      await expect(service.get('key')).rejects.toThrow(`Redis get failed: ${getMessage}`)
    })

    it('del throws an error', async () => {
      await expect(service.del('key')).rejects.toThrow(`Redis del failed: ${delMessage}`)
    })
  })
})
