import { createParamDecorator, UnauthorizedException, type ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'

export const ClientId = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req: Request = ctx.switchToHttp().getRequest()
  const clientId = req.clientId

  if (!clientId) throw new UnauthorizedException('No active session')
  return clientId
})
