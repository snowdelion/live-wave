import { Injectable, Logger } from '@nestjs/common'

import { REDIS_KEYS } from '../redis/redis.constants'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name)
  constructor(private redis: RedisService) {}

  async checkRules(prefix: string, rules: readonly RateLimitRule[]) {
    const multi = this.redis.multi()
    const keys = rules.map(rule => `${prefix}:${rule.key}`)
    for (const key of keys) multi.incr(key)
    const results = await multi.exec()

    for (let i = 0; i < rules.length; i++) {
      const error = results?.[i][0]
      if (error) {
        this.logger.error(`Redis incr failed for key ${keys[i]}: ${error}`)
        return false
      }

      const newValue = Number(results?.[i][1])
      if (isNaN(newValue)) {
        this.logger.error(`Invalid numeric for a key ${keys[i]}: ${results?.[i][1]}`)
        return false
      }

      if (newValue === 1) await this.redis.expire(keys[i], rules[i].windowSeconds)
      if (newValue > rules[i].limit) return false
    }

    return true
  }

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

interface RateLimitRule {
  key: string
  limit: number
  windowSeconds: number
}

interface DomainOptions {
  domain: string
  maxPerMinute?: number
  expireSeconds?: number
}
