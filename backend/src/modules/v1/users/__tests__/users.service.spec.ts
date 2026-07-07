import { UnauthorizedException } from '@nestjs/common'

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

  describe('getMe', () => {
    it('throws UnauthorizedException when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.getMe('user-1')).rejects.toThrow(UnauthorizedException)
      await expect(service.getMe('user-1')).rejects.toThrow('User not found')
    })

    it('queries findUnique with the correct id and select shape', async () => {
      prisma.user.findUnique.mockResolvedValue({
        email: 'a@b.com',
        telegramId: '123',
        username: 'user',
        createdAt: new Date('2024-01-01'),
        alert: { enabled: true },
        _count: { monitors: 2 },
        monitors: [{ _count: { checks: 5 } }],
      })

      await service.getMe('user-1')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          email: true,
          telegramId: true,
          username: true,
          createdAt: true,
          alert: { select: { enabled: true } },
          _count: { select: { monitors: true } },
          monitors: { select: { _count: { select: { checks: true } } } },
        },
      })
    })

    it('formats user with all fields present', async () => {
      const createdAt = new Date('2024-01-01')
      prisma.user.findUnique.mockResolvedValue({
        email: 'a@b.com',
        telegramId: '123',
        username: 'user',
        createdAt,
        alert: { enabled: true },
        _count: { monitors: 2 },
        monitors: [{ _count: { checks: 5 } }],
      })

      const result = await service.getMe('user-1')

      expect(result).toEqual({
        email: 'a@b.com',
        telegramId: '123',
        username: 'user',
        createdAt,
        isNotificationEnabled: true,
        monitorsCount: 2,
        checksCount: 5,
      })
    })

    it('defaults isNotificationEnabled to false when alert is null', async () => {
      prisma.user.findUnique.mockResolvedValue({
        email: 'a@b.com',
        telegramId: '123',
        username: 'user',
        createdAt: new Date('2024-01-01'),
        alert: null,
        _count: { monitors: 0 },
        monitors: [],
      })

      const result = await service.getMe('user-1')

      expect(result.isNotificationEnabled).toBe(false)
    })

    it('defaults monitorsCount to 0 when _count is missing', async () => {
      prisma.user.findUnique.mockResolvedValue({
        email: 'a@b.com',
        telegramId: '123',
        username: 'user',
        createdAt: new Date('2024-01-01'),
        alert: { enabled: false },
        _count: undefined,
        monitors: [],
      })

      const result = await service.getMe('user-1')

      expect(result.monitorsCount).toBe(0)
    })

    it('defaults checksCount to 0 when monitors array is empty', async () => {
      prisma.user.findUnique.mockResolvedValue({
        email: 'a@b.com',
        telegramId: '123',
        username: 'user',
        createdAt: new Date('2024-01-01'),
        alert: { enabled: false },
        _count: { monitors: 0 },
        monitors: [],
      })

      const result = await service.getMe('user-1')

      expect(result.checksCount).toBe(0)
    })

    it('defaults checksCount to 0 when first monitor has no _count', async () => {
      prisma.user.findUnique.mockResolvedValue({
        email: 'a@b.com',
        telegramId: '123',
        username: 'user',
        createdAt: new Date('2024-01-01'),
        alert: { enabled: false },
        _count: { monitors: 1 },
        monitors: [{ _count: undefined }],
      })

      const result = await service.getMe('user-1')

      expect(result.checksCount).toBe(0)
    })
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
