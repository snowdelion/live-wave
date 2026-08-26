import { Method, StatusEnum } from '@prisma/client'

import { Logger } from '@/shared/logger/logger.service'
import type { PrismaService } from '@/shared/prisma/prisma.service'
import { httpFetch } from '@/shared/utils/http-fetch.utils'

import { BaseCheckStrategy } from '../base-check.strategy'
import { HttpStrategy } from '../http-check.strategy'
import type { StrategyContext } from '../strategy-result.types'

vi.mock('@/shared/utils/http-fetch.utils', () => ({
  httpFetch: vi.fn(),
}))

const MONITOR_ID = 'monitor-1'
const CHECK_INTERVAL = 10
const TIMEOUT_MS = 5000
const TEST_URL = 'https://example.com/health'

const makeMonitorContext = (overrides: Partial<StrategyContext> = {}): StrategyContext =>
  ({
    id: MONITOR_ID,
    name: 'API health',
    type: 'HTTP',
    checkInterval: CHECK_INTERVAL,
    timeout: TIMEOUT_MS,
    lastStatus: null,
    userId: 'user-1',
    lastCheckedAt: null,
    nextCheckAt: null,
    createdAt: new Date('2024-06-01T00:00:00.000Z'),
    updatedAt: new Date('2024-06-01T00:00:00.000Z'),
    httpMonitor: {
      monitorId: MONITOR_ID,
      url: TEST_URL,
      method: Method.HEAD,
    },
    ...overrides,
  }) as StrategyContext

function createMockResponse(status: number, ok = status >= 200 && status < 300): Response {
  return { status, ok } as Response
}

const mockPrisma = {
  monitor: {
    update: vi.fn(),
  },
  check: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(),
} as unknown as PrismaService

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger),
} as unknown as Logger

const mockFetchWithRetry = vi.mocked(httpFetch)

describe('HttpStrategy', () => {
  let strategy: HttpStrategy

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)

    mockFetchWithRetry.mockResolvedValue(createMockResponse(200))

    strategy = new HttpStrategy(mockPrisma, mockLogger)

    vi.spyOn(BaseCheckStrategy.prototype as any as any, 'confirmCheckResult').mockResolvedValue(
      undefined,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('check', () => {
    it('warns and skips when the monitor context is missing httpMonitor', async () => {
      await strategy.check(makeMonitorContext({ httpMonitor: undefined } as any))

      expect(mockFetchWithRetry).not.toHaveBeenCalled()
      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).not.toHaveBeenCalled()
    })

    it('calls httpFetch with monitor URL, timeout, method, and fixed options', async () => {
      await strategy.check(makeMonitorContext())

      expect(mockFetchWithRetry).toHaveBeenCalledOnce()
      expect(mockFetchWithRetry).toHaveBeenCalledWith({
        url: TEST_URL,
        timeout: TIMEOUT_MS,
        retries: 3,
        options: {
          method: Method.HEAD,
          redirect: 'follow',
          cache: 'no-cache',
          headers: { 'User-Agent': 'LiveWave-Uptime-Monitor/1.0' },
        },
      })
    })
  })

  describe('performCheck (via check)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-01T12:00:00.000Z'))
    })

    it('persists an up check when the response is ok', async () => {
      mockFetchWithRetry.mockResolvedValue(createMockResponse(204, true))

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        MONITOR_ID,
        {
          status: StatusEnum.up,
          error: null,
          responseTime: 0,
          details: {
            method: Method.HEAD,
            url: TEST_URL,
          },
        },
      )
    })

    it('persists a down check and warns when the HTTP status is not ok', async () => {
      mockFetchWithRetry.mockResolvedValue(createMockResponse(503, false))

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        MONITOR_ID,
        {
          status: StatusEnum.down,
          error: null,
          responseTime: 0,
          details: {
            method: Method.HEAD,
            url: TEST_URL,
          },
        },
      )

      expect(mockLogger.warn).toHaveBeenCalledWith('HTTP monitor is down', {
        monitorId: MONITOR_ID,
        statusCode: 503,
        responseTime: 0,
        error: null,
      })
    })

    it('persists a down check with the Error message when fetch fails', async () => {
      const networkError = new Error('fetch failed')
      mockFetchWithRetry.mockRejectedValue(networkError)

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        MONITOR_ID,
        {
          status: StatusEnum.down,
          error: 'fetch failed',
          responseTime: 0,
          details: {
            method: Method.HEAD,
            url: TEST_URL,
          },
        },
      )
    })

    it('uses "unknown error" when fetch rejects with a non-Error value', async () => {
      mockFetchWithRetry.mockRejectedValue('timeout')

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        MONITOR_ID,
        expect.objectContaining({
          status: StatusEnum.down,
          error: expect.stringMatching(/unknown error/i),
        }),
      )
    })
  })
})
