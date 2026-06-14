import { Logger, type NotFoundException } from '@nestjs/common'

export function logAndThrow({
  name,
  context,
  e,
  exception,
  exceptionContext,
  shouldThrow = true,
  loggerType = 'error',
  fallback = 'Unknown error',
  shouldSetCause = false,
}: LogAndThrowOptions) {
  const isError = e instanceof Error
  const msg = getErrorMessage(e, fallback)
  const stack = isError ? e.stack : undefined

  const logger = new Logger(name)
  logger[loggerType](`Failed to ${context}: ${msg}`, stack)

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
  name: string
  context: string
  e: unknown

  exceptionContext?: string
  exception?: typeof NotFoundException | typeof Error
  shouldThrow?: boolean
  loggerType?: 'error' | 'warn' | 'debug' | 'log'
  fallback?: string
  shouldSetCause?: boolean
}

export function getErrorMessage(e: unknown, fallback = 'Unknown error') {
  return e instanceof Error ? e.message : fallback
}
