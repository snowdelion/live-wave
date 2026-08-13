import { type NotFoundException } from '@nestjs/common'

import type { Logger } from '../logger/logger.service'

export function logAndThrow({
  context,
  e,
  exception,
  exceptionContext,
  shouldThrow = true,
  loggerType = 'error',
  fallback = 'Unknown error',
  shouldSetCause = false,
  logger,
}: LogAndThrowOptions) {
  const isError = e instanceof Error
  const msg = getErrorMessage(e, fallback)
  const stack = isError ? e.stack : undefined

  logger[loggerType](`Failed to ${context}: ${msg}`, { context, stack })

  if (shouldThrow) {
    if (exception) {
      const error = new exception(`${exceptionContext}: ${msg}`)
      if (shouldSetCause && isError) error.cause = e
      throw error
    }
    throw e
  }
}

interface LogAndThrowOptions {
  context: string
  e: unknown
  logger: Logger

  exceptionContext?: string
  exception?: typeof NotFoundException | typeof Error
  shouldThrow?: boolean
  loggerType?: 'error' | 'warn' | 'debug' | 'log' | 'verbose'
  fallback?: string
  shouldSetCause?: boolean
}

export function getErrorMessage(e: unknown, fallback = 'Unknown error') {
  return e instanceof Error ? e.message : fallback
}
