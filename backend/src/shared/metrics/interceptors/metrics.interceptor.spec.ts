import { type CallHandler, type ExecutionContext, HttpException } from '@nestjs/common'
import { of, throwError, lastValueFrom } from 'rxjs'

import type { MetricsService } from '../metrics.service'

import { MetricsInterceptor } from './metrics.interceptor'

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor
  let mockMetricsService: Partial<MetricsService>

  let mockRequest: any
  let mockResponse: any
  let mockContext: ExecutionContext
  let mockCallHandler: CallHandler

  beforeEach(() => {
    mockMetricsService = {
      incrementEndpointRequest: vi.fn(),
    }

    interceptor = new MetricsInterceptor(mockMetricsService as MetricsService)

    mockRequest = {
      method: 'GET',
      route: { path: '/api/v1/users' },
      url: '/api/v1/users/fallback',
    }

    mockResponse = {
      statusCode: 200,
    }

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext

    mockCallHandler = {
      handle: vi.fn(),
    }

    vi.clearAllMocks()
  })

  describe('path and method extraction', () => {
    it('should extract path from req.route.path when available', async () => {
      ;(mockCallHandler.handle as any).mockReturnValue(of({}))

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockMetricsService.incrementEndpointRequest).toHaveBeenCalledWith(
        'GET',
        200,
        '/api/v1/users',
      )
    })

    it('should fallback to req.url when req.route is missing', async () => {
      mockRequest.route = undefined
      ;(mockCallHandler.handle as any).mockReturnValue(of({}))

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockMetricsService.incrementEndpointRequest).toHaveBeenCalledWith(
        'GET',
        200,
        '/api/v1/users/fallback',
      )
    })
  })

  describe('success path', () => {
    it('should record metrics with the response status code on success', async () => {
      mockRequest.method = 'POST'
      mockResponse.statusCode = 201
      ;(mockCallHandler.handle as any).mockReturnValue(of({ data: 'created' }))

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockMetricsService.incrementEndpointRequest).toHaveBeenCalledWith(
        'POST',
        201,
        '/api/v1/users',
      )
    })

    it('should default to status 200 if response statusCode is missing', async () => {
      mockResponse.statusCode = undefined
      ;(mockCallHandler.handle as any).mockReturnValue(of({}))

      await lastValueFrom(interceptor.intercept(mockContext, mockCallHandler))

      expect(mockMetricsService.incrementEndpointRequest).toHaveBeenCalledWith(
        'GET',
        200,
        '/api/v1/users',
      )
    })
  })

  describe('error path', () => {
    it('should record metrics with HttpException status code on HttpException', async () => {
      const error = new HttpException('Not Found', 404)
      ;(mockCallHandler.handle as any).mockReturnValue(throwError(() => error))

      await expect(
        lastValueFrom(interceptor.intercept(mockContext, mockCallHandler)),
      ).rejects.toThrow(HttpException)

      expect(mockMetricsService.incrementEndpointRequest).toHaveBeenCalledWith(
        'GET',
        404,
        '/api/v1/users',
      )
    })

    it('should record metrics with 500 status code on generic Error', async () => {
      const error = new Error('Database connection failed')
      ;(mockCallHandler.handle as any).mockReturnValue(throwError(() => error))

      await expect(
        lastValueFrom(interceptor.intercept(mockContext, mockCallHandler)),
      ).rejects.toThrow(Error)

      expect(mockMetricsService.incrementEndpointRequest).toHaveBeenCalledWith(
        'GET',
        500,
        '/api/v1/users',
      )
    })
  })
})
