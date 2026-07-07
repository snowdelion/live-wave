import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/backend/shared/prisma/prisma.service'
import { REDIS_KEYS } from '@/backend/shared/redis/redis.constants'
import { RedisService } from '@/backend/shared/redis/redis.service'

@Injectable()
export class UsersService {
  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  async delete(userId: string) {
    await this.redis.del(REDIS_KEYS.refreshToken(userId))
    await this.prisma.user.delete({ where: { id: userId } })
  }
}
