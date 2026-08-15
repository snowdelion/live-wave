import { UnauthorizedException } from '@nestjs/common'

import type { Logger } from '@/shared/logger/logger.service'
import { REDIS_KEYS } from '@/shared/redis/redis.constants'

import { UsersService } from '../users.service'

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger),
} as unknown as Logger

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

    service = new UsersService(redis, prisma, mockLogger)
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
      })

      const result = await service.getMe('user-1')

      expect(result).toEqual({
        email: 'a@b.com',
        telegramId: '123',
        username: 'user',
        createdAt,
        isNotificationsEnabled: true,
      })
    })

    it('defaults isNotificationsEnabled to false when alert is null', async () => {
      prisma.user.findUnique.mockResolvedValue({
        email: 'a@b.com',
        telegramId: '123',
        username: 'user',
        createdAt: new Date('2024-01-01'),
        alert: null,
      })

      const result = await service.getMe('user-1')

      expect(result.isNotificationsEnabled).toBe(false)
    })
  })

  describe('delete', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
    })

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
