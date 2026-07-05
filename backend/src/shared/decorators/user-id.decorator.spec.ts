import 'reflect-metadata'
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common'
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants'

import { UserId } from './user-id.decorator'

function getParamDecoratorFactory(decorator: () => unknown) {
  class TestClass {
    public test(@((decorator as any)()) _value: unknown) {}
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestClass, 'test')
  const key = Object.keys(args)[0]
  return args[key].factory
}

function createMockExecutionContext(user: unknown): ExecutionContext {
  const request = { user }
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext
}

describe('UserId decorator', () => {
  const factory = getParamDecoratorFactory(UserId)

  it('returns the userId when user is present on the request', () => {
    const ctx = createMockExecutionContext({ userId: 'user-123' })

    const result = factory(undefined, ctx)

    expect(result).toBe('user-123')
  })

  it('throws UnauthorizedException when user is missing from the request', () => {
    const ctx = createMockExecutionContext(undefined)

    expect(() => factory(undefined, ctx)).toThrow(UnauthorizedException)
    expect(() => factory(undefined, ctx)).toThrow('User not found in request')
  })

  it('throws UnauthorizedException when user is null', () => {
    const ctx = createMockExecutionContext(null)

    expect(() => factory(undefined, ctx)).toThrow(UnauthorizedException)
  })

  it('throws UnauthorizedException when user exists but has no userId', () => {
    const ctx = createMockExecutionContext({ email: 'test@example.com' })

    expect(() => factory(undefined, ctx)).toThrow(UnauthorizedException)
    expect(() => factory(undefined, ctx)).toThrow('User not found in request')
  })

  it('throws UnauthorizedException when userId is an empty string (falsy)', () => {
    const ctx = createMockExecutionContext({ userId: '' })

    expect(() => factory(undefined, ctx)).toThrow(UnauthorizedException)
  })

  it('ignores the data argument passed to the decorator', () => {
    const ctx = createMockExecutionContext({ userId: 'user-456' })

    const result = factory('some-unused-data', ctx)

    expect(result).toBe('user-456')
  })
})
