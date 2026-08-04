import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'

import { BULL_NAMES } from '@/shared/bull/bull.constants'

import { MonitorCheckModule } from '../monitor-check/monitor-check.module'

import { MonitorsController } from './monitors.controller'
import { MonitorsService } from './monitors.service'

@Module({
  imports: [MonitorCheckModule, BullModule.registerQueue({ name: BULL_NAMES.QUEUE })],
  providers: [MonitorsService],
  controllers: [MonitorsController],
})
export class MonitorsModule {}
