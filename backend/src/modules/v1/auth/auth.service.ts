import crypto from 'crypto'

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcrypt'
import { Response } from 'express'

import { CookieService } from '@/shared/cookie/cookie.service'
import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { REDIS_KEYS } from '@/shared/redis/redis.constants'
import { RedisService } from '@/shared/redis/redis.service'

import { SignInEmailDto } from './dto/requests/sign-in.dto'
import { SignUpEmailDto } from './dto/requests/sign-up.dto'
import { TelegramAuthDto } from './dto/requests/telegram-auth.dto'

@Injectable()
export class AuthService {
  private readonly accessSecret?: string
  private readonly refreshSecret?: string
  private logger: Logger
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
    private config: ConfigService,
    private cookieService: CookieService,
    baseLogger: Logger,
  ) {
    this.accessSecret = this.config.get<string>('JWT_ACCESS_SECRET')
    this.refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET')
    this.logger = baseLogger.child({ context: AuthService.name })
  }

  async signUpEmail(dto: SignUpEmailDto) {
    const existing = await this.prisma.user.count({ where: { email: dto.email.toLowerCase() } })
    if (existing > 0) {
      this.logger.warn('User attempted to register using an existing email', { email: dto.email })
      throw new ForbiddenException('Email already taken')
    }

    const hashedPassword = await bcrypt.hash(dto.password.trim(), 10)
    const newUser = await this.prisma.user.create({
      data: { email: dto.email.toLowerCase(), password: hashedPassword },
      select: { id: true, email: true },
    })
    if (!newUser.email) throw new BadRequestException('Email not found')

    this.logger.log('User registered via email', { userId: newUser.id, email: newUser.email })
    const { accessToken, refreshToken } = await this.generateTokens({
      userId: newUser.id,
      email: newUser.email,
    })
    return { accessToken, refreshToken }
  }

  async signInEmail(dto: SignInEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { password: true, id: true, email: true },
    })
    if (!user || !user.password || !user.email) {
      this.logger.warn('Failed sign-in: user not found', { email: dto.email })
      throw new ForbiddenException('Incorrect email or password')
    }

    const isValid = await bcrypt.compare(dto.password.trim(), user.password.trim())
    if (!isValid) {
      this.logger.warn('Failed sign-in: invalid password', { email: user.email })
      throw new ForbiddenException('Incorrect email or password')
    }

    this.logger.log('User signed in via email', { userId: user.id, email: user.email })
    const { accessToken, refreshToken } = await this.generateTokens({
      userId: user.id,
      email: user.email?.toLowerCase(),
    })
    return { accessToken, refreshToken }
  }

  async telegramAuth(dto: TelegramAuthDto) {
    if (!this.verifyTelegramData(dto)) {
      this.logger.error('Invalid Telegram data', { telegramId: dto.id })
      throw new UnauthorizedException('Invalid Telegram data')
    }

    const now = Math.floor(Date.now() / 1000)
    if (now - dto.auth_date > 300) {
      this.logger.warn('Telegram login expired', { telegramId: dto.id })
      throw new UnauthorizedException('Telegram login expired')
    }

    const user = await this.prisma.user.upsert({
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

    this.logger.log('User authenticated via Telegram', {
      userId: user.id,
      telegramId: user.telegramId,
    })
    const { accessToken, refreshToken } = await this.generateTokens({
      userId: user.id,
      telegramId: user.telegramId,
    })
    return { accessToken, refreshToken }
  }

  private verifyTelegramData(data: TelegramAuthDto): boolean {
    const { hash, ...rest } = data

    const filtered = Object.fromEntries(
      Object.entries(rest).filter(([_, value]) => value !== undefined && value !== null),
    )

    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN')
    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not set', {
        hasBotToken: !!this.config.get<string>('TELEGRAM_BOT_TOKEN'),
      })
      return false
    }

    const secret = crypto.createHash('sha256').update(token).digest()
    const checkString = Object.keys(filtered)
      .sort()
      .map(key => `${key}=${filtered[key as keyof typeof filtered]}`)
      .join('\n')

    const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex')
    const success = hmac === hash

    if (success) this.logger.debug('Telegram data verified', { telegramId: data.id })
    else this.logger.warn('Telegram data verification failed', { telegramId: data.id })

    return success
  }

  async generateTokens({
    userId,
    email,
    telegramId,
  }: {
    userId: string
    email?: string
    telegramId?: string | null
  }) {
    const payload = { sub: userId, email, telegramId }

    const accessToken = this.jwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: '15m',
    })
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: '7d',
    })

    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex')
    await this.redis.set(REDIS_KEYS.refreshToken(userId), hashedRefresh, 7 * 24 * 60 * 60)

    return { accessToken, refreshToken }
  }

  async refreshAccessToken(refreshToken: string, res: Response) {
    const payload = this.getPayload(refreshToken)
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, telegramId: true },
    })
    const userRefreshToken = await this.redis.get(REDIS_KEYS.refreshToken(payload.sub))

    if (!user || !userRefreshToken) {
      this.logger.warn('User not found or no refresh token', { userId: payload.sub })
      this.cookieService.clearRefreshToken(res)
      await this.redis.del(REDIS_KEYS.refreshToken(payload.sub))
      throw new UnauthorizedException('User not found or no refresh token')
    }

    const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex')
    if (hashed !== userRefreshToken) {
      this.logger.warn('Refresh token hash mismatch', { userId: user.id })
      this.cookieService.clearRefreshToken(res)
      await this.redis.del(REDIS_KEYS.refreshToken(payload.sub))
      throw new UnauthorizedException('Invalid refresh token')
    }

    this.logger.debug('Access token refreshed', { userId: user.id })
    const newAccessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, telegramId: user.telegramId },
      { secret: this.accessSecret, expiresIn: '15m' },
    )
    return { accessToken: newAccessToken }
  }

  async invalidateRefreshToken(refreshToken: string) {
    const payload = this.getPayload(refreshToken)
    await this.redis.del(REDIS_KEYS.refreshToken(payload.sub))
    this.logger.log('Refresh token invalidated', { userId: payload.sub })
  }

  private getPayload(refreshToken: string): { sub: string } {
    try {
      return this.jwtService.verify(refreshToken, {
        secret: this.refreshSecret,
      })
    } catch {
      this.logger.error(`Invalid refresh token in format "getPayload"`, {
        tokenPreview: `${refreshToken.slice(0, 10)}...`,
      })
      throw new UnauthorizedException('Invalid refresh token')
    }
  }
}
