import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'

import { validate } from '@/config/validation'

import { V1Module } from './modules/v1/api-v1.module'
import { CookieModule } from './shared/cookie/cookie.module'
import { PrismaModule } from './shared/prisma/prisma.module'
import { RateLimitModule } from './shared/rate-limit/rate-limit.module'
import { RedisModule } from './shared/redis/redis.module'
import { CustomThrottlerGuard } from './shared/throttler/custom-throttler.guard'
import { ThrottlerModule } from './shared/throttler/throttler.module'

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
    ThrottlerModule,
    CookieModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
