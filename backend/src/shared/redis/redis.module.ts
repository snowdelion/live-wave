import { Global, Inject, Logger, Module, OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

import { createRedisClient } from './redis.config'
import { REDIS_CLIENT } from './redis.constants'
import { RedisService } from './redis.service'

const logger = new Logger('RedisModule')

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: createRedisClient,
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  async onApplicationShutdown() {
    try {
      logger.log('Closing Redis connection...')
      await this.redisClient.quit()
      logger.log('Redis connection closed successfully')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unexpected error'
      logger.error(`Failed to close Redis connection cleanly: ${msg}`)
    }
  }
}
