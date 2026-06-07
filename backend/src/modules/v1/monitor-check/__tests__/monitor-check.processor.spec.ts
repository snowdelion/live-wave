import { Logger } from '@nestjs/common'
import { MonitorType, StatusEnum } from '@prisma/client'
import type { Job } from 'bullmq'

import type { PrismaService } from '@/backend/shared/prisma/prisma.service'
import type { RateLimitService } from '@/backend/shared/rate-limit/rate-limit.service'

import { MonitorCheckProcessor } from '../monitor-check.processor'
import type { MonitorCheckService } from '../monitor-check.service'
import type { HttpStrategy } from '../strategies/http-check.strategy'
import type { TcpStrategy } from '../strategies/tcp-check.strategy'

// --- helpers ---
const MONITOR_ID = 'monitor-1'
const CHECK_INTERVAL = 5
const HTTP_URL = 'https://example.com/health'
const HTTP_HOSTNAME = 'example.com'

const makeMonitorRow = (
  overrides: Partial<{
    id: string
    type: MonitorType
    checkInterval: number
    timeout: number
    lastStatus: StatusEnum | null
    clientId: string
    httpMonitor: { url: string } | null
    icmpMonitor: { host: string } | null
    tcpMonitor: { host: string } | null
  }> = {},
) => ({
  id: MONITOR_ID,
  type: MonitorType.HTTP,
  checkInterval: CHECK_INTERVAL,
  timeout: 5000,
  lastStatus: StatusEnum.up,
  clientId: 'client-1',
  httpMonitor: { url: HTTP_URL },
  icmpMonitor: null,
  tcpMonitor: null,
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
const mockTcpStrategy = {
  check: vi.fn(),
} satisfies Partial<TcpStrategy> as unknown as TcpStrategy

const mockMonitorCheckService = {
  scheduleCheck: vi.fn(),
} satisfies Partial<MonitorCheckService> as unknown as MonitorCheckService

const mockRateLimitService = {
  domain: vi.fn(),
} satisfies Partial<RateLimitService> as unknown as RateLimitService

// --- tests ---
describe('MonitorCheckProcessor', () => {
  let processor: MonitorCheckProcessor

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)

    vi.mocked(mockHttpStrategy.check).mockResolvedValue(undefined)
    vi.mocked(mockMonitorCheckService.scheduleCheck).mockResolvedValue(undefined)
    vi.mocked(mockRateLimitService.domain).mockResolvedValue(false)

    processor = new MonitorCheckProcessor(
      mockPrisma,
      mockHttpStrategy,
      mockTcpStrategy,
      mockMonitorCheckService,
      mockRateLimitService,
    )
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

    it('loads monitor with the expected select (including relation fields)', async () => {
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
          httpMonitor: true,
          icmpMonitor: true,
          tcpMonitor: true,
        },
      })
    })

    it('delegates HTTP checks to HttpStrategy when not rate-limited', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(makeMonitorRow() as never)

      await processor.process(makeJob())

      expect(mockHttpStrategy.check).toHaveBeenCalledWith(MONITOR_ID)
    })

    it('calls rateLimitService with the extracted hostname and correct config', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(makeMonitorRow() as never)

      await processor.process(makeJob())

      expect(mockRateLimitService.domain).toHaveBeenCalledWith({
        domain: HTTP_HOSTNAME,
        expireSeconds: 60,
        maxPerMinute: 6,
      })
    })

    it('skips the strategy but still reschedules when rate limit is exceeded', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(makeMonitorRow() as never)
      vi.mocked(mockRateLimitService.domain).mockResolvedValueOnce(true)

      await processor.process(makeJob())

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        `Rate limit exceeded for ${HTTP_HOSTNAME}, skipping check`,
      )
      expect(mockHttpStrategy.check).not.toHaveBeenCalled()
      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
        monitorId: MONITOR_ID,
        immediate: false,
      })
    })

    it('skips the strategy but still reschedules when target host cannot be determined', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
        makeMonitorRow({ httpMonitor: null }) as never,
      )

      await processor.process(makeJob())

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        `Can't determine target host for monitor ${MONITOR_ID}`,
      )
      expect(mockRateLimitService.domain).not.toHaveBeenCalled()
      expect(mockHttpStrategy.check).not.toHaveBeenCalled()
      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
        monitorId: MONITOR_ID,
        immediate: false,
      })
    })

    it('reschedules the next check via MonitorCheckService when check completes successfully', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(makeMonitorRow() as never)

      await processor.process(makeJob())

      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
        monitorId: MONITOR_ID,
        immediate: false,
      })
    })

    it('logs an error for unknown monitor types without calling HttpStrategy', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
        makeMonitorRow({
          type: MonitorType.ICMP,
          icmpMonitor: { host: 'icmp-host.example.com' },
          httpMonitor: null,
        }) as never,
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

    it('propagates when the initial findUnique throws and does not reschedule', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockRejectedValueOnce(new Error('DB exploded'))

      await expect(processor.process(makeJob())).rejects.toThrow('DB exploded')

      expect(mockHttpStrategy.check).not.toHaveBeenCalled()
      expect(mockMonitorCheckService.scheduleCheck).not.toHaveBeenCalled()
    })

    describe('ICMP monitor', () => {
      it('uses icmpMonitor.host as the rate-limit domain', async () => {
        const icmpHost = 'icmp-host.example.com'
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({
            type: MonitorType.ICMP,
            icmpMonitor: { host: icmpHost },
            httpMonitor: null,
          }) as never,
        )

        await processor.process(makeJob())

        expect(mockRateLimitService.domain).toHaveBeenCalledWith(
          expect.objectContaining({ domain: icmpHost }),
        )
      })

      it('skips strategy but still reschedules when icmpMonitor relation is null', async () => {
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({ type: MonitorType.ICMP, icmpMonitor: null, httpMonitor: null }) as never,
        )

        await processor.process(makeJob())

        expect(Logger.prototype.warn).toHaveBeenCalledWith(
          `Can't determine target host for monitor ${MONITOR_ID}`,
        )
        expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
          monitorId: MONITOR_ID,
          immediate: false,
        })
      })
    })

    describe('TCP monitor', () => {
      it('uses tcpMonitor.host as the rate-limit domain', async () => {
        const tcpHost = 'tcp-host.example.com'
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({
            type: MonitorType.TCP,
            tcpMonitor: { host: tcpHost },
            httpMonitor: null,
          }) as never,
        )

        await processor.process(makeJob())

        expect(mockRateLimitService.domain).toHaveBeenCalledWith(
          expect.objectContaining({ domain: tcpHost }),
        )
      })

      it('skips strategy but still reschedules when tcpMonitor relation is null', async () => {
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({ type: MonitorType.TCP, tcpMonitor: null, httpMonitor: null }) as never,
        )

        await processor.process(makeJob())

        expect(Logger.prototype.warn).toHaveBeenCalledWith(
          `Can't determine target host for monitor ${MONITOR_ID}`,
        )
        expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
          monitorId: MONITOR_ID,
          immediate: false,
        })
      })
    })
  })
})
