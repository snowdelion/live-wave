import { StatusEnum } from '@prisma/client'
import { ping } from 'node-ping-rs'
import { type MockInstance } from 'vitest'

import { Logger } from '@/shared/logger/logger.service'
import type { PrismaService } from '@/shared/prisma/prisma.service'

import { BaseCheckStrategy } from '../base-check.strategy'
import { IcmpStrategy } from '../icmp-check.strategy'
import type { StrategyContext } from '../strategy-result.types'

vi.mock('node-ping-rs', () => ({
  ping: vi.fn(),
}))

const mockPing = ping as unknown as MockInstance

const makePrisma = () =>
  ({
    monitor: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    check: {
      create: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn().mockResolvedValue([]),
  }) as unknown as PrismaService

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger),
} as unknown as Logger

const makeMonitorContext = (overrides = {}): StrategyContext =>
  ({
    id: 'monitor-1',
    type: 'ICMP',
    timeout: 5000,
    checkInterval: 1,
    icmpMonitor: { host: '1.2.3.4' },
    ...overrides,
  }) as unknown as StrategyContext

describe('IcmpStrategy', () => {
  let strategy: IcmpStrategy
  let prisma: ReturnType<typeof makePrisma>

  beforeEach(() => {
    vi.useFakeTimers()
    prisma = makePrisma()
    strategy = new IcmpStrategy(prisma, mockLogger)
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})

    vi.spyOn(BaseCheckStrategy.prototype as any as any, 'confirmCheckResult').mockResolvedValue(
      undefined,
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('check()', () => {
    it('skips and returns down when monitor context is missing icmpMonitor', async () => {
      const result = await strategy.check({ id: 'monitor-1', type: 'ICMP' } as StrategyContext)

      expect(result).toEqual({
        status: StatusEnum.down,
        error: 'Monitor or IcmpMonitor not found',
        responseTime: null,
        checkedAt: expect.any(Date),
      })
      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).not.toHaveBeenCalled()
    })

    it('calls performCheck and confirms result when monitor exists', async () => {
      mockPing.mockResolvedValue({ success: true, time: BigInt(42) })

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        {
          status: StatusEnum.up,
          responseTime: 0,
          error: null,
          details: { host: '1.2.3.4' },
        },
      )
    })
  })

  describe('performCheck() - success', () => {
    it('records status=up', async () => {
      mockPing.mockResolvedValue({ success: true, time: 55 })

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({ status: StatusEnum.up, error: null }),
      )
    })

    it('records responseTime as elapsed time', async () => {
      mockPing.mockResolvedValue({ success: true, time: NaN })

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({
          status: StatusEnum.up,
          responseTime: expect.any(Number),
        }),
      )
    })
  })

  describe('performCheck() - failure', () => {
    it('records status=down when ping returns success=false', async () => {
      mockPing.mockResolvedValue({ success: false, error: 'unreachable' })

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({
          status: StatusEnum.down,
          error: 'Network unreachable',
        }),
      )
    })

    it('records status=down on ping rejection', async () => {
      mockPing.mockRejectedValue(new Error('socket error'))

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({
          status: StatusEnum.down,
          error: 'No ping reply',
        }),
      )
    })

    it('resolves status=down on timeout', async () => {
      mockPing.mockReturnValue(new Promise(() => {}))

      const checkPromise = strategy.check(makeMonitorContext({ timeout: 100 }))
      await vi.runAllTimersAsync()
      await checkPromise

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({
          status: StatusEnum.down,
          error: 'Ping timeout after 100ms',
        }),
      )
    })
  })

  describe('error message classification', () => {
    const cases: Array<[string, string]> = [
      ['getaddrinfo ENOTFOUND example.com', 'DNS lookup failed'],
      ['DNS resolution failed', 'DNS lookup failed'],
      ['lookup error', 'DNS lookup failed'],
      ['timeout occurred', 'Ping timeout after 5000ms'],
      ['Network unreachable', 'Network unreachable'],
      ['permission denied', 'Permission denied'],
      ['some random error', 'No ping reply'],
      ['', 'No ping reply'],
    ]

    it.each(cases)('maps "%s" to "%s"', async (rawError, expectedMsg) => {
      mockPing.mockResolvedValue({ success: false, error: rawError })

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({ error: expectedMsg }),
      )
    })
  })

  describe('confirmCheckResult()', () => {
    it('is called with the correct payload on success', async () => {
      mockPing.mockResolvedValue({ success: true, time: 10 })

      await strategy.check(makeMonitorContext())

      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledTimes(1)
      expect((BaseCheckStrategy.prototype as any).confirmCheckResult).toHaveBeenCalledWith(
        'monitor-1',
        expect.objectContaining({
          status: StatusEnum.up,
          responseTime: 0,
          error: null,
          details: { host: '1.2.3.4' },
        }),
      )
    })
  })
})
