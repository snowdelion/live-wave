import { type ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'

import { MetricsFilter } from '../metrics.filter'
import type { MetricsService } from '../metrics.service'

describe('MetricsFilter', () => {
  let filter: MetricsFilter
  let mockMetricsService: Partial<MetricsService>

  let mockRequest: any
  let mockResponse: any
  let mockHost: ArgumentsHost

  beforeEach(() => {
    mockMetricsService = {
      incrementEndpointRequest: vi.fn(),
    }

    filter = new MetricsFilter(mockMetricsService as MetricsService)

    mockRequest = {
      method: 'GET',
      route: { path: '/api/v1/users' },
      url: '/api/v1/users/123',
    }

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }

    mockHost = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost

    vi.clearAllMocks()
  })

  describe('generic errors', () => {
    it('should record metrics and return 500 Internal Server Error for generic errors', () => {
      const error = new Error('Database connection failed')

      filter.catch(error, mockHost)

      expect(mockMetricsService.incrementEndpointRequest).toHaveBeenCalledWith(
        'GET',
        HttpStatus.INTERNAL_SERVER_ERROR,
        '/api/v1/users',
      )

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        path: '/api/v1/users/123',
      })
    })
  })

  describe('HttpExceptions', () => {
    it('should record metrics and return the correct status and message for HttpException', () => {
      const error = new HttpException('User not found', HttpStatus.NOT_FOUND)

      filter.catch(error, mockHost)

      expect(mockMetricsService.incrementEndpointRequest).toHaveBeenCalledWith(
        'GET',
        HttpStatus.NOT_FOUND,
        '/api/v1/users',
      )

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found',
        path: '/api/v1/users/123',
      })
    })

    it('should handle custom HttpException messages correctly', () => {
      const error = new HttpException('Custom bad request message', HttpStatus.BAD_REQUEST)

      filter.catch(error, mockHost)

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Custom bad request message',
        path: '/api/v1/users/123',
      })
    })
  })

  describe('path extraction', () => {
    it('should fallback to req.url when req.route is undefined', () => {
      mockRequest.route = undefined
      const error = new Error('Something went wrong')

      filter.catch(error, mockHost)

      expect(mockMetricsService.incrementEndpointRequest).toHaveBeenCalledWith(
        'GET',
        HttpStatus.INTERNAL_SERVER_ERROR,
        '/api/v1/users/123',
      )

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/v1/users/123',
        }),
      )
    })

    it('should fallback to empty string if both route.path and url are missing', () => {
      mockRequest.route = undefined
      mockRequest.url = undefined
      const error = new Error('Something went wrong')

      filter.catch(error, mockHost)

      expect(mockMetricsService.incrementEndpointRequest).toHaveBeenCalledWith(
        'GET',
        HttpStatus.INTERNAL_SERVER_ERROR,
        '',
      )
    })
  })

  describe('method extraction', () => {
    it('should correctly record different HTTP methods', () => {
      mockRequest.method = 'POST'
      const error = new HttpException('Created', HttpStatus.CREATED)

      filter.catch(error, mockHost)

      expect(mockMetricsService.incrementEndpointRequest).toHaveBeenCalledWith(
        'POST',
        HttpStatus.CREATED,
        '/api/v1/users',
      )
    })
  })
})
