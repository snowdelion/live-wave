import { Logger } from '@nestjs/common'
import { Method, StatusEnum } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PrismaService } from '@/backend/shared/prisma/prisma.service'
import { httpFetch } from '@/backend/shared/utils/http-fetch.utils'

import { HttpStrategy } from '../http-check.strategy'

vi.mock('@/backend/shared/utils/http-fetch.utils', () => ({
  httpFetch: vi.fn(),
}))

// --- helpers ---
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
    clientId: 'client-1',
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

// --- mocks ---
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

const mockFetchWithRetry = vi.mocked(httpFetch)

// --- tests ---
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

    strategy = new HttpStrategy(mockPrisma)
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

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        `Monitor ${MONITOR_ID} or its HttpMonitor not found, skipping check`,
      )
      expect(mockFetchWithRetry).not.toHaveBeenCalled()
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('warns and skips when httpMonitor is missing', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(
        makeMonitorRow({ httpMonitor: null }),
      )

      await strategy.check(MONITOR_ID)

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        `Monitor ${MONITOR_ID} or its HttpMonitor not found, skipping check`,
      )
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
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        expect.stringMatching(`Monitor ${MONITOR_ID} is down! Status code: 503.`),
      )
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
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        `Monitor ${MONITOR_ID} is down! Status code: null. Response time: 0. Error: fetch failed.`,
      )
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
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `Monitor ${MONITOR_ID} is down! Status code: null\\. Response time: \\d+\\. Error: unknown error\\.`,
            'i',
          ),
        ),
      )
    })

    it('warns and returns when the transaction fails with Prisma P2003', async () => {
      const prismaError = Object.assign(new Error('Foreign key constraint failed'), {
        code: 'P2003',
      })
      vi.mocked(mockPrisma.$transaction).mockRejectedValue(prismaError)

      await strategy.check(MONITOR_ID)

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        `Monitor ${MONITOR_ID} not found, skipping check`,
      )
      expect(Logger.prototype.error).not.toHaveBeenCalled()
    })

    it('logs an error with stack when the transaction fails with another Error', async () => {
      const dbError = new Error('transaction rolled back')
      vi.mocked(mockPrisma.$transaction).mockRejectedValue(dbError)

      await strategy.check(MONITOR_ID)

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Failed to handle check: ${dbError.message}`,
        dbError.stack,
      )
    })

    it('logs "unknown error" without stack when the transaction rejects a non-Error', async () => {
      vi.mocked(mockPrisma.$transaction).mockRejectedValue('db unavailable')

      await strategy.check(MONITOR_ID)

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringMatching(/failed to handle check: unknown error/i),
        undefined,
      )
    })
  })
})
