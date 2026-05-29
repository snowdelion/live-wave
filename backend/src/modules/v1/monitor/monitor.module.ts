import { Module } from '@nestjs/common'

import { MonitorController } from './monitor.controller'
import { MonitorService } from './monitor.service'

@Module({
  providers: [MonitorService],
  controllers: [MonitorController],
})
export class MonitorModule {}
