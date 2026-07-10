import {
  AccessTokenResponseSchema,
  API_URL,
  ERROR_CODES,
  request,
  type AccessTokenResponse,
} from '@/shared/api'

export async function refreshToken(): Promise<AccessTokenResponse> {
  const res = await request({
    url: API_URL.AUTH.REFRESH_TOKEN,
    method: 'POST',
    schema: AccessTokenResponseSchema,
    errorCode: ERROR_CODES.REFRESH_TOKEN,
  })

  return res.data
}
