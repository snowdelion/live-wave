import {
  AccessTokenResponseSchema,
  API_URL,
  ERROR_CODES,
  request,
  useAuthStore,
  type AccessTokenResponse,
} from '@/shared/api'

import { AuthViaEmailRequestSchema, type AuthViaEmailRequest } from './dto/auth-via-email.dto'

export async function signUpViaEmail(body: AuthViaEmailRequest): Promise<AccessTokenResponse> {
  const validateBody = AuthViaEmailRequestSchema.parse(body)

  const res = await request({
    url: API_URL.AUTH.SIGN_UP_EMAIL,
    method: 'POST',
    json: validateBody,
    schema: AccessTokenResponseSchema,
    errorCode: ERROR_CODES.SIGN_UP_EMAIL,
  })

  useAuthStore.getState().setAccessToken(res.data.accessToken)
  return res.data
}
