import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { REDIS_KEYS } from '@/shared/redis/redis.constants'
import { RedisService } from '@/shared/redis/redis.service'

@Injectable()
export class UsersService {
  private logger: Logger
  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
    baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: UsersService.name })
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        telegramId: true,
        username: true,
        createdAt: true,
        alert: { select: { enabled: true } },
      },
    })
    if (!user) {
      this.logger.warn('User not found', { userId })
      throw new UnauthorizedException('User not found')
    }

    const { alert, ...rest } = user

    const formattedUser = {
      ...rest,
      isNotificationsEnabled: alert?.enabled ?? false,
    }

    return formattedUser
  }

  async delete(userId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!existingUser) {
      this.logger.warn('Attempted to delete non-existent user', { userId })
      throw new NotFoundException('User not found')
    }

    await this.redis.del(REDIS_KEYS.refreshToken(userId))
    await this.prisma.user.deleteMany({ where: { id: userId } })
    this.logger.log('User deleted', { userId })
  }
}
