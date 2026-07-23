import { ERROR_CODES, request, API_URL } from '@/shared/api'

import {
  telegramMessageResponseSchema,
  type TelegramMessageResponse,
} from './dto/telegram-message-response.dto'

export async function unlinkTelegram(): Promise<TelegramMessageResponse> {
  const res = await request({
    url: API_URL.NOTIFICATION.UNLINK_TELEGRAM,
    method: 'POST',
    schema: telegramMessageResponseSchema,
    errorCode: ERROR_CODES.UNLINK_TELEGRAM,
    isProtected: true,
  })

  return res.data
}
