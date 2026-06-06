import { Logger } from '@nestjs/common'
import type { Job, Queue } from 'bullmq'

import { BULL_KEYS, BULL_NAMES } from '@/backend/shared/bull/bull.constants'
import type { PrismaService } from '@/backend/shared/prisma/prisma.service'

import { MonitorCheckService } from '../monitor-check.service'

// --- helpers ---
const MONITOR_ID = 'monitor-1'
const CHECK_INTERVAL = 5

const makeMonitorRow = (overrides: { id?: string; checkInterval?: number } = {}) => ({
  id: MONITOR_ID,
  type: 'http',
  checkInterval: CHECK_INTERVAL,
  ...overrides,
})

// --- mocks ---
const mockPrisma = {
  monitor: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
} as unknown as PrismaService

const mockQueue = {
  add: vi.fn(),
  getJobs: vi.fn().mockResolvedValue([]),
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
    it('fetches due/null monitors and schedules each one', async () => {
      const monitors = [makeMonitorRow({ id: 'a' }), makeMonitorRow({ id: 'b' })]
      vi.mocked(mockPrisma.monitor.findMany).mockResolvedValue(monitors as any)
      vi.mocked(mockQueue.add).mockResolvedValue(undefined as unknown as Job<any>)

      await service.onModuleInit()

      expect(mockPrisma.monitor.findMany).toHaveBeenCalledOnce()
      expect(mockPrisma.monitor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
          select: expect.objectContaining({ id: true, checkInterval: true }),
        }),
      )
      expect(mockQueue.add).toHaveBeenCalledTimes(2)
    })

    it('passes immediate=false so delay is derived from checkInterval', async () => {
      vi.mocked(mockPrisma.monitor.findMany).mockResolvedValue([makeMonitorRow() as any])
      vi.mocked(mockQueue.add).mockResolvedValue(undefined as unknown as Job<any>)

      await service.onModuleInit()

      const [, , opts] = vi.mocked(mockQueue.add).mock.calls[0] as any
      expect(opts.delay).toBe(CHECK_INTERVAL * 60 * 1000)
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

    it('logs "unknown error" when a non-Error is thrown', async () => {
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
      vi.mocked(mockQueue.add).mockResolvedValue(undefined as unknown as Job<any>)
    })

    it('enqueues with the correct jobId and payload', async () => {
      await service.scheduleCheck({ monitorId: MONITOR_ID, checkInterval: CHECK_INTERVAL })

      expect(mockQueue.add).toHaveBeenCalledWith(
        BULL_NAMES.CHECK,
        { monitorId: MONITOR_ID },
        expect.objectContaining({
          jobId: expect.stringContaining(BULL_KEYS.RAW_CHECK(MONITOR_ID)),
        }),
      )
    })

    it('uses delay=0 when immediate=true', async () => {
      await service.scheduleCheck({
        monitorId: MONITOR_ID,
        checkInterval: CHECK_INTERVAL,
        immediate: true,
      })

      const [, , opts] = vi.mocked(mockQueue.add).mock.calls[0] as any
      expect(opts.delay).toBe(0)
    })

    it('uses delay derived from checkInterval when immediate=false (default)', async () => {
      await service.scheduleCheck({
        monitorId: MONITOR_ID,
        checkInterval: CHECK_INTERVAL,
        immediate: false,
      })

      const [, , opts] = vi.mocked(mockQueue.add).mock.calls[0] as any
      expect(opts.delay).toBe(CHECK_INTERVAL * 60 * 1000)
    })

    describe('when checkInterval is falsy (0 / not provided)', () => {
      it('fetches checkInterval from DB and uses it for the delay', async () => {
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(makeMonitorRow() as any)

        await service.scheduleCheck({ monitorId: MONITOR_ID, checkInterval: 0 })

        expect(mockPrisma.monitor.findUnique).toHaveBeenCalledWith({
          where: { id: MONITOR_ID },
          select: { checkInterval: true },
        })

        const [, , opts] = vi.mocked(mockQueue.add).mock.calls[0] as any
        expect(opts.delay).toBe(CHECK_INTERVAL * 60 * 1000)
      })

      it('does NOT enqueue when DB fetch throws', async () => {
        vi.mocked(mockPrisma.monitor.findUnique).mockRejectedValue(new Error('db blew up'))

        await service.scheduleCheck({ monitorId: MONITOR_ID, checkInterval: 0 })

        expect(mockQueue.add).not.toHaveBeenCalled()
      })

      it('does NOT enqueue when monitor is not found', async () => {
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(null)

        await service.scheduleCheck({ monitorId: MONITOR_ID, checkInterval: 0 })

        expect(mockQueue.add).not.toHaveBeenCalled()
      })

      it('logs an error (with stack) when the DB fetch throws an Error', async () => {
        const err = new Error('connection refused')
        vi.mocked(mockPrisma.monitor.findUnique).mockRejectedValue(err)

        await service.scheduleCheck({ monitorId: MONITOR_ID, checkInterval: 0 })

        expect(Logger.prototype.error).toHaveBeenCalledWith(
          `Failed to schedule check: ${err.message}`,
          err.stack,
        )
      })

      it('logs "unknown error" when a non-Error is thrown', async () => {
        vi.mocked(mockPrisma.monitor.findUnique).mockRejectedValue(42)

        await service.scheduleCheck({ monitorId: MONITOR_ID, checkInterval: 0 })

        expect(Logger.prototype.error).toHaveBeenCalledWith(
          'Failed to schedule check: unknown error',
          undefined,
        )
      })
    })
  })
})
