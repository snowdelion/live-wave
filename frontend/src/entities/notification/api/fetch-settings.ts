import z from 'zod'

import { ERROR_CODES, request, API_URL } from '@/shared/api'

export const settingsSchema = z.object({
  enabled: z.boolean(),
  hasChat: z.boolean(),
})
export type Settings = z.infer<typeof settingsSchema>

export async function fetchSettings(): Promise<Settings> {
  const res = await request({
    url: API_URL.NOTIFICATION.SETTINGS,
    schema: settingsSchema,
    errorCode: ERROR_CODES.GET_SETTINGS,
    isProtected: true,
  })

  return res.data
}
