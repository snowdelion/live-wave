import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request>()
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer '))
      throw new UnauthorizedException('Invalid Authorization header')

    const token = authHeader.split(' ')[1]
    const expectedToken = this.config.get<string>('METRICS_BEARER_TOKEN')
    if (!expectedToken || token !== expectedToken) throw new UnauthorizedException('Invalid token')

    return true
  }
}
