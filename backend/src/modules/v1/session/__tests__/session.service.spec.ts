import { UnauthorizedException } from '@nestjs/common'
import type { Mocked } from 'vitest'
import { mockDeep } from 'vitest-mock-extended'

import type { PrismaService } from '@/backend/shared/prisma/prisma.service'
import { REDIS_KEYS } from '@/backend/shared/redis/redis.constants'
import type { RedisService } from '@/backend/shared/redis/redis.service'

import { SessionService } from '../session.service'

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
} as unknown as Mocked<RedisService>

const mockPrisma = mockDeep<PrismaService>()

const TTL = 7 * 24 * 60 * 60

let service: SessionService

beforeEach(() => {
  vi.clearAllMocks()
  service = new SessionService(mockRedis, mockPrisma)
})

// --- createSession ---
describe('createSession', () => {
  it('saves the session in Redis with a TTL of 7 days', async () => {
    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue(undefined)

    await service.createSession('client-1', '1.2.3.4')

    expect(mockRedis.set).toHaveBeenCalledWith(
      REDIS_KEYS.session('client-1'),
      expect.stringContaining('"ip":"1.2.3.4"'),
      TTL,
    )
  })

  it('initializes servicesCount = 0 and notifyTelegram = false', async () => {
    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue(undefined)

    await service.createSession('client-1', '1.2.3.4')

    const saved = JSON.parse(mockRedis.set.mock.calls[0][1]) as {
      servicesCount: number
      notifyTelegram: boolean
    }
    expect(saved.servicesCount).toBe(0)
    expect(saved.notifyTelegram).toBe(false)
  })

  it('binds IP to clientId via bindIpToSession', async () => {
    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue(undefined)

    await service.createSession('client-1', '1.2.3.4')

    expect(mockRedis.set).toHaveBeenCalledWith(REDIS_KEYS.ipSession('1.2.3.4'), 'client-1', TTL)
  })

  it('deletes the old session if the IP is already taken by another clientId', async () => {
    mockRedis.get.mockResolvedValueOnce(null).mockResolvedValueOnce('old-client')

    mockRedis.get.mockReset()
    mockRedis.get.mockImplementation((key: string) => {
      if (key === REDIS_KEYS.ipSession('1.2.3.4')) return Promise.resolve('old-client')
      if (key === REDIS_KEYS.session('old-client'))
        return Promise.resolve(
          JSON.stringify({
            ip: '1.2.3.4',
            createdAt: 1,
            updatedAt: 1,
            servicesCount: 0,
            notifyTelegram: false,
          }),
        )
      return Promise.resolve(null)
    })
    mockRedis.set.mockResolvedValue(undefined)
    mockRedis.del.mockResolvedValue(undefined)

    await service.createSession('new-client', '1.2.3.4')

    expect(mockPrisma.monitor.deleteMany).toHaveBeenCalledWith({
      where: { clientId: 'old-client' },
    })
  })
})

// --- getSession ---
describe('getSession', () => {
  it('returns null if the key is not found', async () => {
    mockRedis.get.mockResolvedValue(null)

    const result = await service.getSession('client-1')

    expect(result).toBeNull()
  })

  it('returns parsed session data', async () => {
    const data = {
      ip: '1.2.3.4',
      servicesCount: 2,
      notifyTelegram: true,
      createdAt: 1000,
      updatedAt: 2000,
    }
    mockRedis.get.mockResolvedValue(JSON.stringify(data))

    const result = await service.getSession('client-1')

    expect(result).toEqual(data)
  })

  it('throws an error when the data is invalid', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ data: 'invalid data' }))

    await expect(service.getSession('client-1')).rejects.toThrow('Invalid session data')
  })
})

// --- deleteSession ---
describe('deleteSession', () => {
  it('removes services and session key', async () => {
    mockRedis.get.mockResolvedValue(
      JSON.stringify({
        ip: '1.2.3.4',
        createdAt: 1,
        updatedAt: 1,
        servicesCount: 0,
        notifyTelegram: false,
      }),
    )
    mockRedis.del.mockResolvedValue(undefined)

    await service.deleteSession('client-1')

    expect(mockPrisma.monitor.deleteMany).toHaveBeenCalledWith({
      where: { clientId: 'client-1' },
    })
    expect(mockRedis.del).toHaveBeenCalledWith(REDIS_KEYS.session('client-1'))
  })

  it('deletes the ip key if it is in the session', async () => {
    mockRedis.get.mockResolvedValue(
      JSON.stringify({
        ip: '1.2.3.4',
        createdAt: 1,
        updatedAt: 1,
        servicesCount: 0,
        notifyTelegram: false,
      }),
    )
    mockRedis.del.mockResolvedValue(undefined)

    await service.deleteSession('client-1')

    expect(mockRedis.del).toHaveBeenCalledWith(REDIS_KEYS.ipSession('1.2.3.4'))
  })

  it('removes the telegramToClient key if telegramChatId exists', async () => {
    mockRedis.get.mockResolvedValue(
      JSON.stringify({
        ip: '1.2.3.4',
        telegramChatId: 1234,
        createdAt: 1,
        updatedAt: 1,
        servicesCount: 0,
        notifyTelegram: false,
      }),
    )
    mockRedis.del.mockResolvedValue(undefined)

    await service.deleteSession('client-1')

    expect(mockRedis.del).toHaveBeenCalledWith(REDIS_KEYS.telegramToClient(1234))
  })

  it('does not crash if the session does not exist', async () => {
    mockRedis.get.mockResolvedValue(null)
    mockRedis.del.mockResolvedValue(undefined)

    await expect(service.deleteSession('unknown')).resolves.not.toThrow()
  })
})

// --- extendSession ---
describe('extendSession', () => {
  it('updates updatedAt and saves with TTL', async () => {
    const before = Date.now()
    const data = {
      ip: '1.2.3.4',
      createdAt: 1000,
      updatedAt: 1000,
      servicesCount: 0,
      notifyTelegram: false,
    }
    mockRedis.get.mockResolvedValue(JSON.stringify(data))
    mockRedis.set.mockResolvedValue(undefined)

    await service.extendSession('client-1')

    const saved = JSON.parse(mockRedis.set.mock.calls[0][1]) as {
      updatedAt: number
    }
    expect(saved.updatedAt).toBeGreaterThanOrEqual(before)
    expect(mockRedis.set).toHaveBeenCalledWith(
      REDIS_KEYS.session('client-1'),
      expect.any(String),
      TTL,
    )
  })

  it('does nothing if there is no session', async () => {
    mockRedis.get.mockResolvedValue(null)

    await service.extendSession('unknown')

    expect(mockRedis.set).not.toHaveBeenCalled()
  })
})

// --- getClientByIp ---
describe('getClientByIp', () => {
  it('returns clientId by IP', async () => {
    mockRedis.get.mockResolvedValue('client-1')

    const result = await service.getClientByIp('1.2.3.4')

    expect(result).toBe('client-1')
    expect(mockRedis.get).toHaveBeenCalledWith(REDIS_KEYS.ipSession('1.2.3.4'))
  })

  it('returns null if the IP is not bound', async () => {
    mockRedis.get.mockResolvedValue(null)

    const result = await service.getClientByIp('9.9.9.9')

    expect(result).toBeNull()
  })
})

// --- updateNotificationSettings ---
describe('updateNotificationSettings', () => {
  it('updates notifyTelegram and returns the session', async () => {
    const data = {
      ip: '1.2.3.4',
      createdAt: 1000,
      updatedAt: 1000,
      servicesCount: 0,
      notifyTelegram: false,
    }
    mockRedis.get.mockResolvedValue(JSON.stringify(data))
    mockRedis.set.mockResolvedValue(undefined)

    const result = await service.updateNotificationSettings('client-1', true)

    expect(result.notifyTelegram).toBe(true)
    expect(mockRedis.set).toHaveBeenCalled()
  })

  it('throws NotFoundException if there is no session', async () => {
    mockRedis.get.mockResolvedValue(null)

    await expect(service.updateNotificationSettings('unknown', true)).rejects.toThrow(
      UnauthorizedException,
    )
  })
})
