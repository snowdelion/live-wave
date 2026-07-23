import z from 'zod'

import { ERROR_CODES, request, API_URL, AppError } from '@/shared/api'

export async function deleteMe(): Promise<{ success: true }> {
  const res = await request({
    url: API_URL.USERS.DELETE,
    schema: z.null(),
    method: 'DELETE',
    errorCode: ERROR_CODES.DELETE_USER,
    isProtected: true,
  })

  if (res.status === 200 || res.status === 204) return { success: true }
  throw new AppError(ERROR_CODES.DELETE_USER, 'Failed to delete user')
}
