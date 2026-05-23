import { Inject, Injectable } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) await this.redis.set(key, value, 'EX', ttlSeconds)
    else await this.redis.set(key, value)
  }

  async get(key: string) {
    return await this.redis.get(key)
  }

  async del(key: string) {
    await this.redis.del(key)
  }
}
