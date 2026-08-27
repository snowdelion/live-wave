import { ZodError } from 'zod'

import { AppError } from '../config/app-error'
import { ERROR_CODES } from '../config/error-codes'
import type { ErrorCode } from '../config/error-codes'

export function handleApiError(
  error: unknown,
  errorCode: ErrorCode = ERROR_CODES.UNKNOWN,
  statusCode: number,
  { isExternalSignal = false }: { isExternalSignal?: boolean } = {},
): never {
  if (error instanceof ZodError) throwZodErrors(error)
  if (error instanceof AppError) throw error

  const isError = error instanceof Error || error instanceof DOMException

  if (isError) {
    const isTimeout =
      error.name === 'TimeoutError' || (error.name === 'AbortError' && !isExternalSignal)

    const isExternalAbort = error.name === 'AbortError' && isExternalSignal

    if (isExternalAbort) throw error
    if (isTimeout)
      throw new AppError({
        code: ERROR_CODES.TIMEOUT,
        message: 'Check your network connection',
        statusCode,
      })

    const messages = [/failed to fetch/i, /network/i, /load/i, /connection/i]
    const isNetworkError = messages.some(msg => msg.test(error.message.toLowerCase()))

    if (isNetworkError)
      throw new AppError({
        code: ERROR_CODES.NETWORK,
        message: 'Check your network connection',
        statusCode,
      })

    throw new AppError({ code: errorCode, message: error.message, statusCode })
  }

  throw new AppError({ code: errorCode, message: 'Unexpected error', statusCode })
}

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid search query',
  401: 'API authentication failed',
  403: 'API authentication failed',
  429: 'Too many requests',
  499: 'Request was aborted by client',
}

export function throwResponseErrors(
  status: number,
  errorCode: ErrorCode = ERROR_CODES.UNKNOWN,
  statusCode: number,
  customMessage?: string,
) {
  if (customMessage) throw new AppError({ code: errorCode, message: customMessage, statusCode })
  if (status >= 500 && status <= 504)
    throw new AppError({
      code: errorCode,
      message: 'Service is temporarily unavailable',
      statusCode,
    })

  const message = ERROR_MESSAGES[status] ?? `Failed to fetch data`
  throw new AppError({ code: errorCode, message, statusCode })
}

function throwZodErrors(error: ZodError) {
  const messages = error.issues
    .map(({ path, message }) => `${path.join('.')}: ${message}`)
    .join('; ')
  throw new AppError({
    code: ERROR_CODES.VALIDATION,
    message: `Validation failed: ${messages}`,
    statusCode: 400,
  })
}
