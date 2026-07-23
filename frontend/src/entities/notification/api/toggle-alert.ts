import z from 'zod'

import { ERROR_CODES, request, API_URL } from '@/shared/api'

import { telegramMessageResponseSchema } from './dto/telegram-message-response.dto'

export const toggleAlertResponseSchema = telegramMessageResponseSchema.extend({
  enabled: z.boolean(),
})
type ToggleAlertResponse = z.infer<typeof toggleAlertResponseSchema>

export async function toggleAlert(): Promise<ToggleAlertResponse> {
  const res = await request({
    url: API_URL.NOTIFICATION.TOGGLE_ALERT,
    method: 'PATCH',
    schema: toggleAlertResponseSchema,
    errorCode: ERROR_CODES.TOGGLE_ALERT,
    isProtected: true,
  })

  return res.data
}
