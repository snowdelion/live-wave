import type { ConfigService } from '@nestjs/config'
import { createLogger, transports } from 'winston'
import LokiTransport from 'winston-loki'

import { Logger } from './logger.service'

vi.mock('winston', () => {
  const mockWinstonLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
    child: vi.fn().mockReturnThis(),
  }

  return {
    createLogger: vi.fn().mockReturnValue(mockWinstonLogger),
    format: {
      combine: vi.fn().mockImplementation((...args) => args),
      timestamp: vi.fn().mockReturnValue('timestamp'),
      colorize: vi.fn().mockReturnValue('colorize'),
      errors: vi.fn().mockReturnValue('errors'),
      json: vi.fn().mockReturnValue('json'),
    },
    transports: {
      Console: vi.fn(),
    },
  }
})

vi.mock('winston-loki', () => ({
  default: vi.fn(),
}))

vi.mock('./logger.utils', () => ({
  simpleFormat: 'simpleFormat',
  jsonFormat: 'jsonFormat',
}))

describe('LoggerService', () => {
  let mockConfigService: ConfigService
  let logger: Logger
  let mockWinstonInstance: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'NODE_ENV') return 'development'
        if (key === 'LOG_LEVEL') return 'debug'
        if (key === 'LOKI_HOST') return undefined
        return null
      }),
    } as unknown as ConfigService

    logger = new Logger(mockConfigService as ConfigService)
    mockWinstonInstance = (logger as any).logger
  })

  describe('initialization', () => {
    it('should create a winston logger with development settings when NODE_ENV is not production', () => {
      expect(createLogger).toHaveBeenCalledWith({
        level: 'debug',
        format: expect.any(Array),
        transports: [expect.any(Object)],
      })

      expect(transports.Console).toHaveBeenCalledWith({
        format: expect.arrayContaining(['timestamp', 'colorize', 'simpleFormat']),
      })

      expect(LokiTransport).not.toHaveBeenCalled()
    })

    it('should create a winston logger with production settings and Loki when configured', () => {
      vi.mocked(mockConfigService.get).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production'
        if (key === 'LOG_LEVEL') return 'info'
        if (key === 'LOKI_HOST') return 'http://loki:3100'
        return null
      })

      new Logger(mockConfigService as ConfigService)

      expect(createLogger).toHaveBeenCalledWith({
        level: 'info',
        format: expect.any(Array),
        transports: [expect.any(Object), expect.any(Object)],
      })

      expect(transports.Console).toHaveBeenCalledWith({
        format: expect.arrayContaining(['timestamp', 'json']),
      })

      expect(LokiTransport).toHaveBeenCalledWith({
        host: 'http://loki:3100',
        labels: { app: 'live-wave-backend' },
        json: true,
        batching: true,
        timeout: 30,
        format: expect.arrayContaining(['timestamp', 'jsonFormat']),
      })
    })

    it('should default LOG_LEVEL to "info" if not provided', () => {
      vi.mocked(mockConfigService.get).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development'
        if (key === 'LOG_LEVEL') return undefined
        return null
      })

      new Logger(mockConfigService as ConfigService)

      expect(createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
        }),
      )
    })
  })

  describe('logging methods', () => {
    describe('log', () => {
      it('should call winston info with context string', () => {
        logger.log('Test message', 'TestContext')
        expect(mockWinstonInstance.info).toHaveBeenCalledWith({
          message: 'Test message',
          context: 'TestContext',
        })
      })

      it('should call winston info with context object', () => {
        logger.log('Test message', { userId: 123, action: 'login' })
        expect(mockWinstonInstance.info).toHaveBeenCalledWith({
          message: 'Test message',
          userId: 123,
          action: 'login',
        })
      })

      it('should call winston info with no context', () => {
        logger.log('Test message')
        expect(mockWinstonInstance.info).toHaveBeenCalledWith({
          message: 'Test message',
        })
      })
    })

    describe('error', () => {
      it('should call winston error with context string', () => {
        logger.error('Error message', 'ErrorContext')
        expect(mockWinstonInstance.error).toHaveBeenCalledWith({
          message: 'Error message',
          context: 'ErrorContext',
        })
      })

      it('should call winston error with context object', () => {
        logger.error('Error message', { err: new Error('fail') })
        expect(mockWinstonInstance.error).toHaveBeenCalledWith({
          message: 'Error message',
          err: expect.any(Error),
        })
      })
    })

    describe('warn', () => {
      it('should call winston warn with context string', () => {
        logger.warn('Warn message', 'WarnContext')
        expect(mockWinstonInstance.warn).toHaveBeenCalledWith({
          message: 'Warn message',
          context: 'WarnContext',
        })
      })
    })

    describe('debug', () => {
      it('should call winston debug with context string', () => {
        logger.debug('Debug message', 'DebugContext')
        expect(mockWinstonInstance.debug).toHaveBeenCalledWith({
          message: 'Debug message',
          context: 'DebugContext',
        })
      })
    })

    describe('verbose', () => {
      it('should call winston verbose with context string', () => {
        logger.verbose('Verbose message', 'VerboseContext')
        expect(mockWinstonInstance.verbose).toHaveBeenCalledWith({
          message: 'Verbose message',
          context: 'VerboseContext',
        })
      })
    })
  })

  describe('child', () => {
    it('should create a new Logger instance with a child winston logger', () => {
      const ctx = { requestId: 'abc-123' }

      const mockChildLogger = { info: vi.fn(), error: vi.fn() }
      mockWinstonInstance.child.mockReturnValue(mockChildLogger)

      const childLogger = logger.child(ctx)

      expect(mockWinstonInstance.child).toHaveBeenCalledWith(ctx)
      expect(childLogger).toBeInstanceOf(Logger)
      expect((childLogger as any).logger).toBe(mockChildLogger)
    })
  })
})
