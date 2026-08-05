import { Module } from '@nestjs/common'

import { AnalyticsController } from './analytics.controller'
import { IncidentsService } from './incidents/incidents.service'
import { OverviewService } from './overview/overview.service'
import { TimelineService } from './timeline/timeline.service'

@Module({
  controllers: [AnalyticsController],
  providers: [OverviewService, TimelineService, IncidentsService],
})
export class AnalyticsModule {}
