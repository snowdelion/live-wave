import { Inject, Injectable } from '@nestjs/common'
import Redis from 'ioredis'

import { logAndThrow } from '../utils/error.utils'

import { REDIS_CLIENT } from './redis.constants'

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async set(key: string, value: string, ttlSeconds?: number) {
    try {
      if (ttlSeconds) await this.redis.set(key, value, 'EX', ttlSeconds)
      else await this.redis.set(key, value)
    } catch (e) {
      throw logAndThrow({
        name: RedisService.name,
        context: 'set Redis',
        e,
        exception: Error,
        exceptionContext: 'Redis set failed',
      })
    }
  }

  async get(key: string) {
    try {
      return await this.redis.get(key)
    } catch (e) {
      throw logAndThrow({
        name: RedisService.name,
        context: 'get Redis',
        e,
        exception: Error,
        exceptionContext: 'Redis get failed',
      })
    }
  }

  async del(key: string) {
    try {
      await this.redis.del(key)
    } catch (e) {
      throw logAndThrow({
        name: RedisService.name,
        context: 'del Redis',
        e,
        exception: Error,
        exceptionContext: 'Redis del failed',
      })
    }
  }

  async ping() {
    await this.redis.ping()
  }

  async incr(key: string) {
    try {
      return await this.redis.incr(key)
    } catch (e) {
      throw logAndThrow({
        name: RedisService.name,
        context: 'incr Redis',
        e,
        exception: Error,
        exceptionContext: 'Redis incr failed',
      })
    }
  }

  async expire(key: string, seconds: number) {
    try {
      await this.redis.expire(key, seconds)
    } catch (e) {
      throw logAndThrow({
        name: RedisService.name,
        context: 'expire Redis',
        e,
        exception: Error,
        exceptionContext: 'Redis expire failed',
      })
    }
  }

  multi() {
    try {
      return this.redis.multi()
    } catch (e) {
      throw logAndThrow({
        name: RedisService.name,
        context: 'multi Redis',
        e,
        exception: Error,
        exceptionContext: 'Redis multi failed',
      })
    }
  }
}
