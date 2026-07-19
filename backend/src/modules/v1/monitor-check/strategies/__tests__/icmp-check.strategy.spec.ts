import { Logger } from '@nestjs/common'
import { StatusEnum } from '@prisma/client'
import { ping } from 'node-ping-rs'
import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

import type { PrismaService } from '@/shared/prisma/prisma.service'

import { IcmpStrategy } from '../icmp-check.strategy'

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
    },
    $transaction: vi.fn().mockResolvedValue([]),
  }) as unknown as PrismaService

const baseMonitor = {
  id: 'monitor-1',
  timeout: 5000,
  checkInterval: 1,
  icmpMonitor: { host: '1.2.3.4' },
}

describe('IcmpStrategy', () => {
  let strategy: IcmpStrategy
  let prisma: ReturnType<typeof makePrisma>

  beforeEach(() => {
    vi.useFakeTimers()
    prisma = makePrisma()
    strategy = new IcmpStrategy(prisma)
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('check()', () => {
    it('skips and warns when monitor is not found', async () => {
      prisma.monitor.findUnique = vi.fn().mockResolvedValue(null)
      const warn = vi.spyOn(Logger.prototype, 'warn')

      await strategy.check('missing-id')

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('missing-id'))
      expect(mockPing).not.toHaveBeenCalled()
    })

    it('skips when icmpMonitor relation is absent', async () => {
      prisma.monitor.findUnique = vi.fn().mockResolvedValue({ id: 'x', icmpMonitor: null })

      await strategy.check('x')

      expect(mockPing).not.toHaveBeenCalled()
    })

    it('calls performCheck with correct args when monitor exists', async () => {
      prisma.monitor.findUnique = vi.fn().mockResolvedValue(baseMonitor)
      mockPing.mockResolvedValue({ success: true, time: BigInt(42) })

      await strategy.check('monitor-1')

      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('performCheck() - success', () => {
    it('records status=up and uses ping time when finite', async () => {
      prisma.monitor.findUnique = vi.fn().mockResolvedValue(baseMonitor)
      mockPing.mockResolvedValue({ success: true, time: 55 })

      await strategy.check('monitor-1')

      expect(prisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: StatusEnum.up, error: null }),
        }),
      )
    })

    it('falls back to elapsed time when ping time is non-finite', async () => {
      prisma.monitor.findUnique = vi.fn().mockResolvedValue(baseMonitor)
      mockPing.mockResolvedValue({ success: true, time: NaN })

      await strategy.check('monitor-1')

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
      prisma.monitor.findUnique = vi.fn().mockResolvedValue(baseMonitor)
      mockPing.mockResolvedValue({ success: false, error: 'unreachable' })

      await strategy.check('monitor-1')

      expect(prisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: StatusEnum.down }) }),
      )
    })

    it('records status=down and logs when ping rejects', async () => {
      prisma.monitor.findUnique = vi.fn().mockResolvedValue(baseMonitor)
      mockPing.mockRejectedValue(new Error('socket error'))
      const warn = vi.spyOn(Logger.prototype, 'warn')

      await strategy.check('monitor-1')

      expect(prisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: StatusEnum.down }) }),
      )
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('is down'))
    })

    it('resolves status=down on timeout', async () => {
      prisma.monitor.findUnique = vi.fn().mockResolvedValue({ ...baseMonitor, timeout: 100 })
      mockPing.mockReturnValue(new Promise(() => {}))

      const checkPromise = strategy.check('monitor-1')
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
      ['timeout occurred', `Ping timeout after ${baseMonitor.timeout}ms`],
      ['Network unreachable', 'Network unreachable'],
      ['permission denied', 'Permission denied'],
      ['some random error', 'No ping reply'],
      ['', 'No ping reply'],
    ]

    it.each(cases)('maps "%s" → "%s"', async (rawError, expectedMsg) => {
      prisma.monitor.findUnique = vi.fn().mockResolvedValue(baseMonitor)
      mockPing.mockResolvedValue({ success: false, error: rawError })

      await strategy.check('monitor-1')

      expect(prisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ error: expectedMsg }) }),
      )
    })
  })

  describe('confirmTransaction()', () => {
    it('creates a check record and updates the monitor in one transaction', async () => {
      prisma.monitor.findUnique = vi.fn().mockResolvedValue(baseMonitor)
      mockPing.mockResolvedValue({ success: true, time: 10 })

      await strategy.check('monitor-1')

      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
      expect(prisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ monitorId: 'monitor-1' }) }),
      )
      expect(prisma.monitor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'monitor-1' },
          data: expect.objectContaining({
            lastStatus: StatusEnum.up,
            nextCheckAt: expect.any(Date),
            lastCheckedAt: expect.any(Date),
          }),
        }),
      )
    })

    it('sets nextCheckAt ~checkInterval minutes in the future', async () => {
      const checkInterval = 5
      prisma.monitor.findUnique = vi.fn().mockResolvedValue({ ...baseMonitor, checkInterval })
      mockPing.mockResolvedValue({ success: true, time: 10 })
      const before = Date.now()

      await strategy.check('monitor-1')

      const { data } = (prisma.monitor.update as unknown as MockInstance).mock.calls[0][0]
      const diff = data.nextCheckAt.getTime() - before
      expect(diff).toBeGreaterThanOrEqual(checkInterval * 60 * 1000 - 50)
      expect(diff).toBeLessThanOrEqual(checkInterval * 60 * 1000 + 50)
    })
  })
})
