import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiExtraModels } from '@nestjs/swagger'

import { UserId } from '@/backend/shared/decorators/user-id.decorator'

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
  @UseGuards(AuthGuard('jwt'))
  async getOverview(
    @UserId() userId: string,
    @Param('monitorId') monitorId: string,
    @Query() query: AnalyticsOverviewQueryDto,
  ) {
    return await this.analyticsService.getOverview(userId, monitorId, query.days)
  }

  @AnalyticsDocs(getIncidentsDocs)
  @Get('/incidents/:monitorId')
  @UseGuards(AuthGuard('jwt'))
  async getIncidents(
    @UserId() userId: string,
    @Param('monitorId') monitorId: string,
    @Query() query: AnalyticsIncidentsQueryDto,
  ) {
    const startDate = this.getStartDate(query)

    return this.analyticsService.getIncidents(userId, monitorId, startDate)
  }

  @AnalyticsDocs(getTimelineDocs)
  @Get('/timeline/:monitorId')
  @UseGuards(AuthGuard('jwt'))
  async getTimeline(
    @UserId() userId: string,
    @Param('monitorId') monitorId: string,
    @Query() query: AnalyticsTimelineQueryDto,
  ) {
    const startDate = this.getStartDate(query)
    return await this.analyticsService.getTimeline(userId, monitorId, startDate)
  }

  private getStartDate(query: { days?: number }) {
    return new Date(Date.now() - (query.days || 7) * 24 * 60 * 60 * 1000)
  }
}
