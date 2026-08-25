import { randomBytes } from 'crypto'

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { REDIS_KEYS } from '@/shared/redis/redis.constants'
import { RedisService } from '@/shared/redis/redis.service'
import { logAndThrow } from '@/shared/utils/error.utils'

import { TelegramApiResponse, WebhookInfo } from './dto/telegram-api-response.dto'
import { TelegramWebhookDto } from './dto/telegram-webhook.dto'

@Injectable()
export class TelegramService implements OnApplicationBootstrap {
  private readonly botToken?: string
  private readonly botUsername?: string
  private readonly baseUrl?: string
  private readonly webhookUrl?: string
  private logger: Logger
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private redis: RedisService,
    baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: TelegramService.name })

    this.webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL')
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN')
    this.botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME')

    if (!this.botUsername) this.logger.warn('TELEGRAM_BOT_USERNAME is not set')
    if (!this.botToken) this.logger.warn(`TELEGRAM_BOT_TOKEN is not set`)
    else this.baseUrl = `https://api.telegram.org/bot${this.botToken}`
  }

  async linkChatId(userId: string) {
    if (!this.botUsername || !this.botToken) {
      this.logger.error('Telegram bot token or bot username not set', {
        userId,
        hasBotUsername: !!this.botUsername,
        hasBotToken: !!this.botToken,
      })
      throw new BadRequestException('Telegram bot token or bot username not set')
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true, email: true },
    })
    if (existing?.telegramId) {
      this.logger.warn('User tried link Telegram when already linked', {
        userId,
        telegramId: existing.telegramId,
      })
      throw new BadRequestException('Telegram already linked')
    }

    const token = randomBytes(32).toString('hex')
    const key = REDIS_KEYS.telegramToken(token)
    await this.redis.set(key, userId, 300)
    return `https://t.me/${this.botUsername}?start=${token}`
  }

  async handleWebhook(update: TelegramWebhookDto) {
    this.logger.debug('Started "handleWebhook"', { updateId: update.update_id })
    const message = update?.message
    if (!message?.text) return

    const text = message.text.trim()
    if (!text.startsWith('/start')) return

    const chatId = String(message?.chat?.id)

    const token = text.replace('/start', '').trim()
    if (!token) {
      this.logger.warn('Invalid Telegram link', { chatId })
      await this.sendMessage(chatId, 'Invalid link')
      return
    }

    const key = REDIS_KEYS.telegramToken(token)
    const userId = await this.redis.get(key)
    if (!userId) {
      this.logger.warn('Link is outdated or used', { chatId })
      await this.sendMessage(chatId, 'Link is outdated or used')
      return
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { telegramId: chatId },
      select: { id: true },
    })

    if (existingUser && existingUser.id !== userId) {
      this.logger.warn('User tried to link already linked Telegram account', {
        currentUser: userId,
        anotherUser: existingUser.id,
      })
      await this.sendMessage(chatId, 'This Telegram account is already linked to another user')
      return
    }

    await this.prisma.alert.upsert({
      where: { userId },
      update: { telegramChatId: chatId, enabled: true },
      create: { userId, telegramChatId: chatId, enabled: true },
    })

    await this.redis.del(key)
    await this.sendMessage(
      chatId,
      "Telegram is linked successfully! You'll get notifications when monitor status changes (up/down)",
    )
    this.logger.log('User linked Telegram chat', { userId, chatId })
  }

  async onApplicationBootstrap() {
    if (!this.botToken || !this.webhookUrl) {
      this.logger.error('Telegram bot token or webhook URL not set', {
        hasWebhookUrl: !!this.webhookUrl,
        hasBotToken: !!this.botToken,
      })
      return
    }

    const currentInfo = await this.getWebhookInfo()
    if (currentInfo?.url === this.webhookUrl) {
      this.logger.warn('Webhook already set to the correct URL')
      return
    }

    try {
      const success = await this.setWebhook(this.webhookUrl)
      if (!success) this.logger.warn('Failed to set webhook')
    } catch (e) {
      logAndThrow({
        logger: this.logger,
        context: 'set webhook',
        e,
        shouldThrow: false,
      })
    }
  }

  async setWebhook(url: string) {
    const res = await fetch(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const data = (await res.json()) as TelegramApiResponse<boolean>

    if (!data.ok) {
      this.logger.error('Failed to set webhook', {
        error: data.description,
        errorCode: data.error_code,
      })
      return false
    }

    this.logger.log('Webhook set', { description: data.description })
    return true
  }

  private async getWebhookInfo(): Promise<WebhookInfo | null> {
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/getWebhookInfo`)
      const data = (await res.json()) as TelegramApiResponse<WebhookInfo>
      if (!data.ok) {
        this.logger.warn('Failed to get webhook info', {
          error: data.description,
          code: data.error_code,
        })
        return null
      }

      return data.result ?? null
    } catch {
      return null
    }
  }

  async unlinkChatId(userId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true, email: true },
    })
    if (existingUser?.telegramId && !existingUser.email) {
      this.logger.warn('User tried unlink Telegram without email', {
        userId,
        telegramId: existingUser.telegramId,
      })
      throw new ForbiddenException(
        "You cannot unlink Telegram because you don't have an email associated with your account",
      )
    }

    await this.prisma.alert.upsert({
      where: { userId },
      update: { telegramChatId: null, enabled: false },
      create: { userId, telegramChatId: null, enabled: false },
    })
    this.logger.log('Telegram has been unlinked', { userId, telegramId: existingUser?.telegramId })
  }

  async toggleAlert(userId: string) {
    try {
      const oldAlert = await this.prisma.alert.findUnique({
        where: { userId },
        select: { enabled: true, telegramChatId: true },
      })
      if (!oldAlert?.telegramChatId) {
        this.logger.warn('Tried to toggle alert without linked Telegram', { userId })
        throw new NotFoundException('Telegram chat is not linked. Link your chat first')
      }
      const newEnabled = !oldAlert.enabled

      const updatedAlert = await this.prisma.alert.update({
        where: { userId },
        data: { enabled: newEnabled },
        select: { enabled: true },
      })

      const message = updatedAlert.enabled
        ? 'You have enabled notifications. You will receive notifications when your monitor status changes (up/down)'
        : 'You have disabled notifications. You will no longer receive notifications'

      const canSend = await this.sendMessage(oldAlert.telegramChatId, message)
      if (!canSend)
        this.logger.warn('Failed to send Telegram message on toggle alert', {
          userId,
          telegramId: oldAlert.telegramChatId,
        })

      this.logger.log('Changed alert notification settings', { userId, enabled: newEnabled })
      return updatedAlert.enabled
    } catch (e) {
      throw logAndThrow({
        logger: this.logger,
        context: `toggle alert for ${userId}`,
        e,
        exception: Error,
        exceptionContext: 'No active Telegram alert link found',
        loggerType: 'warn',
      })
    }
  }

  async sendMessage(chatId: string, text: string, retries = 3): Promise<boolean> {
    if (!this.botToken || !chatId || !this.baseUrl) {
      this.logger.warn("Can't send Telegram message: bot token or chat ID missing", {
        chatId,
        hasBotToken: !!this.botToken,
        hasBaseUrl: !!this.baseUrl,
      })
      return false
    }

    for (let att = 1; att <= retries; att++) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort, 5000)

      try {
        const res = await fetch(`${this.baseUrl}/sendMessage`, {
          method: 'POST',
          signal: controller.signal,
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
          this.logger.error('Telegram API error', {
            chatId,
            statusCode: res.status,
            message: errorText,
          })
          throw new Error(`Telegram API error: ${res.status} ${errorText}`)
        }

        this.logger.log('Telegram message sent', { chatId })
        return true
      } catch (e) {
        logAndThrow({
          logger: this.logger,
          context: `send Telegram message (attempt ${att}/${retries})`,
          e,
          shouldThrow: false,
        })
        if (att === retries) return false
        await new Promise(resolve => setTimeout(resolve, att * 1000))
      } finally {
        clearTimeout(timeout)
      }
    }
    return false
  }

  async getAlertStatus(userId: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { userId },
      select: { enabled: true, telegramChatId: true },
    })

    if (!alert) {
      this.logger.debug('There is no alert, creating new', { userId })
      const newAlert = await this.prisma.alert.create({
        data: { userId, enabled: false },
        select: { enabled: true },
      })
      return { enabled: newAlert.enabled, hasChat: false }
    }

    return { enabled: alert.enabled, hasChat: !!alert.telegramChatId }
  }
}
