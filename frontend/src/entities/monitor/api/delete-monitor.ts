import z from 'zod'

import { ERROR_CODES, request, API_URL, AppError } from '@/shared/api'

export async function deleteMonitor(monitorId: string): Promise<{ success: true }> {
  const res = await request({
    url: API_URL.MONITOR.DELETE(monitorId),
    method: 'DELETE',
    schema: z.null(),
    errorCode: ERROR_CODES.DELETE_MONITOR,
    isProtected: true,
  })

  if (res.status === 204 || res.status === 200) return { success: true }
  throw new AppError(ERROR_CODES.DELETE_MONITOR, 'Failed to delete monitor')
}
