import { NotFoundException } from '@nestjs/common'

import type { Logger } from '@/shared/logger/logger.service'

import { getErrorMessage, logAndThrow } from '../error.utils'

vi.mock('@nestjs/common', async () => {
  const actual = await vi.importActual('@nestjs/common')
  return {
    ...actual,
  }
})

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger),
} as unknown as Logger

vi.mock('../../logger/logger.service')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getErrorMessage', () => {
  it('returns the error message when given an Error', () => {
    expect(getErrorMessage(new Error('oops'))).toBe('oops')
  })

  it('returns the default fallback for non-Error values', () => {
    expect(getErrorMessage('string error')).toBe('Unknown error')
    expect(getErrorMessage(42)).toBe('Unknown error')
    expect(getErrorMessage(null)).toBe('Unknown error')
    expect(getErrorMessage(undefined)).toBe('Unknown error')
  })

  it('returns a custom fallback when provided', () => {
    expect(getErrorMessage('not an error', 'Custom fallback')).toBe('Custom fallback')
  })
})

describe('logAndThrow - logging', () => {
  it('logs at the "error" level by default', () => {
    const e = new Error('boom')
    const context = 'do thing'
    expect(() => logAndThrow({ logger: mockLogger, context, e })).toThrow()

    expect(mockLogger.error).toHaveBeenCalledOnce()
    expect(mockLogger.error).toHaveBeenCalledWith(`Failed to ${context}: boom`, {
      context,
      stack: e.stack,
    })
  })

  it('logs at a custom level when loggerType is supplied', () => {
    expect(() =>
      logAndThrow({
        logger: mockLogger,
        context: 'do thing',
        e: new Error('x'),
        loggerType: 'warn',
      }),
    ).toThrow()

    expect(mockLogger.warn).toHaveBeenCalledOnce()
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it('passes undefined as the stack when e is not an Error', () => {
    expect(() => logAndThrow({ logger: mockLogger, context: 'ctx', e: 'plain string' })).toThrow()

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to ctx: Unknown error', {
      context: 'ctx',
      stack: undefined,
    })
  })

  it('uses the custom fallback message in the log line', () => {
    expect(() =>
      logAndThrow({ logger: mockLogger, context: 'ctx', e: null, fallback: 'My fallback' }),
    ).toThrow()

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to ctx: My fallback', {
      context: 'ctx',
      stack: undefined,
    })
  })
})

describe('logAndThrow - throwing', () => {
  it('re-throws the original error when no exception class is provided', () => {
    const original = new Error('original')
    expect(() => logAndThrow({ logger: mockLogger, context: 'ctx', e: original })).toThrow(original)
  })

  it('throws an instance of the supplied exception class', () => {
    expect(() =>
      logAndThrow({
        logger: mockLogger,
        context: 'ctx',
        e: new Error('not found'),
        exception: NotFoundException,
        exceptionContext: 'Resource',
      }),
    ).toThrow(NotFoundException)
  })

  it('includes exceptionContext and original message in the thrown error', () => {
    expect(() =>
      logAndThrow({
        logger: mockLogger,
        context: 'ctx',
        e: new Error('not found'),
        exception: NotFoundException,
        exceptionContext: 'Resource',
      }),
    ).toThrow('Resource: not found')
  })

  it('does NOT throw when shouldThrow is false', () => {
    expect(() =>
      logAndThrow({ logger: mockLogger, context: 'ctx', e: new Error('x'), shouldThrow: false }),
    ).not.toThrow()
  })

  it('still logs when shouldThrow is false', () => {
    logAndThrow({ logger: mockLogger, context: 'ctx', e: new Error('x'), shouldThrow: false })

    expect(mockLogger.error).toHaveBeenCalledOnce()
  })
})

describe('logAndThrow - shouldSetCause', () => {
  it('sets cause on the thrown error when shouldSetCause is true and e is an Error', () => {
    const original = new Error('root cause')
    let thrown: unknown

    try {
      logAndThrow({
        logger: mockLogger,
        context: 'ctx',
        e: original,
        exception: Error,
        exceptionContext: 'Ctx',
        shouldSetCause: true,
      })
    } catch (err) {
      thrown = err
    }

    expect((thrown as Error & { cause: unknown }).cause).toEqual(original)
  })

  it('does not set cause when e is not an Error', () => {
    let thrown: unknown

    try {
      logAndThrow({
        logger: mockLogger,
        context: 'ctx',
        e: 'string error',
        exception: Error,
        exceptionContext: 'Ctx',
        shouldSetCause: true,
      })
    } catch (err) {
      thrown = err
    }

    expect((thrown as Error & { cause: unknown }).cause).toBeUndefined()
  })

  it('does not set cause by default (shouldSetCause defaults to false)', () => {
    let thrown: unknown

    try {
      logAndThrow({
        logger: mockLogger,
        context: 'ctx',
        e: new Error('x'),
        exception: Error,
        exceptionContext: 'Ctx',
      })
    } catch (err) {
      thrown = err
    }

    expect((thrown as Error & { cause: unknown }).cause).toBeUndefined()
  })
})
