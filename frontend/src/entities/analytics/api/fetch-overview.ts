import { ERROR_CODES, request, API_URL } from '@/shared/api'

import { analyticsOverviewSchema, type AnalyticsOverview } from './dto/analytics-overview.dto'

export async function fetchOverview(monitorId: string, days = 7): Promise<AnalyticsOverview> {
  const res = await request({
    url: API_URL.ANALYTICS.OVERVIEW(monitorId, days),
    schema: analyticsOverviewSchema,
    errorCode: ERROR_CODES.OVERVIEW_ANALYTICS,
    isProtected: true,
  })

  return res.data
}
