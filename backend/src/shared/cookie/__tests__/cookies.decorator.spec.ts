import 'reflect-metadata'
import type { ExecutionContext } from '@nestjs/common'
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants'

import { Cookies } from '../cookies.decorator'

function getParamDecoratorFactory(decorator: () => unknown) {
  class TestClass {
    public test(@((decorator as any)()) _value: unknown) {}
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestClass, 'test')
  const key = Object.keys(args)[0]
  return args[key].factory
}

function createMockExecutionContext(cookies: unknown): ExecutionContext {
  const request = { cookies }
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext
}

describe('Cookies decorator', () => {
  const factory = getParamDecoratorFactory(Cookies)

  it('returns the full cookies object when no data key is provided', () => {
    const cookies = { session: 'abc123', theme: 'dark' }
    const ctx = createMockExecutionContext(cookies)

    const result = factory(undefined, ctx)

    expect(result).toEqual(cookies)
  })

  it('returns a specific cookie value when a data key is provided', () => {
    const cookies = { session: 'abc123', theme: 'dark' }
    const ctx = createMockExecutionContext(cookies)

    const result = factory('session', ctx)

    expect(result).toBe('abc123')
  })

  it('returns undefined for a missing cookie key', () => {
    const cookies = { session: 'abc123' }
    const ctx = createMockExecutionContext(cookies)

    const result = factory('missing', ctx)

    expect(result).toBeUndefined()
  })

  it('returns an empty object when request.cookies is undefined and no data key given', () => {
    const ctx = createMockExecutionContext(undefined)

    const result = factory(undefined, ctx)

    expect(result).toEqual({})
  })

  it('returns undefined when request.cookies is undefined and a data key is given', () => {
    const ctx = createMockExecutionContext(undefined)

    const result = factory('session', ctx)

    expect(result).toBeUndefined()
  })

  it('handles an empty string data key by falling back to the full cookies object (falsy check)', () => {
    const cookies = { session: 'abc123' }
    const ctx = createMockExecutionContext(cookies)

    const result = factory('', ctx)

    expect(result).toEqual(cookies)
  })

  it('calls ctx.switchToHttp().getRequest() to retrieve the request', () => {
    const cookies = { session: 'abc123' }
    const request = { cookies }
    const getRequest = vi.fn().mockReturnValue(request)
    const ctx = {
      switchToHttp: () => ({ getRequest }),
    } as unknown as ExecutionContext

    factory('session', ctx)

    expect(getRequest).toHaveBeenCalledTimes(1)
  })
})
