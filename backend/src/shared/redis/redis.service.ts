import { Inject, Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'

import { REDIS_CLIENT } from './redis.constants'

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}
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

  async incr(key: string) {
    try {
      return await this.redis.incr(key)
    } catch (e) {
      const errorDetails = this.logError('incr', e)
      throw new Error(`Redis incr failed: ${errorDetails}`)
    }
  }

  async expire(key: string, seconds: number) {
    try {
      await this.redis.expire(key, seconds)
    } catch (e) {
      const errorDetails = this.logError('expire', e)
      throw new Error(`Redis expire failed: ${errorDetails}`)
    }
  }

  private logError(method: string, error: unknown): string {
    const errorMsg = error instanceof Error ? error.message : 'unknown error'

    this.logger.error(`Method [${method}] execution failed: ${errorMsg}`)
    return errorMsg
  }
}
