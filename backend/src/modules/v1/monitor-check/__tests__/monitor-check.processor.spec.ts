import { Logger } from '@nestjs/common'
import { MonitorType, StatusEnum } from '@prisma/client'
import type { Job } from 'bullmq'

import type { PrismaService } from '@/shared/prisma/prisma.service'
import type { RateLimitService } from '@/shared/rate-limit/rate-limit.service'

import { MonitorCheckProcessor } from '../monitor-check.processor'
import type { MonitorCheckService } from '../monitor-check.service'
import type { DnsStrategy } from '../strategies/dns-check.strategy'
import type { HttpStrategy } from '../strategies/http-check.strategy'
import type { IcmpStrategy } from '../strategies/icmp-check.strategy'
import type { TcpStrategy } from '../strategies/tcp-check.strategy'

// --- helpers ---
const MONITOR_ID = 'monitor-1'
const USER_ID = 'user-1'
const HTTP_URL = 'https://example.com/health'
const HTTP_HOSTNAME = 'example.com'

const makeMonitorRow = (
  overrides: Partial<{
    type: MonitorType
    lastStatus: StatusEnum | null
    userId: string
    name: string
    httpMonitor: { url: string } | null
    icmpMonitor: { host: string } | null
    tcpMonitor: { host: string; port?: number } | null
    dnsMonitor: { host: string } | null
  }> = {},
) => ({
  type: MonitorType.HTTP,
  lastStatus: StatusEnum.up,
  userId: USER_ID,
  name: 'My Monitor',
  httpMonitor: { url: HTTP_URL },
  icmpMonitor: null,
  tcpMonitor: null,
  dnsMonitor: null,
  ...overrides,
})

const makeStrategyResult = (
  overrides: Partial<{
    status: StatusEnum
    error: string | null
    responseTime: number | null
    checkedAt: Date
  }> = {},
) => ({
  status: StatusEnum.up,
  error: null,
  responseTime: 120,
  checkedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
})

function makeJob(monitorId = MONITOR_ID): Job<{ monitorId: string }> {
  return { data: { monitorId } } as Job<{ monitorId: string }>
}

const makeAlertRow = ({
  enabled = true,
  telegramChatId = 'chat-123',
}: {
  enabled?: boolean
  telegramChatId?: string | null
} = {}) => ({
  enabled,
  telegramChatId,
})

// --- mocks ---
const mockPrisma = {
  monitor: { findUnique: vi.fn() },
  alert: { findUnique: vi.fn() },
} as unknown as PrismaService

const mockHttpStrategy = {
  check: vi.fn(),
} satisfies Partial<HttpStrategy> as unknown as HttpStrategy
const mockTcpStrategy = { check: vi.fn() } satisfies Partial<TcpStrategy> as unknown as TcpStrategy
const mockIcmpStrategy = {
  check: vi.fn(),
} satisfies Partial<IcmpStrategy> as unknown as IcmpStrategy
const mockDnsStrategy = { check: vi.fn() } satisfies Partial<DnsStrategy> as unknown as DnsStrategy

const mockMonitorCheckService = {
  scheduleCheck: vi.fn(),
  scheduleNotification: vi.fn(),
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

    vi.mocked(mockPrisma.monitor.findUnique).mockReset()
    vi.mocked(mockPrisma.alert.findUnique).mockReset()
    vi.mocked(mockHttpStrategy.check).mockReset()
    vi.mocked(mockTcpStrategy.check).mockReset()
    vi.mocked(mockIcmpStrategy.check).mockReset()
    vi.mocked(mockDnsStrategy.check).mockReset()
    vi.mocked(mockMonitorCheckService.scheduleCheck).mockReset()
    vi.mocked(mockMonitorCheckService.scheduleNotification).mockReset()
    vi.mocked(mockRateLimitService.domain).mockReset()

    vi.mocked(mockRateLimitService.domain).mockResolvedValue(false)
    vi.mocked(mockHttpStrategy.check).mockResolvedValue(makeStrategyResult())
    vi.mocked(mockTcpStrategy.check).mockResolvedValue(makeStrategyResult())
    vi.mocked(mockIcmpStrategy.check).mockResolvedValue(makeStrategyResult())
    vi.mocked(mockDnsStrategy.check).mockResolvedValue(makeStrategyResult())

    processor = new MonitorCheckProcessor(
      mockPrisma,
      mockHttpStrategy,
      mockTcpStrategy,
      mockIcmpStrategy,
      mockDnsStrategy,
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
          type: true,
          name: true,
          userId: true,
          lastStatus: true,
          httpMonitor: true,
          icmpMonitor: true,
          tcpMonitor: true,
          dnsMonitor: true,
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

    it('skips the strategy and does not reschedule when rate limit is exceeded', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(makeMonitorRow() as never)
      vi.mocked(mockRateLimitService.domain).mockResolvedValueOnce(true)

      await processor.process(makeJob())

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        `Rate limit exceeded for ${HTTP_HOSTNAME}, skipping check`,
      )
      expect(mockHttpStrategy.check).not.toHaveBeenCalled()
      expect(mockMonitorCheckService.scheduleCheck).not.toHaveBeenCalled()
    })

    it('skips the strategy and does not reschedule when target host cannot be determined', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
        makeMonitorRow({ httpMonitor: null }) as never,
      )

      await processor.process(makeJob())

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        `Can't determine target host for monitor ${MONITOR_ID}`,
      )
      expect(mockRateLimitService.domain).not.toHaveBeenCalled()
      expect(mockHttpStrategy.check).not.toHaveBeenCalled()
      expect(mockMonitorCheckService.scheduleCheck).not.toHaveBeenCalled()
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
      const unknownType = 'invalid type' as unknown as MonitorType

      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
        makeMonitorRow({
          type: unknownType,
          icmpMonitor: { host: 'icmp-host.example.com' },
          httpMonitor: null,
        }) as never,
      )

      await processor.process(makeJob())

      expect(Logger.prototype.error).toHaveBeenCalledWith(`Unknown monitor type: ${unknownType}`)
      expect(mockHttpStrategy.check).not.toHaveBeenCalled()
      expect(mockMonitorCheckService.scheduleCheck).not.toHaveBeenCalled()
    })

    it('logs check failures (Error) without throwing and still reschedules', async () => {
      const err = new Error('strategy failed')
      vi.mocked(mockHttpStrategy.check).mockRejectedValue(err)
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
        makeMonitorRow({ type: MonitorType.HTTP }) as never,
      )

      await expect(processor.process(makeJob())).resolves.toBeUndefined()

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Failed to check monitor ${MONITOR_ID}: ${err.message}`,
        err.stack,
      )
      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledOnce()
    })

    it('logs "Unknown error" when a non-Error is thrown from the strategy', async () => {
      vi.mocked(mockHttpStrategy.check).mockRejectedValue('plain string rejection')
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(makeMonitorRow() as never)

      await expect(processor.process(makeJob())).resolves.toBeUndefined()

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Failed to check monitor ${MONITOR_ID}: Unknown error`,
        undefined,
      )
      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledOnce()
    })

    it('propagates when the initial findUnique throws and does not reschedule', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockRejectedValueOnce(new Error('DB exploded'))

      await expect(processor.process(makeJob())).rejects.toThrow('DB exploded')

      expect(mockHttpStrategy.check).not.toHaveBeenCalled()
      expect(mockMonitorCheckService.scheduleCheck).not.toHaveBeenCalled()
    })

    describe('notification on status change', () => {
      const setupStatusChange = ({
        oldStatus,
        newStatus,
        alertEnabled = true,
        telegramChatId = 'chat-123',
      }: {
        oldStatus: StatusEnum
        newStatus: StatusEnum
        alertEnabled?: boolean
        telegramChatId?: string | null
      }) => {
        const strategyResult = makeStrategyResult({
          status: newStatus,
          error: newStatus === StatusEnum.down ? 'connection refused' : null,
        })
        vi.mocked(mockHttpStrategy.check).mockResolvedValue(strategyResult)

        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({ lastStatus: oldStatus }) as never,
        )

        vi.mocked(mockPrisma.alert.findUnique).mockResolvedValueOnce(
          makeAlertRow({ enabled: alertEnabled, telegramChatId }) as never,
        )

        return strategyResult
      }

      it('schedules a notification when status changes from up to down', async () => {
        setupStatusChange({ oldStatus: StatusEnum.up, newStatus: StatusEnum.down })

        await processor.process(makeJob())

        expect(mockMonitorCheckService.scheduleNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            chatId: 'chat-123',
            monitorId: MONITOR_ID,
            statusType: StatusEnum.down,
            monitorName: 'My Monitor',
          }),
        )
      })

      it('schedules a notification when status changes from down to up', async () => {
        setupStatusChange({ oldStatus: StatusEnum.down, newStatus: StatusEnum.up })

        await processor.process(makeJob())

        expect(mockMonitorCheckService.scheduleNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            chatId: 'chat-123',
            monitorId: MONITOR_ID,
            statusType: StatusEnum.up,
            monitorName: 'My Monitor',
          }),
        )
      })

      it('does not send notification when status has not changed', async () => {
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({ lastStatus: StatusEnum.up }) as never,
        )

        await processor.process(makeJob())

        expect(mockMonitorCheckService.scheduleNotification).not.toHaveBeenCalled()
      })

      it('does not send notification when oldLastStatus is null', async () => {
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({ lastStatus: null }) as never,
        )

        await processor.process(makeJob())

        expect(mockMonitorCheckService.scheduleNotification).not.toHaveBeenCalled()
      })

      it('does not send notification when alert is disabled', async () => {
        setupStatusChange({
          oldStatus: StatusEnum.up,
          newStatus: StatusEnum.down,
          alertEnabled: false,
        })

        await processor.process(makeJob())

        expect(mockMonitorCheckService.scheduleNotification).not.toHaveBeenCalled()
      })

      it('does not send notification when telegramChatId is null', async () => {
        setupStatusChange({
          oldStatus: StatusEnum.up,
          newStatus: StatusEnum.down,
          telegramChatId: null,
        })

        await processor.process(makeJob())

        expect(mockMonitorCheckService.scheduleNotification).not.toHaveBeenCalled()
      })

      it('does not send notification when alert record does not exist', async () => {
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({ lastStatus: StatusEnum.up }) as never,
        )
        vi.mocked(mockHttpStrategy.check).mockResolvedValue(
          makeStrategyResult({ status: StatusEnum.down }),
        )
        vi.mocked(mockPrisma.alert.findUnique).mockResolvedValueOnce(null)

        await processor.process(makeJob())

        expect(mockMonitorCheckService.scheduleNotification).not.toHaveBeenCalled()
      })

      it('includes "down" wording in the notification message when status is down', async () => {
        setupStatusChange({ oldStatus: StatusEnum.up, newStatus: StatusEnum.down })

        await processor.process(makeJob())

        const call = vi.mocked(mockMonitorCheckService.scheduleNotification).mock.calls[0][0]
        expect(call.message).toContain('DOWN')
        expect(call.message).toContain('My Monitor')
        expect(call.message).toContain('Error details')
      })

      it('includes "up again" wording in the notification message when status recovers', async () => {
        setupStatusChange({ oldStatus: StatusEnum.down, newStatus: StatusEnum.up })

        await processor.process(makeJob())

        const call = vi.mocked(mockMonitorCheckService.scheduleNotification).mock.calls[0][0]
        expect(call.message).toContain('UP')
        expect(call.message).toContain('again')
        expect(call.message).toContain('Response time')
      })

      it('includes response time in message when status is up', async () => {
        vi.mocked(mockHttpStrategy.check).mockResolvedValue(
          makeStrategyResult({ status: StatusEnum.up, responseTime: 250 }),
        )
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({ lastStatus: StatusEnum.down }) as never,
        )
        vi.mocked(mockPrisma.alert.findUnique).mockResolvedValueOnce(
          makeAlertRow() as unknown as never,
        )

        await processor.process(makeJob())

        const call = vi.mocked(mockMonitorCheckService.scheduleNotification).mock.calls[0][0]
        expect(call.message).toContain('250 ms')
      })
    })

    describe('DNS monitor', () => {
      it('uses dnsMonitor.host as the rate-limit domain', async () => {
        const dnsHost = 'dns-host.example.com'
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({
            type: MonitorType.DNS,
            dnsMonitor: { host: dnsHost },
            httpMonitor: null,
          }) as never,
        )

        await processor.process(makeJob())

        expect(mockRateLimitService.domain).toHaveBeenCalledWith(
          expect.objectContaining({ domain: dnsHost }),
        )
      })

      it('delegates DNS checks to DnsStrategy', async () => {
        const dnsHost = 'dns-host.example.com'
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({
            type: MonitorType.DNS,
            dnsMonitor: { host: dnsHost },
            httpMonitor: null,
          }) as never,
        )

        await processor.process(makeJob())

        expect(mockDnsStrategy.check).toHaveBeenCalledWith(MONITOR_ID)
        expect(mockHttpStrategy.check).not.toHaveBeenCalled()
      })

      it('skips strategy and does not reschedule when dnsMonitor relation is null', async () => {
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({ type: MonitorType.DNS, dnsMonitor: null, httpMonitor: null }) as never,
        )

        await processor.process(makeJob())

        expect(Logger.prototype.warn).toHaveBeenCalledWith(
          `Can't determine target host for monitor ${MONITOR_ID}`,
        )
        expect(mockMonitorCheckService.scheduleCheck).not.toHaveBeenCalled()
      })
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

      it('delegates ICMP checks to IcmpStrategy', async () => {
        const icmpHost = 'icmp-host.example.com'
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({
            type: MonitorType.ICMP,
            icmpMonitor: { host: icmpHost },
            httpMonitor: null,
          }) as never,
        )

        await processor.process(makeJob())

        expect(mockIcmpStrategy.check).toHaveBeenCalledWith(MONITOR_ID)
        expect(mockHttpStrategy.check).not.toHaveBeenCalled()
      })

      it('skips strategy and does not reschedule when icmpMonitor relation is null', async () => {
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({ type: MonitorType.ICMP, icmpMonitor: null, httpMonitor: null }) as never,
        )

        await processor.process(makeJob())

        expect(Logger.prototype.warn).toHaveBeenCalledWith(
          `Can't determine target host for monitor ${MONITOR_ID}`,
        )
        expect(mockMonitorCheckService.scheduleCheck).not.toHaveBeenCalled()
      })
    })

    describe('TCP monitor', () => {
      it('uses tcpMonitor.host as the rate-limit domain', async () => {
        const tcpHost = 'tcp-host.example.com'
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({
            type: MonitorType.TCP,
            tcpMonitor: { host: tcpHost, port: 443 },
            httpMonitor: null,
          }) as never,
        )

        await processor.process(makeJob())

        expect(mockRateLimitService.domain).toHaveBeenCalledWith(
          expect.objectContaining({ domain: tcpHost }),
        )
      })

      it('delegates TCP checks to TcpStrategy', async () => {
        const tcpHost = 'tcp-host.example.com'
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({
            type: MonitorType.TCP,
            tcpMonitor: { host: tcpHost, port: 443 },
            httpMonitor: null,
          }) as never,
        )

        await processor.process(makeJob())

        expect(mockTcpStrategy.check).toHaveBeenCalledWith(MONITOR_ID)
        expect(mockHttpStrategy.check).not.toHaveBeenCalled()
      })

      it('includes host and port in monitor config for TCP notification message', async () => {
        const tcpHost = 'tcp-host.example.com'
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({
            type: MonitorType.TCP,
            lastStatus: StatusEnum.down,
            name: 'TCP Monitor',
            tcpMonitor: { host: tcpHost, port: 443 },
            httpMonitor: null,
          }) as never,
        )
        vi.mocked(mockTcpStrategy.check).mockResolvedValue(
          makeStrategyResult({ status: StatusEnum.up }),
        )
        vi.mocked(mockPrisma.alert.findUnique).mockResolvedValueOnce(
          makeAlertRow() as unknown as never,
        )

        await processor.process(makeJob())

        const call = vi.mocked(mockMonitorCheckService.scheduleNotification).mock.calls[0][0]
        expect(call.message).toContain(tcpHost)
        expect(call.message).toContain('443')
      })

      it('skips strategy and does not reschedule when tcpMonitor relation is null', async () => {
        vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValueOnce(
          makeMonitorRow({ type: MonitorType.TCP, tcpMonitor: null, httpMonitor: null }) as never,
        )

        await processor.process(makeJob())

        expect(Logger.prototype.warn).toHaveBeenCalledWith(
          `Can't determine target host for monitor ${MONITOR_ID}`,
        )
        expect(mockMonitorCheckService.scheduleCheck).not.toHaveBeenCalled()
      })
    })
  })
})
