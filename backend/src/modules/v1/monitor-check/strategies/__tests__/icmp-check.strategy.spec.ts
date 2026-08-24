import { StatusEnum } from '@prisma/client'
import { ping } from 'node-ping-rs'
import { type MockInstance } from 'vitest'

import { Logger } from '@/shared/logger/logger.service'
import type { PrismaService } from '@/shared/prisma/prisma.service'

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
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('check()', () => {
    it('skips and returns down when monitor context is missing icmpMonitor', async () => {
      const result = await strategy.check({ id: 'monitor-1', type: 'ICMP' } as StrategyContext)

      expect(result.status).toBe(StatusEnum.down)
      expect(result.error).toBe('Monitor or IcmpMonitor not found')
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('calls performCheck with correct args when monitor exists', async () => {
      mockPing.mockResolvedValue({ success: true, time: BigInt(42) })

      await strategy.check(makeMonitorContext())

      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('performCheck() - success', () => {
    it('records status=up and uses ping time when finite', async () => {
      mockPing.mockResolvedValue({ success: true, time: 55 })

      await strategy.check(makeMonitorContext())

      expect(prisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: StatusEnum.up, error: null }),
        }),
      )
    })

    it('falls back to elapsed time when ping time is non-finite', async () => {
      mockPing.mockResolvedValue({ success: true, time: NaN })

      await strategy.check(makeMonitorContext())

      expect(prisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: StatusEnum.up,
            responseTime: expect.any(Number),
          }),
        }),
      )
    })
  })

  describe('performCheck() - failure', () => {
    it('records status=down when ping returns success=false', async () => {
      mockPing.mockResolvedValue({ success: false, error: 'unreachable' })

      await strategy.check(makeMonitorContext())

      expect(prisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: StatusEnum.down }) }),
      )
    })

    it('records status=down on ping rejection', async () => {
      mockPing.mockRejectedValue(new Error('socket error'))

      await strategy.check(makeMonitorContext())

      expect(prisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: StatusEnum.down }) }),
      )
    })

    it('resolves status=down on timeout', async () => {
      mockPing.mockReturnValue(new Promise(() => {}))

      const checkPromise = strategy.check(makeMonitorContext({ timeout: 100 }))
      await vi.runAllTimersAsync()
      await checkPromise

      expect(prisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: StatusEnum.down }) }),
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

      expect(prisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ error: expectedMsg }) }),
      )
    })
  })

  describe('confirmCheckResult()', () => {
    it('creates a check record and deletes old checks in one transaction', async () => {
      mockPing.mockResolvedValue({ success: true, time: 10 })

      await strategy.check(makeMonitorContext())

      expect(prisma.$transaction).toHaveBeenCalledTimes(1)

      expect(prisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ monitorId: 'monitor-1' }),
        }),
      )

      expect(prisma.check.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ monitorId: 'monitor-1' }),
        }),
      )
    })
  })
})
