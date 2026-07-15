import { ERROR_CODES, request, API_URL } from '@/shared/api'

import { detailedMonitorSchema, type DetailedMonitor } from './dto/detailed-monitor.dto'

export async function fetchDetailedMonitor(monitorId: string): Promise<DetailedMonitor> {
  const res = await request({
    url: API_URL.MONITOR.BY_ID(monitorId),
    schema: detailedMonitorSchema,
    errorCode: ERROR_CODES.DETAILED_MONITOR,
    isProtected: true,
  })

  return res.data
}
