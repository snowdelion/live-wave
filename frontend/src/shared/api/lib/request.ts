import type { ZodType } from 'zod'

import { type ErrorCode } from '../config/error-codes'

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
  accessToken,
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

  if (accessToken) mergedHeaders.set('Authorization', `Bearer ${accessToken}`)

  try {
    const response = await fetch(url, {
      ...restFetchInit,
      method: restFetchInit.method || method,
      signal: combinedSignal,
      credentials: 'include',
      body: finalBody,
      headers: mergedHeaders,
    })

    if (!response.ok) {
      if (response.status === 499) throw new DOMException('Aborted', 'AbortError')
      throwResponseErrors(response.status, errorCode)
    }
    if (response.status === 204) return { data: null as T, status: response.status }

    const rawData: unknown = await response.json()
    const data = schema.parse(rawData)

    return { data, status: response.status }
  } catch (error) {
    const isTimeout = timeoutController.signal.aborted && (!signal || !signal.aborted)
    if (isTimeout) throw new DOMException('Timed out', 'TimeoutError')

    throw handleApiError(error, errorCode, { isExternalSignal: !!signal })
  } finally {
    clearTimeout(timeoutId)
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
  accessToken?: string
}
