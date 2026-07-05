import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'

export const Cookies = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<Request>()
  const cookies = (req.cookies ?? {}) as Record<string, string | undefined>

  return data ? cookies[data] : cookies
})
