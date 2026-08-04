import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { BULL_NAMES } from '@/shared/bull/bull.constants'

import { NotificationsProcessor } from './notifications.processor'
import { TelegramService } from './telegram/telegram.service'

@Module({
  imports: [BullModule.registerQueue({ name: BULL_NAMES.NOTIFICATIONS })],
  providers: [NotificationsProcessor, TelegramService],
})
export class NotificationsModule {}
