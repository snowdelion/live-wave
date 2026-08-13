import { Method, StatusEnum } from '@prisma/client'
import type { Prisma } from '@prisma/client'

import { Logger } from '@/shared/logger/logger.service'
import type { PrismaService } from '@/shared/prisma/prisma.service'
import { httpFetch } from '@/shared/utils/http-fetch.utils'

import { HttpStrategy } from '../http-check.strategy'

vi.mock('@/shared/utils/http-fetch.utils', () => ({
  httpFetch: vi.fn(),
}))

const MONITOR_ID = 'monitor-1'
const CHECK_INTERVAL = 10
const TIMEOUT_MS = 5000
const TEST_URL = 'https://example.com/health'

type MonitorWithHttp = Prisma.MonitorGetPayload<{
  include: { httpMonitor: true }
}>

const makeMonitorRow = (
  overrides: Partial<
    Pick<MonitorWithHttp, 'id' | 'checkInterval' | 'timeout'> & {
      httpMonitor: MonitorWithHttp['httpMonitor']
    }
  > = {},
): MonitorWithHttp =>
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
  }) as MonitorWithHttp

function createMockResponse(status: number, ok = status >= 200 && status < 300): Response {
  return { status, ok } as Response
}

async function runTransactionBatch(
  arg: Parameters<PrismaService['$transaction']>[0],
): Promise<unknown[]> {
  if (typeof arg === 'function') {
    throw new Error('callback transactions are not used in HttpStrategy tests')
  }
  return Promise.all(arg)
}

const mockPrisma = {
  monitor: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  check: {
    create: vi.fn(),
  },
  $transaction: vi.fn(runTransactionBatch),
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

    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(makeMonitorRow())
    vi.mocked(mockPrisma.check.create).mockResolvedValue({} as never)
    vi.mocked(mockPrisma.monitor.update).mockResolvedValue({} as never)
    vi.mocked(mockPrisma.$transaction).mockImplementation(runTransactionBatch)
    mockFetchWithRetry.mockResolvedValue(createMockResponse(200))

    strategy = new HttpStrategy(mockPrisma, mockLogger)
    Object.assign(strategy, { prisma: mockPrisma })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('check', () => {
    it('loads the monitor with httpMonitor included', async () => {
      await strategy.check(MONITOR_ID)

      expect(mockPrisma.monitor.findUnique).toHaveBeenCalledOnce()
      expect(mockPrisma.monitor.findUnique).toHaveBeenCalledWith({
        where: { id: MONITOR_ID },
        include: { httpMonitor: true },
      })
    })

    it('warns and skips when the monitor is not found', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(null)

      await strategy.check(MONITOR_ID)

      expect(mockFetchWithRetry).not.toHaveBeenCalled()
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('skips when httpMonitor is missing', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(
        makeMonitorRow({ httpMonitor: null }),
      )

      await strategy.check(MONITOR_ID)

      expect(mockFetchWithRetry).not.toHaveBeenCalled()
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('calls httpFetch with monitor URL, timeout, method, and fixed options', async () => {
      await strategy.check(MONITOR_ID)

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

    it('persists an up check and schedules the next run when the response is ok', async () => {
      mockFetchWithRetry.mockResolvedValue(createMockResponse(204, true))

      await strategy.check(MONITOR_ID)

      expect(mockPrisma.check.create).toHaveBeenCalledWith({
        data: {
          monitorId: MONITOR_ID,
          status: StatusEnum.up,
          statusCode: 204,
          responseTime: expect.any(Number) as number,
          error: null,
          details: {
            method: 'HEAD',
            url: 'https://example.com/health',
          },
        },
      })
      expect(mockPrisma.monitor.update).toHaveBeenCalledWith({
        where: { id: MONITOR_ID },
        data: {
          lastCheckedAt: new Date('2024-06-01T12:00:00.000Z'),
          lastStatus: StatusEnum.up,
          nextCheckAt: new Date('2024-06-01T12:10:00.000Z'),
        },
      })
      expect(mockPrisma.$transaction).toHaveBeenCalledOnce()
    })

    it('persists a down check and warns when the HTTP status is not ok', async () => {
      mockFetchWithRetry.mockResolvedValue(createMockResponse(503, false))

      await strategy.check(MONITOR_ID)

      expect(mockPrisma.check.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          monitorId: MONITOR_ID,
          status: StatusEnum.down,
          statusCode: 503,
          error: null,
        }),
      })
    })

    it('persists a down check with the Error message when fetch fails', async () => {
      const networkError = new Error('fetch failed')
      mockFetchWithRetry.mockRejectedValue(networkError)

      await strategy.check(MONITOR_ID)

      expect(mockPrisma.check.create).toHaveBeenCalledWith({
        data: {
          monitorId: MONITOR_ID,
          status: StatusEnum.down,
          statusCode: null,
          responseTime: 0,
          error: 'fetch failed',
          details: {
            method: 'HEAD',
            url: 'https://example.com/health',
          },
        },
      })
    })

    it('uses "unknown error" when fetch rejects with a non-Error value', async () => {
      mockFetchWithRetry.mockRejectedValue('timeout')

      await strategy.check(MONITOR_ID)

      expect(mockPrisma.check.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: StatusEnum.down,
          error: expect.stringMatching(/unknown error/i),
        }),
      })
    })
  })
})
