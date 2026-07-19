import { Module } from '@nestjs/common'

import { PrismaModule } from '@/shared/prisma/prisma.module'
import { RedisModule } from '@/shared/redis/redis.module'

import { HealthController } from './health.controller'
import { HealthService } from './health.service'

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
