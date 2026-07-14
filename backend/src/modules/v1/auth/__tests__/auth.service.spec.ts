import crypto from 'crypto'

import { ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common'
import bcrypt from 'bcrypt'
import type { Mock } from 'vitest'

import { REDIS_KEYS } from '@/backend/shared/redis/redis.constants'

import { AuthService } from '../auth.service'

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}))

describe('AuthService', () => {
  let service: AuthService
  let prisma: any
  let redis: any
  let jwtService: any
  let config: any

  const ACCESS_SECRET = 'access-secret'
  const REFRESH_SECRET = 'refresh-secret'

  beforeEach(() => {
    vi.clearAllMocks()

    prisma = {
      user: {
        count: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    }

    redis = {
      set: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
    }

    jwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
    }

    config = {
      get: vi.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return ACCESS_SECRET
        if (key === 'JWT_REFRESH_SECRET') return REFRESH_SECRET
        return undefined
      }),
    }

    service = new AuthService(prisma, redis, jwtService, config)
  })

  describe('signUpEmail', () => {
    const dto = { email: 'Test@Example.com', password: '  password123  ' }

    it('throws ForbiddenException if email already taken', async () => {
      prisma.user.count.mockResolvedValue(1)

      await expect(service.signUpEmail(dto as any)).rejects.toThrow(ForbiddenException)
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })

    it('creates a user with lowercase email and hashed trimmed password', async () => {
      prisma.user.count.mockResolvedValue(0)
      ;(bcrypt.hash as Mock).mockResolvedValue('hashed-pw')
      prisma.user.create.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
      jwtService.sign.mockReturnValue('signed-token')

      const result = await service.signUpEmail(dto as any)

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'test@example.com', password: 'hashed-pw' },
        select: { id: true, email: true },
      })
      expect(result).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' })
    })

    it('throws BadRequestException if created user has no email', async () => {
      prisma.user.count.mockResolvedValue(0)
      ;(bcrypt.hash as Mock).mockResolvedValue('hashed-pw')
      prisma.user.create.mockResolvedValue({ id: 'user-1', email: null })

      await expect(service.signUpEmail(dto as any)).rejects.toThrow(BadRequestException)
    })

    it('generates tokens and stores hashed refresh token in redis after signup', async () => {
      prisma.user.count.mockResolvedValue(0)
      ;(bcrypt.hash as Mock).mockResolvedValue('hashed-pw')
      prisma.user.create.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
      jwtService.sign.mockReturnValue('signed-token')

      await service.signUpEmail(dto as any)

      const expectedHash = crypto.createHash('sha256').update('signed-token').digest('hex')
      expect(redis.set).toHaveBeenCalledWith(
        REDIS_KEYS.refreshToken('user-1'),
        expectedHash,
        7 * 24 * 60 * 60,
      )
    })
  })

  describe('signInEmail', () => {
    const dto = { email: 'Test@Example.com', password: '  password123  ' }

    it('throws ForbiddenException if user not found or has no password', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.signInEmail(dto as any)).rejects.toThrow(ForbiddenException)
    })

    it('throws ForbiddenException if user has no password set', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        password: null,
      })

      await expect(service.signInEmail(dto as any)).rejects.toThrow(ForbiddenException)
    })

    it('throws ForbiddenException if password is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        password: 'hashed-pw',
      })
      ;(bcrypt.compare as Mock).mockResolvedValue(false)

      await expect(service.signInEmail(dto as any)).rejects.toThrow(ForbiddenException)
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-pw')
    })

    it('throws ForbiddenException if user has no email', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: null,
        password: 'hashed-pw',
      })
      ;(bcrypt.compare as Mock).mockResolvedValue(true)

      await expect(service.signInEmail(dto as any)).rejects.toThrow(ForbiddenException)
    })

    it('returns tokens on successful sign in', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'Test@Example.com',
        password: 'hashed-pw',
      })
      ;(bcrypt.compare as Mock).mockResolvedValue(true)
      jwtService.sign.mockReturnValue('signed-token')

      const result = await service.signInEmail(dto as any)

      expect(result).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' })
    })
  })

  describe('telegramAuth', () => {
    const BOT_TOKEN = 'bot-token'
    const baseDto = {
      id: 12345,
      first_name: 'John',
      username: 'johnny',
      auth_date: 0,
      hash: '',
      photo_url: '',
    }

    function computeHash(data: any, botToken: string) {
      const { hash: _, ...rest } = data
      const filtered = Object.fromEntries(
        Object.entries(rest).filter(([_, value]) => value !== undefined && value !== null),
      )
      const checkString = Object.keys(filtered)
        .sort()
        .map(key => `${key}=${filtered[key]}`)
        .join('\n')
      const secret = crypto.createHash('sha256').update(botToken).digest()
      return crypto.createHmac('sha256', secret).update(checkString).digest('hex')
    }

    beforeEach(() => {
      config.get.mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return ACCESS_SECRET
        if (key === 'JWT_REFRESH_SECRET') return REFRESH_SECRET
        if (key === 'TELEGRAM_BOT_TOKEN') return BOT_TOKEN
        return undefined
      })
      service = new AuthService(prisma, redis, jwtService, config)
    })

    it('throws UnauthorizedException if telegram hash is invalid', async () => {
      const dto = { ...baseDto, auth_date: Math.floor(Date.now() / 1000), hash: 'invalid-hash' }

      await expect(service.telegramAuth(dto as any)).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException if telegram auth_date expired (older than 300s)', async () => {
      const auth_date = Math.floor(Date.now() / 1000) - 301
      const dto = { ...baseDto, auth_date }
      dto.hash = computeHash(dto, BOT_TOKEN)

      await expect(service.telegramAuth(dto as any)).rejects.toThrow(UnauthorizedException)
    })

    it('creates a new user if telegram user does not exist, then returns tokens', async () => {
      const auth_date = Math.floor(Date.now() / 1000)
      const dto = { ...baseDto, auth_date }
      dto.hash = computeHash(dto, BOT_TOKEN)

      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.upsert.mockResolvedValue({ id: 'user-1', telegramId: String(dto.id) })
      jwtService.sign.mockReturnValue('signed-token')

      const result = await service.telegramAuth(dto as any)

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { telegramId: String(dto.id) },
        update: {
          username: dto.username || dto.first_name,
          photoUrl: dto.photo_url,
        },
        create: {
          telegramId: String(dto.id),
          username: dto.username || dto.first_name,
          photoUrl: dto.photo_url,
        },
        select: { id: true, telegramId: true },
      })
      expect(result).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' })
    })

    it('uses first_name as username fallback when username is not provided', async () => {
      const auth_date = Math.floor(Date.now() / 1000)
      const dto = { ...baseDto, username: undefined, auth_date }
      dto.hash = computeHash(dto, BOT_TOKEN)

      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.upsert.mockResolvedValue({ id: 'user-1', telegramId: String(dto.id) })
      jwtService.sign.mockReturnValue('signed-token')

      await service.telegramAuth(dto as any)

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { telegramId: String(dto.id) },
        update: {
          username: dto.username || dto.first_name,
          photoUrl: dto.photo_url,
        },
        create: {
          telegramId: String(dto.id),
          username: dto.username || dto.first_name,
          photoUrl: dto.photo_url,
        },
        select: { id: true, telegramId: true },
      })
    })

    it('reuses existing user if telegram user already exists', async () => {
      const auth_date = Math.floor(Date.now() / 1000)
      const dto = { ...baseDto, auth_date }
      dto.hash = computeHash(dto, BOT_TOKEN)

      prisma.user.upsert.mockResolvedValue({
        id: 'existing-user',
        telegramId: String(dto.id),
      })

      jwtService.sign.mockReturnValue('signed-token')

      const result = await service.telegramAuth(dto as any)

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { telegramId: String(dto.id) },
        update: {
          username: dto.username || dto.first_name,
          photoUrl: dto.photo_url,
        },
        create: {
          telegramId: String(dto.id),
          username: dto.username || dto.first_name,
          photoUrl: dto.photo_url,
        },
        select: { id: true, telegramId: true },
      })

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'existing-user', email: undefined, telegramId: String(dto.id) },
        expect.objectContaining({ secret: ACCESS_SECRET }),
      )
      expect(result).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' })
    })
  })

  describe('generateTokens', () => {
    it('signs access and refresh tokens with correct secrets and expirations', async () => {
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token')

      const result = await service.generateTokens({ userId: 'user-1', email: 'test@example.com' })

      expect(jwtService.sign).toHaveBeenNthCalledWith(
        1,
        { sub: 'user-1', email: 'test@example.com' },
        { secret: ACCESS_SECRET, expiresIn: '15m' },
      )
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        { sub: 'user-1', email: 'test@example.com' },
        { secret: REFRESH_SECRET, expiresIn: '7d' },
      )
      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' })
    })

    it('stores sha256 hash of refresh token in redis with correct key and ttl', async () => {
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token')

      await service.generateTokens({ userId: 'user-1', email: 'test@example.com' })

      const expectedHash = crypto.createHash('sha256').update('refresh-token').digest('hex')
      expect(redis.set).toHaveBeenCalledWith(
        REDIS_KEYS.refreshToken('user-1'),
        expectedHash,
        7 * 24 * 60 * 60,
      )
    })
  })

  describe('refreshAccessToken', () => {
    it('throws UnauthorizedException if refresh token is invalid (verify throws)', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('bad token')
      })

      await expect(service.refreshAccessToken('bad-token')).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException if user not found', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' })
      prisma.user.findUnique.mockResolvedValue(null)
      redis.get.mockResolvedValue('some-hash')

      await expect(service.refreshAccessToken('valid-token')).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException if no refresh token stored in redis', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' })
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
      redis.get.mockResolvedValue(null)

      await expect(service.refreshAccessToken('valid-token')).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException if stored hash does not match provided token hash', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' })
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
      redis.get.mockResolvedValue('some-other-hash')

      await expect(service.refreshAccessToken('valid-token')).rejects.toThrow(UnauthorizedException)
    })

    it('returns a new access token when refresh token is valid and matches', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' })
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })

      const matchingHash = crypto.createHash('sha256').update('valid-token').digest('hex')
      redis.get.mockResolvedValue(matchingHash)
      jwtService.sign.mockReturnValue('new-access-token')

      const result = await service.refreshAccessToken('valid-token')

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1', email: 'test@example.com' },
        { secret: ACCESS_SECRET, expiresIn: '15m' },
      )
      expect(result).toEqual({ accessToken: 'new-access-token' })
    })

    it('calls jwtService.verify with the refresh secret', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' })
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
      const matchingHash = crypto.createHash('sha256').update('valid-token').digest('hex')
      redis.get.mockResolvedValue(matchingHash)
      jwtService.sign.mockReturnValue('new-access-token')

      await service.refreshAccessToken('valid-token')

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token', { secret: REFRESH_SECRET })
    })
  })

  describe('invalidateRefreshToken', () => {
    it('throws UnauthorizedException if token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('bad token')
      })

      await expect(service.invalidateRefreshToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      )
      expect(redis.del).not.toHaveBeenCalled()
    })

    it('deletes the refresh token from redis using the payload sub', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' })

      await service.invalidateRefreshToken('valid-token')

      expect(redis.del).toHaveBeenCalledWith(REDIS_KEYS.refreshToken('user-1'))
    })
  })
})
