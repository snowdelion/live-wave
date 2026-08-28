import { API_URL } from '../../config/api-url'
import { AccessTokenResponseSchema } from '../../dto/access-token-response.dto'
import { useAuthStore } from '../auth.store'

export async function tryRefreshToken(): Promise<boolean> {
  const store = useAuthStore.getState()

  if (store.refreshPromise) return store.refreshPromise

  const promise = (async () => {
    try {
      const response = await fetch(API_URL.AUTH.REFRESH_TOKEN, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        store.clearAccessToken()
        window.location.href = '/auth'
        return false
      }

      const rawData: unknown = await response.json()
      const data = AccessTokenResponseSchema.parse(rawData)
      store.setAccessToken(data.accessToken)
      return true
    } catch {
      store.clearAccessToken()
      window.location.href = '/auth'
      return false
    }
  })()

  store.refreshPromise = promise
  return promise
}
