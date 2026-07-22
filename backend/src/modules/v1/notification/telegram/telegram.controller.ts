import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { seconds, Throttle } from '@nestjs/throttler'

import { UserId } from '@/shared/decorators/user-id.decorator'

import { TelegramDocs } from './decorators/telegram-docs.decorator'
import { TelegramWithChatIdDto } from './dto/telegram-with-chat-id.dto'
import {
  linkTelegramDocs,
  settingsTelegramDocs,
  toggleAlertTelegramDocs,
  unlinkTelegramDocs,
} from './telegram.docs'
import { TelegramService } from './telegram.service'

@Controller('v1/notification/telegram')
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  @Post('link-chat')
  @TelegramDocs(linkTelegramDocs)
  @Throttle({ short: { ttl: seconds(60), limit: 20 } })
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'))
  async linkChatId(@UserId() userId: string, @Body() dto: TelegramWithChatIdDto) {
    await this.telegramService.linkChatId(userId, dto.chatId)
    return { message: 'You have subscribed for Telegram notifications' }
  }

  @Post('unlink-chat')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ short: { ttl: seconds(60), limit: 20 } })
  @TelegramDocs(unlinkTelegramDocs)
  async unlinkChatId(@UserId() userId: string) {
    await this.telegramService.unlinkChatId(userId)
    return { message: 'You have unsubscribed from Telegram notifications' }
  }

  @Patch('toggle-alert')
  @Throttle({ short: { ttl: seconds(60), limit: 20 } })
  @UseGuards(AuthGuard('jwt'))
  @TelegramDocs(toggleAlertTelegramDocs)
  async toggleAlert(@UserId() userId: string) {
    const enabled = await this.telegramService.toggleAlert(userId)
    return {
      enabled,
      message: `You have ${enabled ? 'enabled' : 'disabled'} Telegram notifications`,
    }
  }

  @Get('settings')
  @UseGuards(AuthGuard('jwt'))
  @TelegramDocs(settingsTelegramDocs)
  async getSettings(@UserId() userId: string) {
    const { enabled, hasChat } = await this.telegramService.getAlertStatus(userId)
    return { enabled, hasChat }
  }
}
