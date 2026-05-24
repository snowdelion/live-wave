import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request, Response } from 'express'

import { SessionDocs } from './decorators/session-docs.decorator'
import { CurrentSessionDto } from './dto/current-session.dto'
import { ExtendSessionDto } from './dto/extend-session.dto'
import { UpdateNotificationsDto } from './dto/update-notifications.dto'
import { SessionService } from './session.service'

@Controller('v1/session')
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @Get('me')
  @SessionDocs({
    summary: 'Get current session info',
    description: 'Returns current session existence flag, services count and telegram link status',
    responseType: CurrentSessionDto,
  })
  async getSession(@Req() req: Request) {
    const clientId = (req.clientId || req.cookies.clientId) as string | undefined
    if (!clientId) return { exists: false }

    const session = await this.sessionService.getSession(clientId)
    if (!session) return { exists: false }

    return {
      exists: true,
      servicesCount: session.servicesCount ?? 0,
      telegramLinked: !!session.telegramChatId,
    }
  }

  @Post('extend')
  @SessionDocs({
    summary: 'Extend the expiration date of the current session cookie',
    description: 'When the user interacts, the session is automatically extended',
    responseType: ExtendSessionDto,
  })
  async extendSession(@Req() req: Request) {
    const clientId = req.cookies.clientId as string | undefined
    if (!clientId) throw new UnauthorizedException('No active session')

    await this.sessionService.extendSession(clientId)
    return { extended: true }
  }

  @Delete('me')
  @SessionDocs({
    statusCode: HttpStatus.NO_CONTENT,
    summary: 'Delete the current session',
    description: 'Delete all cookies, services, checks, redis keys',
  })
  async deleteSession(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const clientId = req.cookies.clientId as string | undefined
    if (clientId) await this.sessionService.deleteSession(clientId)

    res.clearCookie('clientId', { path: '/' })
  }

  @Patch('notifications')
  @SessionDocs({
    summary: 'Change notifications settings for current session',
    description:
      'Returns "notifyTelegram". If true, user will receive norifications from telegram bot',
    responseType: UpdateNotificationsDto,
  })
  async updateNotifications(@Req() req: Request, @Body() body: UpdateNotificationsDto) {
    const clientId = req.cookies.clientId as string | undefined
    if (!clientId) throw new UnauthorizedException('No active session')

    const session = await this.sessionService.updateNotificationSettings(
      clientId,
      body.notifyTelegram,
    )

    return { notifyTelegram: session.notifyTelegram }
  }
}
