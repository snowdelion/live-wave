import type { ZodType } from 'zod'

import { API_URL } from '../config/api-url'
import { AppError } from '../config/app-error'
import { ERROR_CODES, type ErrorCode } from '../config/error-codes'
import { AccessTokenResponseSchema } from '../dto/access-token-response.dto'

import { useAuthStore } from './auth.store'
import { handleApiError, throwResponseErrors } from './error-handler'

const DEFAULT_TIMEOUT = 8000
const UNAUTHORIZED_STATUS = 401
const NO_CONTENT_STATUS = 204
const ABORTED_STATUS = 499
const TIMEOUT_STATUS = 408

export async function request<T>({
  url,
  timeout = DEFAULT_TIMEOUT,
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

  try {
    return await executeWithRetry(
      {
        url,
        method,
        fetchInit,
        combinedSignal,
        body,
        json,
        isProtected,
        schema,
        signal,
        retries,
      },
      timeoutController,
    )
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') throw e
    throw handleApiError(e, errorCode, 500, { isExternalSignal: !!signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function executeWithRetry<T>(
  options: ExecuteOptions<T>,
  timeoutController: AbortController,
): Promise<{ data: T; status: number }> {
  const {
    url,
    method,
    fetchInit,
    combinedSignal,
    body,
    json,
    isProtected,
    schema,
    signal,
    retries,
  } = options

  const { headers, finalBody } = prepareRequest({ fetchInit, body, json, isProtected })

  try {
    const response = await fetch(url, {
      ...fetchInit,
      method: fetchInit?.method ?? method,
      signal: combinedSignal,
      credentials: 'include',
      body: finalBody,
      headers,
    })

    if (response.status === UNAUTHORIZED_STATUS && isProtected && retries > 0) {
      const refreshOk = await tryRefreshToken()
      if (!refreshOk) {
        useAuthStore.getState().clearAccessToken()
        throw new AppError({
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Session expired',
          statusCode: UNAUTHORIZED_STATUS,
        })
      }
      return executeWithRetry({ ...options, retries: retries - 1 }, timeoutController)
    }

    return await handleResponse({ response, schema })
  } catch (e) {
    return handleError(e, signal, timeoutController)
  }
}

function prepareRequest({
  fetchInit,
  body,
  json,
  isProtected,
}: {
  fetchInit: RequestInit | undefined
  body: BodyInit | undefined
  json: unknown | undefined
  isProtected: boolean
}) {
  const headers = new Headers(fetchInit?.headers)
  let finalBody: BodyInit | null = null

  if (json) {
    headers.set('Content-Type', 'application/json')
    finalBody = JSON.stringify(json)
  } else if (body) finalBody = body

  if (isProtected) {
    const accessToken = useAuthStore.getState().accessToken
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return { headers, finalBody }
}

async function handleResponse<T>({
  response,
  schema,
}: {
  response: Response
  schema: ZodType<T>
}): Promise<{ data: T; status: number }> {
  if (!response.ok) {
    if (response.status === ABORTED_STATUS) throw new DOMException('Aborted', 'AbortError')
    const errorMessage = await extractErrorMessage(response)
    throwResponseErrors(response.status, undefined, response.status, errorMessage)
  }
  if (response.status === NO_CONTENT_STATUS) return { data: null as T, status: response.status }

  const rawData: unknown = await response.json()
  const data = schema.parse(rawData)
  return { data, status: response.status }
}

async function extractErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const errorBody: unknown = await response.json()
    if (errorBody && typeof errorBody === 'object') {
      if ('message' in errorBody) return String(errorBody.message)
      if ('error' in errorBody) return String(errorBody.error)
    }
  } catch {
    return undefined
  }
  return undefined
}

function handleError(e: unknown, signal?: AbortSignal, timeoutController?: AbortController): never {
  const isInternalTimeout = timeoutController?.signal.aborted && (!signal || !signal.aborted)
  if (isInternalTimeout) throw new DOMException('Timed out', 'TimeoutError')

  const isExternalAborted = signal?.aborted
  const isTimeoutError = e instanceof Error && e.name === 'TimeoutError'
  const isAbortError = e instanceof Error && e.name === 'AbortError'

  if ((isTimeoutError || isAbortError) && !isExternalAborted)
    throw new AppError({
      code: ERROR_CODES.TIMEOUT,
      message: 'Check your network connection',
      statusCode: TIMEOUT_STATUS,
    })

  throw e
}

async function tryRefreshToken(): Promise<boolean> {
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

type RequestProps<T> = {
  url: string
  schema: ZodType<T>
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  timeout?: number
  errorCode?: ErrorCode
  signal?: AbortSignal | undefined
  body?: BodyInit | undefined
  json?: unknown
  fetchInit?: RequestInit
  isProtected?: boolean
  retries?: number
}

type ExecuteOptions<T> = Omit<RequestProps<T>, 'timeout' | 'errorCode'> & {
  combinedSignal: AbortSignal
  method: NonNullable<RequestProps<T>['method']>
  isProtected: NonNullable<RequestProps<T>['isProtected']>
  retries: NonNullable<RequestProps<T>['retries']>
}
