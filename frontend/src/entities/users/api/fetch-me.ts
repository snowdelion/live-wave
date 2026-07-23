import { ERROR_CODES, request, API_URL } from '@/shared/api'

import { currentUserSchema, type CurrentUser } from './dto/current-user.dto'

export async function fetchMe(): Promise<CurrentUser> {
  const res = await request({
    url: API_URL.USERS.ME,
    schema: currentUserSchema,
    errorCode: ERROR_CODES.GET_USER,
    isProtected: true,
  })

  return res.data
}
