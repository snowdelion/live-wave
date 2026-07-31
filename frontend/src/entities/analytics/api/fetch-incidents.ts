import { ERROR_CODES, request, API_URL } from '@/shared/api'

import { analyticsIncidentsSchema, type AnalyticsIncidents } from './dto/analytics-incidents.dto'

export async function fetchIncidents(monitorId: string, days = 7): Promise<AnalyticsIncidents> {
  const res = await request({
    url: API_URL.ANALYTICS.INCIDENTS(monitorId, days),
    schema: analyticsIncidentsSchema,
    errorCode: ERROR_CODES.INCIDENTS_ANALYTICS,
    isProtected: true,
  })

  return res.data
}
