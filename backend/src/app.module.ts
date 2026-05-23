import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { validate } from '@/backend/config/validation'

import { V1Module } from './modules/v1/api-v1.module'
import { PrismaModule } from './shared/prisma/prisma.module'
import { RedisModule } from './shared/redis/redis.module'

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env.local', isGlobal: true, validate }),

    PrismaModule,
    RedisModule,
    V1Module,
  ],
})
export class AppModule {}
