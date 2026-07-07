import { Injectable, UnauthorizedException } from '@nestjs/common'

import { PrismaService } from '@/backend/shared/prisma/prisma.service'
import { REDIS_KEYS } from '@/backend/shared/redis/redis.constants'
import { RedisService } from '@/backend/shared/redis/redis.service'

@Injectable()
export class UsersService {
  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
    if (!user) throw new UnauthorizedException('User not found')

    const { alert, _count, monitors, ...rest } = user

    const formattedUser = {
      ...rest,
      isNotificationEnabled: alert?.enabled ?? false,
      monitorsCount: _count?.monitors ?? 0,
      checksCount: monitors?.[0]?._count?.checks ?? 0,
    }

    return formattedUser
  }

  async delete(userId: string) {
    await this.redis.del(REDIS_KEYS.refreshToken(userId))
    await this.prisma.user.delete({ where: { id: userId } })
  }
}
