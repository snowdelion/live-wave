import { REDIS_KEYS } from '@/backend/shared/redis/redis.constants'

import { UsersService } from '../users.service'

describe('UsersService', () => {
  let service: UsersService
  let prisma: any
  let redis: any

  beforeEach(() => {
    vi.clearAllMocks()

    prisma = {
      user: {
        count: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    }

    redis = {
      set: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
    }

    service = new UsersService(redis, prisma)
  })

  describe('delete', () => {
    it('deletes redis refresh token and the user record', async () => {
      await service.delete('user-1')

      expect(redis.del).toHaveBeenCalledWith(REDIS_KEYS.refreshToken('user-1'))
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } })
    })

    it('deletes redis key before deleting the user', async () => {
      const callOrder: string[] = []
      redis.del.mockImplementation(async () => {
        callOrder.push('redis.del')
      })
      prisma.user.delete.mockImplementation(async () => {
        callOrder.push('prisma.user.delete')
      })

      await service.delete('user-1')

      expect(callOrder).toEqual(['redis.del', 'prisma.user.delete'])
    })
  })
})
