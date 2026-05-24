import { Test, type TestingModule } from '@nestjs/testing'

import { RedisService } from '../redis.service'

const mockRedis = {
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
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
})
