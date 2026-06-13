import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiExtraModels } from '@nestjs/swagger'

import { ClientId } from '@/backend/shared/decorators/client-id.decorator'

import { getIncidentsDocs, getOverviewDocs, getTimelineDocs } from './analytics.docs'
import { AnalyticsService } from './analytics.service'
import { AnalyticsDocs } from './decorators/analytics-docs.decorator'
import { ANALYTICS_EXTRA_MODELS } from './dto/analytics-extra-models'
import { AnalyticsIncidentsQueryDto } from './dto/requests/analytics-incidents-query.dto'
import { AnalyticsOverviewQueryDto } from './dto/requests/analytics-overview-query.dto'
import { AnalyticsTimelineQueryDto } from './dto/requests/analytics-timeline-query.dto'

@ApiExtraModels(...ANALYTICS_EXTRA_MODELS)
@Controller('v1/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @AnalyticsDocs(getOverviewDocs)
  @Get(':monitorId')
  async getOverview(
    @ClientId() clientId: string,
    @Param('monitorId') monitorId: string,
    @Query() query: AnalyticsOverviewQueryDto,
  ) {
    return await this.analyticsService.getOverview(clientId, monitorId, query.days)
  }

  @AnalyticsDocs(getIncidentsDocs)
  @Get('/incidents/:monitorId')
  async getIncidents(
    @ClientId() clientId: string,
    @Param('monitorId') monitorId: string,
    @Query() query: AnalyticsIncidentsQueryDto,
  ) {
    const startDate = this.getStartDate(query)

    return this.analyticsService.getIncidents(clientId, monitorId, startDate)
  }

  @AnalyticsDocs(getTimelineDocs)
  @Get('/timeline/:monitorId')
  async getTimeline(
    @ClientId() clientId: string,
    @Param('monitorId') monitorId: string,
    @Query() query: AnalyticsTimelineQueryDto,
  ) {
    const startDate = this.getStartDate(query)
    return await this.analyticsService.getTimeline(clientId, monitorId, startDate)
  }

  private getStartDate(query: { days?: number }) {
    return new Date(Date.now() - (query.days || 7) * 24 * 60 * 60 * 1000)
  }
}
