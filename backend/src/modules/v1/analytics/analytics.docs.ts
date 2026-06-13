import { AnalyticsIncidentsResponseDto } from './dto/responses/analytics-incidents-response.dto'
import { AnalyticsOverviewResponseDto } from './dto/responses/analytics-overview-response.dto'
import { AnalyticsTimelineEntryDto } from './dto/responses/analytics-timeline-response.dto'

export const getOverviewDocs = {
  summary: 'Get aggregated analytics for a monitor',
  description:
    'Returns uptime percentage, average response time, total checks, and daily stats (uptime, average response time, incident count) for the specified number of days (default 7)',
  okResponseType: AnalyticsOverviewResponseDto,
}

export const getIncidentsDocs = {
  summary: 'List downtime incidents for a monitor',
  description:
    'Returns incidents with start time, end time, cause and duration. Filter by date range using `startDate` or relative `days`',
  okResponseType: AnalyticsIncidentsResponseDto,
}

export const getTimelineDocs = {
  summary: 'Get timeline data for charting',
  description:
    'Returns aggregated check counts (up/down) and average response time grouped into time buckets. Bucket size is auto-adjusted to keep ~100 points. Use `days` or `startDate` to set the period',
  okResponseType: [AnalyticsTimelineEntryDto],
}
