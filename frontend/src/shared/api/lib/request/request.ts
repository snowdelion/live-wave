import { AppError } from '../../config/app-error'
import { ERROR_CODES } from '../../config/error-codes'
import { useAuthStore } from '../auth.store'
import { handleApiError } from '../error-handler'

import { handleError } from './handle-error'
import { handleResponse } from './handle-response'
import { prepareRequest } from './prepare-request'
import { DEFAULT_TIMEOUT, UNAUTHORIZED_STATUS } from './request.constants'
import type { ExecuteOptions, RequestProps } from './request.types'
import { tryRefreshToken } from './try-refresh-token'

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
