import { ERROR_CODES, request, API_URL } from '@/shared/api'

import {
  createMonitorRequestSchema,
  type CreateMonitorRequest,
} from './dto/create-monitor-request.dto'
import { createMonitorResponseSchema, type CreateMonitorResponse } from './dto/monitor-response.dto'

export async function createMonitor(body: CreateMonitorRequest): Promise<CreateMonitorResponse> {
  const validatedBody = createMonitorRequestSchema.parse(body)

  const res = await request({
    url: API_URL.MONITORS.CREATE,
    method: 'POST',
    schema: createMonitorResponseSchema,
    errorCode: ERROR_CODES.CREATE_MONITOR,
    isProtected: true,
    json: validatedBody,
  })

  return res.data
}
