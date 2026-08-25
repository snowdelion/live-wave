import { Module } from '@nestjs/common'

import { MonitorCheckModule } from '../monitor-check/monitor-check.module'

import { MonitorsController } from './monitors.controller'
import { MonitorsService } from './monitors.service'

@Module({
  imports: [MonitorCheckModule],
  providers: [MonitorsService],
  controllers: [MonitorsController],
})
export class MonitorsModule {}
