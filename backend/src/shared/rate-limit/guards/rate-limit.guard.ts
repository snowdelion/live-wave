import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import type { Request } from 'express'

import { RATE_LIMIT_RULES } from '../rate-limit.constants'
import { RateLimitService } from '../rate-limit.service'

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext) {
    const req: Request = context.switchToHttp().getRequest()
    const ip = req.ip || req.socket.remoteAddress || 'unknown'

    const prefix = `live-wave:rate-limit:create-monitor:${ip}`

    const rules = RATE_LIMIT_RULES.CREATE_MONITOR
    const isAllowed = await this.rateLimitService.checkRules(prefix, rules)
    if (!isAllowed) throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS)

    return true
  }
}
