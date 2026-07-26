import z from 'zod'

import { ERROR_CODES, request, API_URL } from '@/shared/api'

export const linkTelegramResponseSchema = z.object({
  link: z.url(),
})
type LinkTelegramResponse = z.infer<typeof linkTelegramResponseSchema>

export async function linkTelegram(): Promise<LinkTelegramResponse> {
  const res = await request({
    url: API_URL.NOTIFICATION.LINK_TELEGRAM,
    method: 'POST',
    schema: linkTelegramResponseSchema,
    errorCode: ERROR_CODES.LINK_TELEGRAM,
    isProtected: true,
  })

  return res.data
}
