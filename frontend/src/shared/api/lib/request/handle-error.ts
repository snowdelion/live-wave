import { AppError } from '../../config/app-error'
import { ERROR_CODES } from '../../config/error-codes'

import { TIMEOUT_STATUS } from './request.constants'

export async function extractErrorMessage(response: Response): Promise<string | undefined> {
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

export function handleError(
  e: unknown,
  signal?: AbortSignal,
  timeoutController?: AbortController,
): never {
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
