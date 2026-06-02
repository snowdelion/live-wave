import { Logger } from '@nestjs/common'
import type { Monitor } from '@prisma/client'
import type { Job, Queue } from 'bull'

import { BULL_KEYS, BULL_NAMES } from '@/backend/shared/bull/bull.constants'
import type { PrismaService } from '@/backend/shared/prisma/prisma.service'

import { MonitorCheckService } from '../monitor-check.service'

// --- helpers ---
const makeMonitor = (overrides: Partial<Monitor> = {}): Monitor =>
  ({
    id: 'monitor-1',
    nextCheckAt: null,
    ...overrides,
  }) as Monitor

// --- mocks ---
const mockPrisma = {
  monitor: {
    findMany: vi.fn(),
  },
} as unknown as PrismaService

const mockQueue = {
  removeJobs: vi.fn(),
  add: vi.fn(),
} satisfies Partial<Queue> as unknown as Queue

// --- tests ---
describe('MonitorCheckService', () => {
  let service: MonitorCheckService

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)

    service = new MonitorCheckService(mockPrisma, mockQueue as unknown as Queue)

    Object.assign(service, { prisma: mockPrisma, checksQueue: mockQueue })
  })

  describe('onModuleInit', () => {
    it('fetches all monitors and schedules each one', async () => {
      const monitors = [makeMonitor({ id: 'a' }), makeMonitor({ id: 'b' })]
      vi.mocked(mockPrisma.monitor.findMany).mockResolvedValue(monitors)
      vi.mocked(mockQueue.removeJobs).mockResolvedValue(undefined)
      vi.mocked(mockQueue.add).mockResolvedValue(undefined as unknown as Job<any>)

      await service.onModuleInit()

      expect(mockPrisma.monitor.findMany).toHaveBeenCalledOnce()
      expect(mockQueue.add).toHaveBeenCalledTimes(2)
    })

    it('does nothing when there are no monitors', async () => {
      vi.mocked(mockPrisma.monitor.findMany).mockResolvedValue([])

      await service.onModuleInit()

      expect(mockQueue.add).not.toHaveBeenCalled()
    })

    it('logs an error (with stack) when prisma throws an Error', async () => {
      const err = new Error('db is down')
      vi.mocked(mockPrisma.monitor.findMany).mockRejectedValue(err)

      await service.onModuleInit()

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Failed to check monitors: ${err.message}`,
        err.stack,
      )
    })

    it('logs an error with "unknown error" when a non-Error is thrown', async () => {
      vi.mocked(mockPrisma.monitor.findMany).mockRejectedValue('some string error')

      await service.onModuleInit()

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Failed to check monitors: unknown error',
        undefined,
      )
    })
  })

  describe('scheduleCheck', () => {
    beforeEach(() => {
      vi.mocked(mockQueue.removeJobs).mockResolvedValue(undefined)
      vi.mocked(mockQueue.add).mockResolvedValue(undefined as unknown as Job<any>)
    })

    it('removes stale jobs then enqueues the monitor', async () => {
      const monitor = makeMonitor({ id: 'monitor-42' })

      await service.scheduleCheck(monitor)

      expect(mockQueue.removeJobs).toHaveBeenCalledWith(`${BULL_KEYS.RAW_CHECK(monitor.id)}-*`)
      expect(mockQueue.add).toHaveBeenCalledWith(
        BULL_NAMES.CHECK,
        monitor,
        expect.objectContaining({
          jobId: expect.stringContaining(BULL_KEYS.RAW_CHECK(monitor.id)),
        }),
      )
    })

    it('uses delay=0 when nextCheckAt is null (schedule immediately)', async () => {
      const monitor = makeMonitor({ nextCheckAt: null })

      await service.scheduleCheck(monitor)

      expect(mockQueue.add).toHaveBeenCalledWith(
        BULL_NAMES.CHECK,
        monitor,
        expect.objectContaining({ delay: 0 }),
      )
    })

    it('uses delay=0 when nextCheckAt is in the past', async () => {
      const past = new Date(Date.now() - 60_000)
      const monitor = makeMonitor({ nextCheckAt: past })

      await service.scheduleCheck(monitor)

      const { delay } = vi.mocked(mockQueue.add).mock.calls[0][2] as any
      expect(delay).toBe(0)
    })

    it('uses a positive delay when nextCheckAt is in the future', async () => {
      const future = new Date(Date.now() + 30_000)
      const monitor = makeMonitor({ nextCheckAt: future })

      await service.scheduleCheck(monitor)

      const { delay } = vi.mocked(mockQueue.add).mock.calls[0][2] as any
      expect(delay).toBeGreaterThan(0)
    })

    it('logs an error (with stack) when the queue throws an Error', async () => {
      const err = new Error('queue unavailable')
      vi.mocked(mockQueue.removeJobs).mockRejectedValue(err)

      await service.scheduleCheck(makeMonitor())

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Failed to check schedule monitors: ${err.message}`,
        err.stack,
      )
    })

    it('logs "unknown error" when a non-Error is thrown', async () => {
      vi.mocked(mockQueue.removeJobs).mockRejectedValue(42)

      await service.scheduleCheck(makeMonitor())

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Failed to check schedule monitors: unknown error',
        undefined,
      )
    })
  })
})
