import { Inject, Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}
  private readonly logger = new Logger(RedisService.name)

  async set(key: string, value: string, ttlSeconds?: number) {
    try {
      if (ttlSeconds) await this.redis.set(key, value, 'EX', ttlSeconds)
      else await this.redis.set(key, value)
    } catch (e) {
      const errorDetails = this.logError('set', e)
      throw new Error(`Redis set failed: ${errorDetails}`)
    }
  }

  async get(key: string) {
    try {
      return await this.redis.get(key)
    } catch (e) {
      const errorDetails = this.logError('get', e)
      throw new Error(`Redis get failed: ${errorDetails}`)
    }
  }

  async del(key: string) {
    try {
      await this.redis.del(key)
    } catch (e) {
      const errorDetails = this.logError('del', e)
      throw new Error(`Redis del failed: ${errorDetails}`)
    }
  }

  async ping() {
    await this.redis.ping()
  }

  private logError(method: string, error: unknown): string {
    const errorMsg = error instanceof Error ? error.message : 'unknown error'

    this.logger.error(`Method [${method}] execution failed: ${errorMsg}`)
    return errorMsg
  }
}
