import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants'

import { ClientId } from './client-id.decorator'

// helpers
function getParamDecorator(decorator: (...args: unknown[]) => ParameterDecorator) {
  class Test {
    test(@decorator() _: unknown) {}
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test') as Record<
    string,
    { factory: (...args: unknown[]) => unknown }
  >

  const firstKey = Object.keys(args)[0]
  return args[firstKey].factory
}

const MockClientId = getParamDecorator(ClientId)

const createMockContext = (requestData: any): ExecutionContext => {
  return {
    switchToHttp: () => ({
      getRequest: () => requestData,
    }),
  } as unknown as ExecutionContext
}

// tests
describe('ClientId Decorator', () => {
  it('should return clientId if it exists in request', () => {
    const mockCtx = createMockContext({ clientId: 'client-123' })

    const result = MockClientId(null, mockCtx)

    expect(result).toBe('client-123')
  })

  it('should throw UnauthorizedException if clientId is missing', () => {
    const mockCtx = createMockContext({ clientId: undefined })

    expect(() => MockClientId(null, mockCtx)).toThrow(
      new UnauthorizedException('No active session'),
    )
  })
})
