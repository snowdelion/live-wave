import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'

import { validate } from '@/config/validation'

import { V1Module } from './modules/v1/api-v1.module'
import { CookieModule } from './shared/cookie/cookie.module'
import { LoggerModule } from './shared/logger/logger.module'
import { MetricsModule } from './shared/metrics/metrics.module'
import { PrismaModule } from './shared/prisma/prisma.module'
import { RateLimitModule } from './shared/rate-limit/rate-limit.module'
import { RedisModule } from './shared/redis/redis.module'
import { CustomThrottlerGuard } from './shared/throttler/custom-throttler.guard'
import { ThrottlerModule } from './shared/throttler/throttler.module'

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env.local', isGlobal: true, validate }),
    ScheduleModule.forRoot(),

    PrismaModule,
    RedisModule,
    V1Module,
    RateLimitModule,
    ThrottlerModule,
    CookieModule,
    MetricsModule,
    LoggerModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    LoggerModule,
  ],
})
export class AppModule {}
