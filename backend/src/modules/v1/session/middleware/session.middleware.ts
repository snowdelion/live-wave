import { randomUUID } from 'crypto'

import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

import { SessionService } from '../session.service'

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private sessionService: SessionService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let clientId = req.cookies.clientId as string | undefined
    const ip = req.ip || req.socket.remoteAddress || 'unknown'

    if (!clientId) {
      clientId = randomUUID()
      await this.sessionService.createSession(clientId, ip)
      this.createCookie(res, clientId)
      req.clientId = clientId
      return next()
    }

    const session = await this.sessionService.getSession(clientId)
    if (!session) {
      clientId = randomUUID()
      await this.sessionService.createSession(clientId, ip)
      this.createCookie(res, clientId)
    } else {
      await this.sessionService.extendSession(clientId)
      this.createCookie(res, clientId)
    }

    req.clientId = clientId
    next()
  }

  private createCookie(res: Response, clientId: string) {
    res.cookie('clientId', clientId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })
  }
}
