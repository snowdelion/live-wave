import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common'

import { ClientId } from '@/backend/shared/decorators/client-id.decorator'

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
  @HttpCode(HttpStatus.CREATED)
  async linkChatId(@ClientId() clientId: string, @Body() dto: TelegramWithChatIdDto) {
    await this.telegramService.linkChatId(clientId, dto.chatId)
    return { message: 'You have subscribed for Telegram notifications' }
  }

  @Post('unlink-chat')
  @TelegramDocs(unlinkTelegramDocs)
  async unlinkChatId(@ClientId() clientId: string) {
    await this.telegramService.unlinkChatId(clientId)
    return { message: 'You have unsubscribed from Telegram notifications' }
  }

  @Patch('toggle-alert')
  @TelegramDocs(toggleAlertTelegramDocs)
  async toggleAlert(@ClientId() clientId: string) {
    const enabled = await this.telegramService.toggleAlert(clientId)
    return {
      enabled,
      message: `You have ${enabled ? 'enabled' : 'disabled'} Telegram notifications`,
    }
  }

  @Get('settings')
  @TelegramDocs(settingsTelegramDocs)
  async getSettings(@ClientId() clientId: string) {
    const { enabled, hasChat } = await this.telegramService.getAlertStatus(clientId)
    return { enabled, hasChat }
  }
}
