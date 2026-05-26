import { Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

const logger = new Logger('RedisModule')

export const createRedisClient = (config: ConfigService) => {
  const url = config.get<string>('REDIS_URL')
  if (!url) throw new Error('REDIS_URL is not defined')
  const isProduction = config.get('NODE_ENV') === 'production'

  const redis = new Redis(url, {
    maxRetriesPerRequest: null,
    retryStrategy: times => {
      if (times > 10) {
        logger.error('Redis reconnection attempts exhausted.')
        return null
      }

      return Math.min(times * 200, 1000)
    },
    ...(isProduction && { tls: {} }),
  })

  redis.on('error', e => {
    logger.error(`Redis connection error: ${e.message}`)
  })
  return redis
}
