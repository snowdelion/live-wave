import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import { BULL_NAMES } from '@/backend/shared/bull/bull.constants'

import { TelegramService } from './telegram/telegram.service'

@Processor(BULL_NAMES.NOTIFICATION, { concurrency: 3 })
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name)
  constructor(private telegramService: TelegramService) {
    super()
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
      this.logger.error(
        `Failed to send Telegram message for monitor "${monitorName}" (${statusType})`,
      )
      throw new Error('Failed to send Telegram message')
    }
  }
}
