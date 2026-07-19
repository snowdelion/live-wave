import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { BULL_NAMES } from '@/shared/bull/bull.constants'

import { NotificationProcessor } from './notification.processor'
import { TelegramService } from './telegram/telegram.service'

@Module({
  imports: [BullModule.registerQueue({ name: BULL_NAMES.NOTIFICATION })],
  providers: [NotificationProcessor, TelegramService],
})
export class NotificationModule {}
