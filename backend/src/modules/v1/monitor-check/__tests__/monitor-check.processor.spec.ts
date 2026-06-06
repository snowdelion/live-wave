import { Logger } from '@nestjs/common'
import { MonitorType, StatusEnum } from '@prisma/client'
import type { Job } from 'bullmq'

import type { PrismaService } from '@/backend/shared/prisma/prisma.service'

import { MonitorCheckProcessor } from '../monitor-check.processor'
import type { MonitorCheckService } from '../monitor-check.service'
import type { HttpStrategy } from '../strategies/http-check.strategy'

// --- helpers ---
const MONITOR_ID = 'monitor-1'
const CHECK_INTERVAL = 5

const makeMonitorRow = (
  overrides: Partial<{
    id: string
    type: MonitorType
    checkInterval: number
    timeout: number
    lastStatus: StatusEnum | null
    clientId: string
  }> = {},
) => ({
  id: MONITOR_ID,
  type: MonitorType.HTTP,
  checkInterval: CHECK_INTERVAL,
  timeout: 5000,
  lastStatus: StatusEnum.up,
  clientId: 'client-1',
  ...overrides,
})

function makeJob(monitorId = MONITOR_ID): Job<{ monitorId: string }> {
  return { data: { monitorId } } as Job<{ monitorId: string }>
}

// --- mocks ---
const mockPrisma = {
  monitor: {
    findUnique: vi.fn(),
  },
} as unknown as PrismaService

const mockHttpStrategy = {
  check: vi.fn(),
} satisfies Partial<HttpStrategy> as unknown as HttpStrategy

const mockMonitorCheckService = {
  scheduleCheck: vi.fn(),
} satisfies Partial<MonitorCheckService> as unknown as MonitorCheckService

// --- tests ---
describe('MonitorCheckProcessor', () => {
  let processor: MonitorCheckProcessor

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)

    vi.mocked(mockHttpStrategy.check).mockResolvedValue(undefined)
    vi.mocked(mockMonitorCheckService.scheduleCheck).mockResolvedValue(undefined)

    processor = new MonitorCheckProcessor(mockPrisma, mockHttpStrategy, mockMonitorCheckService)
  })

  describe('process', () => {
    it('skips check and does not reschedule when monitor is not found', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(null)

      await processor.process(makeJob())

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        `Monitor ${MONITOR_ID} not found, skipping check`,
      )
      expect(mockPrisma.monitor.findUnique).toHaveBeenCalledOnce()
      expect(mockHttpStrategy.check).not.toHaveBeenCalled()
      expect(mockMonitorCheckService.scheduleCheck).not.toHaveBeenCalled()
    })

    it('loads monitor with the expected select and delegates HTTP checks to HttpStrategy', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(makeMonitorRow() as never)

      await processor.process(makeJob())

      expect(mockPrisma.monitor.findUnique).toHaveBeenCalledWith({
        where: { id: MONITOR_ID },
        select: {
          id: true,
          type: true,
          checkInterval: true,
          timeout: true,
          lastStatus: true,
          clientId: true,
        },
      })
      expect(mockHttpStrategy.check).toHaveBeenCalledWith(MONITOR_ID)
    })

    it('reschedules the next check via MonitorCheckService when monitor exists', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(makeMonitorRow() as never)

      await processor.process(makeJob())

      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
        monitorId: MONITOR_ID,
        immediate: false,
      })
    })

    it('logs an error for unknown monitor types without calling HttpStrategy', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
        makeMonitorRow({ type: MonitorType.ICMP }) as never,
      )

      await processor.process(makeJob())

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Unknown monitor type: ${MonitorType.ICMP}`,
      )
      expect(mockHttpStrategy.check).not.toHaveBeenCalled()
      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledOnce()
    })

    it('logs check failures (Error) without throwing and still reschedules', async () => {
      const err = new Error('strategy failed')
      vi.mocked(mockHttpStrategy.check).mockRejectedValue(err)
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(makeMonitorRow() as never)

      await expect(processor.process(makeJob())).resolves.toBeUndefined()

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Failed to check monitor ${MONITOR_ID}: ${err.message}`,
        err.stack,
      )
      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledOnce()
    })

    it('logs "unknown error" when a non-Error is thrown from the strategy', async () => {
      vi.mocked(mockHttpStrategy.check).mockRejectedValue('plain string rejection')
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(makeMonitorRow() as never)

      await expect(processor.process(makeJob())).resolves.toBeUndefined()

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Failed to check monitor ${MONITOR_ID}: unknown error`,
        undefined,
      )
    })

    it('propagates when the initial findUnique throws (finally is not reached)', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockRejectedValueOnce(new Error('DB exploded'))

      await expect(processor.process(makeJob())).rejects.toThrow('DB exploded')

      expect(mockHttpStrategy.check).not.toHaveBeenCalled()
      expect(mockMonitorCheckService.scheduleCheck).not.toHaveBeenCalled()
    })
  })
})
