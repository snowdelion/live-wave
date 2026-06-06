import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { BullShutdownService } from '@/backend/shared/bull/bull-shutdown.service'
import { BULL_NAMES } from '@/backend/shared/bull/bull.constants'

import { MonitorCheckProcessor } from './monitor-check.processor'
import { MonitorCheckService } from './monitor-check.service'
import { HttpStrategy } from './strategies/http-check.strategy'

@Module({
  imports: [BullModule.registerQueue({ name: BULL_NAMES.QUEUE })],
  providers: [MonitorCheckService, MonitorCheckProcessor, BullShutdownService, HttpStrategy],
  exports: [MonitorCheckService],
})
export class MonitorCheckModule {}
