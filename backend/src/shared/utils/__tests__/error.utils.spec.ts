import { Logger, NotFoundException } from '@nestjs/common'

import { getErrorMessage, logAndThrow } from '../error.utils'

// --- mocks ---
vi.mock('@nestjs/common', async () => {
  const actual = await vi.importActual('@nestjs/common')
  return {
    ...actual,
    Logger: vi.fn().mockImplementation(() => ({
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      log: vi.fn(),
    })),
  }
})

function makeLogger() {
  return (Logger as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value as Record<
    string,
    ReturnType<typeof vi.fn>
  >
}

beforeEach(() => {
  vi.clearAllMocks()
})

// --- tests ---
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
  it('constructs a Logger with the supplied name', () => {
    expect(() =>
      logAndThrow({ name: 'MyService', context: 'fetch data', e: new Error('fail') }),
    ).toThrow()

    expect(Logger).toHaveBeenCalledWith('MyService')
  })

  it('logs at the "error" level by default', () => {
    const e = new Error('boom')
    expect(() => logAndThrow({ name: 'Svc', context: 'do thing', e })).toThrow()

    const logger = makeLogger()
    expect(logger.error).toHaveBeenCalledOnce()
    expect(logger.error).toHaveBeenCalledWith(`Failed to do thing: boom`, e.stack)
  })

  it('logs at a custom level when loggerType is supplied', () => {
    expect(() =>
      logAndThrow({ name: 'Svc', context: 'do thing', e: new Error('x'), loggerType: 'warn' }),
    ).toThrow()

    const logger = makeLogger()
    expect(logger.warn).toHaveBeenCalledOnce()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('passes undefined as the stack when e is not an Error', () => {
    expect(() => logAndThrow({ name: 'Svc', context: 'ctx', e: 'plain string' })).toThrow()

    const logger = makeLogger()
    expect(logger.error).toHaveBeenCalledWith('Failed to ctx: Unknown error', undefined)
  })

  it('uses the custom fallback message in the log line', () => {
    expect(() =>
      logAndThrow({ name: 'Svc', context: 'ctx', e: null, fallback: 'My fallback' }),
    ).toThrow()

    const logger = makeLogger()
    expect(logger.error).toHaveBeenCalledWith('Failed to ctx: My fallback', undefined)
  })
})

describe('logAndThrow - throwing', () => {
  it('re-throws the original error when no exception class is provided', () => {
    const original = new Error('original')
    expect(() => logAndThrow({ name: 'Svc', context: 'ctx', e: original })).toThrow(original)
  })

  it('throws an instance of the supplied exception class', () => {
    expect(() =>
      logAndThrow({
        name: 'Svc',
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
        name: 'Svc',
        context: 'ctx',
        e: new Error('not found'),
        exception: NotFoundException,
        exceptionContext: 'Resource',
      }),
    ).toThrow('Resource: not found')
  })

  it('does NOT throw when shouldThrow is false', () => {
    expect(() =>
      logAndThrow({ name: 'Svc', context: 'ctx', e: new Error('x'), shouldThrow: false }),
    ).not.toThrow()
  })

  it('still logs when shouldThrow is false', () => {
    logAndThrow({ name: 'Svc', context: 'ctx', e: new Error('x'), shouldThrow: false })

    const logger = makeLogger()
    expect(logger.error).toHaveBeenCalledOnce()
  })
})

describe('logAndThrow - shouldSetCause', () => {
  it('sets cause on the thrown error when shouldSetCause is true and e is an Error', () => {
    const original = new Error('root cause')
    let thrown: unknown

    try {
      logAndThrow({
        name: 'Svc',
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
        name: 'Svc',
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
        name: 'Svc',
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
