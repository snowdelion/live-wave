import { StatusEnum } from '@prisma/client'
import type { Job, Queue } from 'bullmq'

import { BULL_KEYS, BULL_NAMES } from '@/shared/bull/bull.constants'
import { Logger } from '@/shared/logger/logger.service'
import type { PrismaService } from '@/shared/prisma/prisma.service'

import { MonitorCheckService } from '../monitor-check.service'

const MONITOR_ID = 'monitor-1'
const CHAT_ID = 'chat-1'
const CHECK_INTERVAL = 5

const makeMonitorRow = (overrides: { id?: string; checkInterval?: number } = {}) => ({
  id: MONITOR_ID,
  type: 'http',
  checkInterval: CHECK_INTERVAL,
  ...overrides,
})

const makeJob = (id: string, startsWith = true): Partial<Job> => ({
  id: startsWith ? `${BULL_KEYS.RAW_CHECK(MONITOR_ID)}-suffix` : `other-job-${id}`,
  remove: vi.fn().mockResolvedValue(undefined),
})

const mockPrisma = {
  monitor: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
} as unknown as PrismaService

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger),
} as unknown as Logger

const mockQueue = {
  add: vi.fn(),
  getJobs: vi.fn().mockResolvedValue([]),
} satisfies Partial<Queue> as unknown as Queue

const mockNotificationsQueue = {
  add: vi.fn(),
} satisfies Partial<Queue> as unknown as Queue

describe('MonitorCheckService', () => {
  let service: MonitorCheckService

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
    vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined)

    service = new MonitorCheckService(
      mockPrisma,
      mockQueue as unknown as Queue,
      mockNotificationsQueue as unknown as Queue,
      mockLogger,
    )
    Object.assign(service, {
      prisma: mockPrisma,
      checksQueue: mockQueue,
      notificationQueue: mockNotificationsQueue,
    })
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
    })
  })

  describe('scheduleNotification', () => {
    const notificationPayload = {
      chatId: CHAT_ID,
      monitorId: MONITOR_ID,
      message: 'Monitor is down',
      statusType: StatusEnum.down,
      monitorName: 'My Monitor',
    }

    beforeEach(() => {
      vi.mocked(mockNotificationsQueue.add).mockResolvedValue(undefined as unknown as Job<any>)
    })

    it('enqueues with the correct job name, payload, and jobId', async () => {
      await service.scheduleNotification(notificationPayload)

      expect(mockNotificationsQueue.add).toHaveBeenCalledWith(
        BULL_NAMES.SEND_NOTIFICATION,
        {
          chatId: CHAT_ID,
          message: notificationPayload.message,
          statusType: StatusEnum.down,
          monitorName: notificationPayload.monitorName,
        },
        {
          jobId: BULL_KEYS.SEND_NOTIFICATION(CHAT_ID, MONITOR_ID, StatusEnum.down),
        },
      )
    })

    it('does not include monitorId in the queue payload', async () => {
      await service.scheduleNotification(notificationPayload)

      const [, payload] = vi.mocked(mockNotificationsQueue.add).mock.calls[0] as any
      expect(payload).not.toHaveProperty('monitorId')
    })
  })

  describe('clearScheduledJobs', () => {
    it('queries both waiting and delayed states', async () => {
      vi.mocked(mockQueue.getJobs).mockResolvedValue([])

      await service.clearScheduledJobs(MONITOR_ID)

      expect(mockQueue.getJobs).toHaveBeenCalledWith(['waiting'])
      expect(mockQueue.getJobs).toHaveBeenCalledWith(['delayed'])
    })

    it('removes jobs whose id starts with the monitor prefix', async () => {
      const matchingJob = makeJob('1', true) as Job
      const otherJob = makeJob('2', false) as Job
      vi.mocked(mockQueue.getJobs).mockResolvedValue([matchingJob, otherJob])

      await service.clearScheduledJobs(MONITOR_ID)

      expect(matchingJob.remove).toHaveBeenCalled()
      expect(otherJob.remove).not.toHaveBeenCalled()
    })

    it('does not call remove on jobs whose id does not match the prefix', async () => {
      const otherJob = makeJob('2', false) as Job
      vi.mocked(mockQueue.getJobs).mockResolvedValue([otherJob])

      await service.clearScheduledJobs(MONITOR_ID)

      expect(otherJob.remove).not.toHaveBeenCalled()
    })

    it('skips removal when job has no id', async () => {
      const noIdJob = { id: undefined, remove: vi.fn() } as unknown as Job
      vi.mocked(mockQueue.getJobs).mockResolvedValue([noIdJob])

      await service.clearScheduledJobs(MONITOR_ID)

      expect(noIdJob.remove).not.toHaveBeenCalled()
    })
  })
})
