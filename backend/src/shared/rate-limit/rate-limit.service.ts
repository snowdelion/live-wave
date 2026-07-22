import { Injectable, Logger } from '@nestjs/common'

import { REDIS_KEYS } from '../redis/redis.constants'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name)
  constructor(private redis: RedisService) {}

  async domain({ domain, maxPerMinute = 6, expireSeconds = 60 }: DomainOptions) {
    const key = REDIS_KEYS.domainRateLimit(domain)

    const current = await this.redis.incr(key)
    if (current === 1) await this.redis.expire(key, expireSeconds)

    if (current > maxPerMinute) {
      this.logger.warn(`Rate limit exceeded for ${domain} (${current}/${maxPerMinute} per minute)`)
      return true
    }

    return false
  }
}

interface DomainOptions {
  domain: string
  maxPerMinute?: number
  expireSeconds?: number
}
