import { ERROR_CODES, request, API_URL } from '@/shared/api'

import { userMonitorsSchema, type UserMonitors } from './dto/user-monitors.dto'

export async function fetchMonitors(): Promise<UserMonitors> {
  const res = await request({
    url: API_URL.MONITOR.ALL,
    schema: userMonitorsSchema,
    errorCode: ERROR_CODES.USER_MONITORS,
    isProtected: true,
  })

  return res.data
}
