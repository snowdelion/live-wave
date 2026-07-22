import { Global, Module } from '@nestjs/common'
import { ThrottlerModule as OriginalThrottlerModule, seconds } from '@nestjs/throttler'
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis'

import { RedisModule } from '../redis/redis.module'
import { RedisService } from '../redis/redis.service'

@Global()
@Module({
  imports: [
    OriginalThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        throttlers: [
          { name: 'short', ttl: seconds(60), limit: 100 },
          { name: 'long', ttl: seconds(3600), limit: 1000 },
        ],
        storage: new ThrottlerStorageRedisService(redisService.getClient()),
      }),
    }),
  ],
  exports: [OriginalThrottlerModule],
})
export class ThrottlerModule {}
