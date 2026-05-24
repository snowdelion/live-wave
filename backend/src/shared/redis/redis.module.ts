import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

import { RedisService } from './redis.service'

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL')
        if (!url) throw new Error('REDIS_URL is not defined')

        const isProduction = config.get('NODE_ENV') === 'production'
        return new Redis(url, isProduction ? { tls: {} } : {})
      },

      inject: [ConfigService],
    },

    RedisService,
  ],

  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
