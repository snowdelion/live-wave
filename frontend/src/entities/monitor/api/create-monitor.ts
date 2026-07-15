import { ERROR_CODES, request, API_URL } from '@/shared/api'

import {
  createMonitorRequestSchema,
  type CreateMonitorRequest,
} from './dto/create-monitor-request.dto'
import { monitorResponseSchema, type MonitorResponse } from './dto/monitor-response.dto'

export async function createMonitor(body: CreateMonitorRequest): Promise<MonitorResponse> {
  const validatedBody = createMonitorRequestSchema.parse(body)

  const res = await request({
    url: API_URL.MONITOR.CREATE,
    method: 'POST',
    schema: monitorResponseSchema,
    errorCode: ERROR_CODES.CREATE_MONITOR,
    isProtected: true,
    json: validatedBody,
  })

  return res.data
}
