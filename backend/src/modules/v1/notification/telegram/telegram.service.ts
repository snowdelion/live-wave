import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PrismaService } from '@/backend/shared/prisma/prisma.service'
import { logAndThrow } from '@/backend/shared/utils/error.utils'

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name)
  private readonly botToken?: string
  private readonly baseUrl?: string

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN')
    if (!this.botToken) this.logger.warn(`TELEGRAM_BOT_TOKEN is not set`)
    else this.baseUrl = `https://api.telegram.org/bot${this.botToken}`
  }

  async linkChatId(clientId: string, chatId: string) {
    const linkMessage =
      'You have successfully linked Telegram! Notifications will arrive when your monitor status changes (up/down)'
    const canSend = await this.sendMessage(chatId, linkMessage)
    if (!canSend)
      throw new Error(
        'The bot can\'t send you a message. Send the "@live_wave_bot" bot any message (e.g., /start), and then try binding again.',
      )

    return await this.prisma.alert.upsert({
      where: { clientId },
      update: { telegramChatId: chatId, enabled: true },
      create: { clientId, telegramChatId: chatId, enabled: true },
    })
  }

  async unlinkChatId(clientId: string) {
    await this.prisma.alert.deleteMany({ where: { clientId } })
  }

  async toggleAlert(clientId: string) {
    try {
      const oldAlert = await this.prisma.alert.findUnique({
        where: { clientId },
        select: { enabled: true, telegramChatId: true },
      })
      if (!oldAlert?.telegramChatId) throw new NotFoundException('No alert found')
      const newEnabled = !oldAlert.enabled

      const updatedAlert = await this.prisma.alert.update({
        where: { clientId },
        data: { enabled: newEnabled },
        select: { enabled: true },
      })

      const message = updatedAlert.enabled
        ? 'You have enabled notifications. You will receive notifications when your monitor status changes (up/down)'
        : 'You have disabled notifications. You will no longer receive notifications'

      const canSend = await this.sendMessage(oldAlert.telegramChatId, message)
      if (!canSend) this.logger.warn(`Failed to send Telegram message on toggle alert`)

      return updatedAlert.enabled
    } catch (e) {
      throw logAndThrow({
        name: TelegramService.name,
        context: `toggle alert for ${clientId}`,
        e,
        exception: Error,
        exceptionContext: 'No active Telegram alert link found',
        loggerType: 'warn',
      })
    }
  }

  async sendMessage(chatId: string, text: string, retries = 3): Promise<boolean> {
    if (!this.botToken || !chatId || !this.baseUrl) {
      this.logger.warn(`Cannot send Telegram message: bot token or chat ID missing`)
      return false
    }

    for (let att = 1; att <= retries; att++) {
      try {
        const res = await fetch(`${this.baseUrl}/sendMessage`, {
          method: 'POST',
          headers: {
            'User-Agent': 'LiveWave-Uptime-Monitor/1.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
          }),
        })
        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Telegram API error: ${res.status} ${errorText}`)
        }

        this.logger.debug(`Telegram message sent successfully to ${chatId}`)
        return true
      } catch (e) {
        logAndThrow({
          name: TelegramService.name,
          context: `send Telegram message (attempt ${att}/${retries})`,
          e,
          shouldThrow: false,
        })
        if (att === retries) return false
        await new Promise(resolve => setTimeout(resolve, att * 1000))
      }
    }
    return false
  }
}
