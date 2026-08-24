import { Injectable } from '@nestjs/common'
import { StatusEnum } from '@prisma/client'

import { Logger } from '@/shared/logger/logger.service'
import { getErrorMessage } from '@/shared/utils/error.utils'

import { TelegramService } from '../notifications/telegram/telegram.service'

@Injectable()
export class MonitorCheckService {
  private logger: Logger
  private readonly sentNotificationsMap = new Map<string, number>()
  private readonly TTL_MS = 5 * 60 * 1000
  constructor(
    private telegramService: TelegramService,
    baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: MonitorCheckService.name })
  }

  async scheduleNotification({
    chatId,
    monitorId,
    message,
    statusType,
  }: {
    chatId: string
    monitorId: string
    message: string
    statusType: StatusEnum
  }) {
    const key = `${chatId}:${monitorId}:${statusType}`
    const lastSent = this.sentNotificationsMap.get(key)
    const now = Date.now()
    if (lastSent && now - lastSent < this.TTL_MS) {
      this.logger.debug('Notification deduplicated, skipping', {
        monitorId,
        chatId,
        statusType,
        lastSent: new Date(lastSent).toISOString(),
      })
      return
    }

    try {
      await this.sendWithRetry(chatId, message, 3)
      this.sentNotificationsMap.set(key, now)
      this.cleanupCache()
      this.logger.debug('Notification sent', { monitorId, chatId })
    } catch (e) {
      this.logger.error('Failed to send notification after retries', {
        monitorId,
        error: getErrorMessage(e, String(e)),
      })
    }
  }

  private async sendWithRetry(chatId: string, message: string, maxAttempts: number) {
    let error: Error | null = null
    for (let att = 1; att <= maxAttempts; att++)
      try {
        await this.telegramService.sendMessage(chatId, message)
        return
      } catch (e) {
        error = e as Error
        this.logger.warn('Notification attempt failed', {
          currentAttempt: att,
          maxAttempts,
          chatId,
          error: getErrorMessage(e, String(e)),
        })
        if (att < maxAttempts) await new Promise(res => setTimeout(res, Math.pow(2, att) * 1000))
      }
    throw error
  }

  private cleanupCache() {
    if (this.sentNotificationsMap.size > 100) {
      const now = Date.now()
      for (const [key, timestamp] of this.sentNotificationsMap.entries())
        if (now - timestamp > this.TTL_MS) this.sentNotificationsMap.delete(key)
    }
  }
}
