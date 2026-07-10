import {
  AccessTokenResponseSchema,
  API_URL,
  ERROR_CODES,
  request,
  useAuthStore,
  type AccessTokenResponse,
} from '@/shared/api'

import {
  AuthViaTelegramRequestSchema,
  type AuthViaTelegramRequest,
} from './dto/auth-via-telegram.dto'

export async function signInViaTelegram(
  body: AuthViaTelegramRequest,
): Promise<AccessTokenResponse> {
  const validateBody = AuthViaTelegramRequestSchema.parse(body)

  const res = await request({
    url: API_URL.AUTH.SIGN_IN_TELEGRAM,
    method: 'POST',
    json: validateBody,
    schema: AccessTokenResponseSchema,
    errorCode: ERROR_CODES.SIGN_IN_TELEGRAM,
  })

  useAuthStore.getState().setAccessToken(res.data.accessToken)
  return res.data
}
