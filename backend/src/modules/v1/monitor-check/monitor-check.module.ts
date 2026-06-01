import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'

import { BullShutdownService } from '@/backend/shared/bull/bull-shutdown.service'
import { BULL_NAMES } from '@/backend/shared/bull/bull.constants'

import { MonitorCheckProcessor } from './monitor-check.processor'
import { MonitorCheckService } from './monitor-check.service'

@Module({
  imports: [BullModule.registerQueue({ name: BULL_NAMES.QUEUE })],
  providers: [MonitorCheckService, MonitorCheckProcessor, BullShutdownService],
  exports: [MonitorCheckService],
})
export class MonitorCheckModule {}
