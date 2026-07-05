import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'

export const UserId = createParamDecorator((_, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<Request>()
  const user = req.user
  if (!user || !user.userId) throw new UnauthorizedException('User not found in request')
  return user.userId
})
