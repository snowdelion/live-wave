import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { validate } from '@/backend/config/validation'

import { V1Module } from './modules/v1/api-v1.module'
import { PrismaModule } from './shared/prisma/prisma.module'
import { RateLimitModule } from './shared/rate-limit/rate-limit.module'
import { RedisModule } from './shared/redis/redis.module'

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env.local', isGlobal: true, validate }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: { url: configService.get<string>('REDIS_URL') },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: true,
        },
      }),

      inject: [ConfigService],
    }),

    PrismaModule,
    RedisModule,
    V1Module,
    RateLimitModule,
  ],
})
export class AppModule {}
