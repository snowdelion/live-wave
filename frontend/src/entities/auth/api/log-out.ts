import z from 'zod'

import { ERROR_CODES, request, API_URL, useAuthStore } from '@/shared/api'

export async function logout(): Promise<{ success: true }> {
  await request({
    url: API_URL.AUTH.LOGOUT,
    method: 'POST',
    schema: z.null(),
    errorCode: ERROR_CODES.LOGOUT,
    isProtected: true,
  })

  useAuthStore.getState().clearAccessToken()
  return { success: true }
}
