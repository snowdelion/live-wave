import { Inject, Injectable } from '@nestjs/common'
import Redis from 'ioredis'

import { Logger } from '../logger/logger.service'
import { logAndThrow } from '../utils/error.utils'

import { REDIS_CLIENT } from './redis.constants'

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private logger: Logger,
  ) {}

  async set(key: string, value: string, ttlSeconds?: number) {
    try {
      if (ttlSeconds) await this.redis.set(key, value, 'EX', ttlSeconds)
      else await this.redis.set(key, value)
    } catch (e) {
      throw logAndThrow({
        logger: this.logger,
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
        logger: this.logger,
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
        logger: this.logger,
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
        logger: this.logger,
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
        logger: this.logger,
        context: 'expire Redis',
        e,
        exception: Error,
        exceptionContext: 'Redis expire failed',
      })
    }
  }
}
