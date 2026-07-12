import type { ZodType } from 'zod'

import { API_URL } from '../config/api-url'
import { AppError } from '../config/app-error'
import { ERROR_CODES, type ErrorCode } from '../config/error-codes'
import { AccessTokenResponseSchema } from '../dto/access-token-response.dto'

import { useAuthStore } from './auth.store'
import { handleApiError, throwResponseErrors } from './error-handler'

export async function request<T>({
  url,
  timeout = 8000,
  schema,
  errorCode,
  signal,
  body,
  json,
  method = 'GET',
  fetchInit = {},
  isProtected = false,
  retries = 1,
}: RequestProps<T>): Promise<{ data: T; status: number }> {
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), timeout)
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal

  const restFetchInit = { ...fetchInit }
  const mergedHeaders = new Headers(fetchInit.headers)
  delete restFetchInit.signal

  let finalBody: BodyInit | null = null
  if (json) {
    mergedHeaders.set('Content-Type', 'application/json')
    finalBody = JSON.stringify(json)
  } else if (body) finalBody = body

  if (isProtected) {
    const accessToken = useAuthStore.getState().accessToken
    mergedHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  async function execute(att: number): Promise<{ data: T; status: number }> {
    try {
      const response = await fetch(url, {
        ...restFetchInit,
        method: restFetchInit.method || method,
        signal: combinedSignal,
        credentials: 'include',
        body: finalBody,
        headers: mergedHeaders,
      })

      if (response.status === 401 && isProtected && retries > 0) {
        const refreshOk = await tryRefreshToken()
        if (!refreshOk) {
          useAuthStore.getState().clearAccessToken()
          throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Session expired')
        }

        const newToken = useAuthStore.getState().accessToken
        mergedHeaders.set('Authorization', `Bearer ${newToken}`)
        return execute(att - 1)
      }

      if (!response.ok) {
        if (response.status === 499) throw new DOMException('Aborted', 'AbortError')
        let errorMessage: string | undefined
        try {
          const errorBody: unknown = await response.json()
          if (errorBody && typeof errorBody === 'object') {
            if ('message' in errorBody) errorMessage = String(errorBody.message)
            else if ('error' in errorBody) errorMessage = String(errorBody.error)
          }
        } catch {
          errorMessage = undefined
        }
        throwResponseErrors(response.status, errorCode, errorMessage)
      }
      if (response.status === 204) return { data: null as T, status: response.status }

      const rawData: unknown = await response.json()
      const data = schema.parse(rawData)

      return { data, status: response.status }
    } catch (e) {
      const isTimeout = timeoutController.signal.aborted && (!signal || !signal.aborted)
      if (isTimeout) throw new DOMException('Timed out', 'TimeoutError')
      throw e
    }
  }

  try {
    return await execute(retries)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') throw e

    throw handleApiError(e, errorCode, { isExternalSignal: !!signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const response = await fetch(API_URL.AUTH.REFRESH_TOKEN, {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) return false

    const rawData: unknown = await response.json()
    const data = AccessTokenResponseSchema.parse(rawData)

    useAuthStore.getState().setAccessToken(data.accessToken)
    return true
  } catch {
    return false
  }
}

type RequestProps<T> = {
  url: string
  schema: ZodType<T>

  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  timeout?: number
  errorCode?: ErrorCode
  signal?: AbortSignal
  body?: BodyInit
  json?: unknown
  fetchInit?: RequestInit
  isProtected?: boolean
  retries?: number
}
