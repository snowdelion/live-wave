import { AnalyticsIncidentsQueryDto } from '../dto/requests/analytics-incidents-query.dto'
import { AnalyticsOverviewQueryDto } from '../dto/requests/analytics-overview-query.dto'
import { AnalyticsTimelineQueryDto } from '../dto/requests/analytics-timeline-query.dto'
import { AnalyticsIncidentsResponseDto } from '../dto/responses/analytics-incidents-response.dto'
import { AnalyticsOverviewResponseDto } from '../dto/responses/analytics-overview-response.dto'
import { AnalyticsTimelineEntryDto } from '../dto/responses/analytics-timeline-response.dto'

export const ANALYTICS_EXTRA_MODELS = [
  AnalyticsOverviewResponseDto,
  AnalyticsIncidentsResponseDto,
  AnalyticsTimelineEntryDto,
  AnalyticsIncidentsQueryDto,
  AnalyticsOverviewQueryDto,
  AnalyticsTimelineQueryDto,
] as const
