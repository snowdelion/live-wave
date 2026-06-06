import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { BULL_NAMES } from '@/backend/shared/bull/bull.constants'

import { MonitorCheckModule } from '../monitor-check/monitor-check.module'

import { MonitorController } from './monitor.controller'
import { MonitorService } from './monitor.service'

@Module({
  imports: [MonitorCheckModule, BullModule.registerQueue({ name: BULL_NAMES.QUEUE })],
  providers: [MonitorService],
  controllers: [MonitorController],
})
export class MonitorModule {}
