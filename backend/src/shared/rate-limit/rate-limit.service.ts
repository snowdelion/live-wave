import { Injectable } from '@nestjs/common'

import { Logger } from '../logger/logger.service'
import { REDIS_KEYS } from '../redis/redis.constants'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class RateLimitService {
  constructor(
    private redis: RedisService,
    private logger: Logger,
  ) {}

  async domain({ domain, maxPerMinute = 6, expireSeconds = 60 }: DomainOptions) {
    const key = REDIS_KEYS.domainRateLimit(domain)

    const current = await this.redis.incr(key)
    if (current === 1) await this.redis.expire(key, expireSeconds)

    if (current > maxPerMinute) {
      this.logger.warn('Rate limit exceeded', { domain, current, maxPerMinute })
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
