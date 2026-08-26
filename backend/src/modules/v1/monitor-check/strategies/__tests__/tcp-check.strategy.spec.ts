import net from 'net'

import { StatusEnum } from '@prisma/client'

import type { Logger } from '@/shared/logger/logger.service'
import type { PrismaService } from '@/shared/prisma/prisma.service'

import { BaseCheckStrategy } from '../base-check.strategy'
import type { StrategyContext } from '../strategy-result.types'
import { TcpStrategy } from '../tcp-check.strategy'

vi.mock('net', () => {
  return {
    default: {
      Socket: vi.fn().mockImplementation(() => ({
        setTimeout: vi.fn(),
        destroy: vi.fn(),
        once: vi.fn(),
        connect: vi.fn(),
      })),
    },
  }
})

const mockPrisma = {
  monitor: { findUnique: vi.fn(), update: vi.fn() },
  check: { create: vi.fn(), deleteMany: vi.fn() },
  $transaction: vi.fn(),
} as unknown as PrismaService

const makeMonitorContext = (overrides = {}): StrategyContext =>
  ({
    id: 'monitor-1',
    type: 'TCP',
    timeout: 5000,
    checkInterval: 5,
    tcpMonitor: { host: 'example.com', port: 80 },
    ...overrides,
  }) as unknown as StrategyContext

function setupSocket(triggerEvent: 'connect' | 'error' | 'timeout', errorArg?: unknown) {
  const MockSocket = vi.mocked(net.Socket)
  MockSocket.mockImplementation(() => {
    const handlers: Record<string, (...args: unknown[]) => void> = {}
    return {
      setTimeout: vi.fn(),
      destroy: vi.fn(),
      once: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        handlers[event] = cb
      }),
      connect: vi.fn((_port: number, _host: string, cb: () => void) => {
        if (triggerEvent === 'connect') cb()
        else if (triggerEvent === 'timeout') handlers['timeout']?.()
        else if (triggerEvent === 'error')
          handlers['error']?.(errorArg ?? new Error('ECONNREFUSED'))
      }),
    } as any
  })
}

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger),
} as unknown as Logger

describe('TcpStrategy', () => {
  let strategy: TcpStrategy

  beforeEach(() => {
    vi.clearAllMocks()
    strategy = new TcpStrategy(mockPrisma, mockLogger)

    vi.spyOn(BaseCheckStrategy.prototype as any as any, 'confirmCheckResult').mockResolvedValue(
      undefined,
    )
  })

  describe('check()', () => {
    it('warns and returns down when monitor context is missing tcpMonitor', async () => {
      const result = await strategy.check({ id: 'monitor-1', type: 'TCP' } as StrategyContext)

      expect(result).toEqual({
        status: StatusEnum.down,
        error: 'Monitor or TcpMonitor not found',
        responseTime: null,
        checkedAt: expect.any(Date),
      })
      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).not.toHaveBeenCalled()
    })

    it('performs check with correct context', async () => {
      setupSocket('connect')
      const monitorCtx = makeMonitorContext()

      await strategy.check(monitorCtx)

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        {
          status: StatusEnum.up,
          error: null,
          responseTime: expect.any(Number),
          details: { host: 'example.com', port: 80 },
        },
      )
    })
  })

  describe('performCheck() - successful connection', () => {
    beforeEach(() => setupSocket('connect'))

    it('records status=up', async () => {
      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({ status: StatusEnum.up }),
      )
    })

    it('records a non-null responseTime', async () => {
      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({ responseTime: expect.any(Number) }),
      )
    })

    it('records null error on success', async () => {
      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({ error: null }),
      )
    })
  })

  describe('performCheck() - connection error', () => {
    it('records status=down on socket error', async () => {
      setupSocket('error', new Error('ECONNREFUSED'))

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({ status: StatusEnum.down }),
      )
    })

    it('captures the error message', async () => {
      setupSocket('error', new Error('ECONNREFUSED'))

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({ error: expect.stringMatching(/connection refused by/i) }),
      )
    })

    it('handles non-Error throws gracefully', async () => {
      setupSocket('error', 'string-error')

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({
          status: StatusEnum.down,
          error: expect.stringMatching(/failed to connect|example\.com:80|string-error/i),
        }),
      )
    })
  })

  describe('performCheck() - timeout', () => {
    it('records status=down on timeout', async () => {
      setupSocket('timeout')

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({ status: StatusEnum.down }),
      )
    })

    it('includes timeout duration in the error message', async () => {
      setupSocket('timeout')

      await strategy.check(makeMonitorContext({ timeout: 3000 }))

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({ error: expect.stringContaining('3000ms') }),
      )
    })
  })

  describe('confirmCheckResult()', () => {
    it('is called with the correct payload on success', async () => {
      setupSocket('connect')

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledTimes(1)
      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({
          status: StatusEnum.up,
          responseTime: expect.any(Number),
          error: null,
          details: { host: 'example.com', port: 80 },
        }),
      )
    })
  })
})
