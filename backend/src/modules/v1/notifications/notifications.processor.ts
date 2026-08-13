import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'

import { BULL_NAMES } from '@/shared/bull/bull.constants'
import { Logger } from '@/shared/logger/logger.service'

import { TelegramService } from './telegram/telegram.service'

@Processor(BULL_NAMES.NOTIFICATIONS, { concurrency: 3 })
export class NotificationsProcessor extends WorkerHost {
  private logger: Logger
  constructor(
    private telegramService: TelegramService,
    baseLogger: Logger,
  ) {
    super()
    this.logger = baseLogger.child({ context: NotificationsProcessor.name })
  }

  async process(
    job: Job<{
      chatId: string
      message: string
      statusType: string
      monitorName: string
    }>,
  ) {
    const { chatId, message, statusType, monitorName } = job.data
    const success = await this.telegramService.sendMessage(chatId, message)
    if (!success) {
      this.logger.error('Failed to send Telegram message', {
        monitorName,
        statusType,
        chatId,
        jobId: job.id,
      })
      throw new Error('Failed to send Telegram message')
    }
    this.logger.debug('Telegram message sent', { monitorName, statusType, chatId, jobId: job.id })
  }
}
