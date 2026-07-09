import {
  AccessTokenResponseSchema,
  API_URL,
  ERROR_CODES,
  request,
  useAuthStore,
  type AccessTokenResponse,
} from '@/shared/api'

export async function refreshToken(): Promise<AccessTokenResponse> {
  const res = await request({
    url: API_URL.AUTH.REFRESH_TOKEN,
    method: 'POST',
    schema: AccessTokenResponseSchema,
    errorCode: ERROR_CODES.REFRESH_TOKEN,
  })

  useAuthStore.getState().setAccessToken(res.data.accessToken)
  return res.data
}
