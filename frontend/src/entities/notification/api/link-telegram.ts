import { ERROR_CODES, request, API_URL } from '@/shared/api'

import { linkTelegramBodySchema, type LinkTelegramBody } from './dto/link-telegram.dto'
import {
  telegramMessageResponseSchema,
  type TelegramMessageResponse,
} from './dto/telegram-message-response.dto'

export async function linkTelegram(body: LinkTelegramBody): Promise<TelegramMessageResponse> {
  const validatedBody = linkTelegramBodySchema.parse(body)

  const res = await request({
    url: API_URL.NOTIFICATION.LINK_TELEGRAM,
    method: 'POST',
    schema: telegramMessageResponseSchema,
    errorCode: ERROR_CODES.LINK_TELEGRAM,
    isProtected: true,
    json: validatedBody,
  })

  return res.data
}
