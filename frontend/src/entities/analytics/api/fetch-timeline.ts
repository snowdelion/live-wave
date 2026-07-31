import { ERROR_CODES, request, API_URL } from '@/shared/api'

import { analyticsTimelineSchema, type AnalyticsTimeline } from './dto/analytics-timeline.dto'

export async function fetchTimeline(monitorId: string, days = 7): Promise<AnalyticsTimeline> {
  const res = await request({
    url: API_URL.ANALYTICS.TIMELINE(monitorId, days),
    schema: analyticsTimelineSchema,
    errorCode: ERROR_CODES.TIMELINE_ANALYTICS,
    isProtected: true,
  })

  return res.data
}
