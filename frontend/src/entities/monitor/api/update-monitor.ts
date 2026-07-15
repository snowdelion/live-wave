import { ERROR_CODES, request, API_URL } from '@/shared/api'

import { monitorResponseSchema, type MonitorResponse } from './dto/monitor-response.dto'
import {
  updateMonitorRequestSchema,
  type UpdateMonitorRequest,
} from './dto/update-monitor-request.dto'

export async function updateMonitor(
  monitorId: string,
  body: UpdateMonitorRequest,
): Promise<MonitorResponse> {
  const validatedBody = updateMonitorRequestSchema.parse(body)

  const res = await request({
    url: API_URL.MONITOR.UPDATE(monitorId),
    method: 'PATCH',
    schema: monitorResponseSchema,
    errorCode: ERROR_CODES.UPDATE_MONITOR,
    isProtected: true,
    json: validatedBody,
  })

  return res.data
}
