import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'

import { PrismaService } from '@/backend/shared/prisma/prisma.service'
import { REDIS_KEYS } from '@/backend/shared/redis/redis.constants'
import { RedisService } from '@/backend/shared/redis/redis.service'
import { logAndThrow } from '@/backend/shared/utils/error.utils'

import { SessionData } from './types/session.types'

@Injectable()
export class SessionService {
  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  async createSession(clientId: string, ip: string) {
    const sessionData: SessionData = {
      ip,
      servicesCount: 0,
      telegramChatId: undefined,
      notifyTelegram: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await this.redis.set(
      REDIS_KEYS.session(clientId),
      JSON.stringify(sessionData),
      7 * 24 * 60 * 60,
    )
    await this.bindIpToSession(ip, clientId)
  }

  async getSession(clientId: string): Promise<SessionData | null> {
    const rawData = await this.redis.get(REDIS_KEYS.session(clientId))
    if (!rawData) return null

    let parsed: SessionData
    try {
      parsed = JSON.parse(rawData) as SessionData
    } catch (e) {
      logAndThrow({
        name: SessionService.name,
        context: 'parse session data',
        e,
        shouldThrow: false,
      })
      return null
    }
    if (!this.isSessionData(parsed)) throw new BadRequestException('Invalid session data')
    return parsed
  }

  async deleteSession(clientId: string) {
    const session = await this.getSession(clientId)

    await this.prisma.monitor.deleteMany({ where: { clientId } })

    await this.redis.del(REDIS_KEYS.session(clientId))
    if (session?.ip) await this.redis.del(REDIS_KEYS.ipSession(session.ip))

    if (session?.telegramChatId)
      await this.redis.del(REDIS_KEYS.telegramToClient(session.telegramChatId))
  }

  async extendSession(clientId: string) {
    const session = await this.getSession(clientId)
    if (!session) return

    session.updatedAt = Date.now()
    await this.redis.set(REDIS_KEYS.session(clientId), JSON.stringify(session), 7 * 24 * 60 * 60)
  }

  async getClientByIp(ip: string) {
    return await this.redis.get(REDIS_KEYS.ipSession(ip))
  }

  async updateNotificationSettings(
    clientId: string,
    notifyTelegram: boolean,
  ): Promise<SessionData> {
    const session = await this.getSession(clientId)
    if (!session) throw new UnauthorizedException('No active session')

    session.notifyTelegram = notifyTelegram
    session.updatedAt = Date.now()

    await this.redis.set(REDIS_KEYS.session(clientId), JSON.stringify(session))
    return session
  }

  // private
  private isSessionData(data: unknown): data is SessionData {
    if (typeof data !== 'object' || data === null) return false
    const obj = data as Record<string, number>
    return typeof obj.createdAt === 'number'
  }

  private async bindIpToSession(ip: string, clientId: string) {
    const existingClientId = await this.redis.get(REDIS_KEYS.ipSession(ip))
    if (existingClientId && existingClientId !== clientId)
      await this.deleteSession(existingClientId)

    await this.redis.set(REDIS_KEYS.ipSession(ip), clientId, 7 * 24 * 60 * 60)
  }
}
