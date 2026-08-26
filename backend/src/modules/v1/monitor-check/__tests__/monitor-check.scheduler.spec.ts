import { MonitorType, StatusEnum } from '@prisma/client'

import type { Logger } from '@/shared/logger/logger.service'
import type { MetricsService } from '@/shared/metrics/metrics.service'
import type { PrismaService } from '@/shared/prisma/prisma.service'
import type { RateLimitService } from '@/shared/rate-limit/rate-limit.service'

import { MonitorCheckScheduler } from '../monitor-check.scheduler'
import type { MonitorCheckService } from '../monitor-check.service'
import * as monitorCheckUtils from '../monitor-check.utils'
import type { DnsStrategy } from '../strategies/dns-check.strategy'
import type { HttpStrategy } from '../strategies/http-check.strategy'
import type { IcmpStrategy } from '../strategies/icmp-check.strategy'
import type { TcpStrategy } from '../strategies/tcp-check.strategy'

vi.mock('p-limit', () => ({
  default: vi.fn(() => (fn: () => any) => fn()),
}))

vi.mock('@/shared/utils/error.utils', () => ({
  getErrorMessage: vi.fn((e: any) => (e instanceof Error ? e.message : String(e))),
}))

vi.mock('../monitor-check.utils', () => ({
  getTargetHost: vi.fn(),
  getMonitorConfig: vi.fn(),
  formatNotificationMessage: vi.fn(),
}))

describe('MonitorCheckScheduler', () => {
  let scheduler: MonitorCheckScheduler
  let mockPrisma: ReturnType<typeof createMockPrisma>
  let mockHttpStrategy: any
  let mockTcpStrategy: any
  let mockIcmpStrategy: any
  let mockDnsStrategy: any
  let mockMonitorCheckService: any
  let mockRateLimitService: any
  let mockMetricsService: any
  let mockLogger: any

  function createMockPrisma() {
    return {
      monitor: {
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
      alert: {
        findUnique: vi.fn(),
      },
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockPrisma = createMockPrisma()
    mockHttpStrategy = { check: vi.fn() }
    mockTcpStrategy = { check: vi.fn() }
    mockIcmpStrategy = { check: vi.fn() }
    mockDnsStrategy = { check: vi.fn() }
    mockMonitorCheckService = { scheduleNotification: vi.fn() }
    mockRateLimitService = { domain: vi.fn().mockResolvedValue(false) }
    mockMetricsService = { incrementMonitorChecksRequest: vi.fn() }

    mockLogger = {
      child: vi.fn().mockReturnThis(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      log: vi.fn(),
    }

    scheduler = new MonitorCheckScheduler(
      mockPrisma as unknown as PrismaService,
      mockHttpStrategy as unknown as HttpStrategy,
      mockTcpStrategy as unknown as TcpStrategy,
      mockIcmpStrategy as unknown as IcmpStrategy,
      mockDnsStrategy as unknown as DnsStrategy,
      mockMonitorCheckService as unknown as MonitorCheckService,
      mockRateLimitService as unknown as RateLimitService,
      mockMetricsService as unknown as MetricsService,
      mockLogger as unknown as Logger,
    )
  })

  describe('checkMonitors', () => {
    it('should return early if isProcessing is true', async () => {
      ;(scheduler as any).isProcessing = true

      await scheduler.checkMonitors()

      expect(mockLogger.warn).toHaveBeenCalledWith('Previous check still running')
      expect(mockPrisma.monitor.findMany).not.toHaveBeenCalled()
    })

    it('should return early if no monitors are due', async () => {
      mockPrisma.monitor.findMany.mockResolvedValue([])

      await scheduler.checkMonitors()

      expect(mockLogger.debug).toHaveBeenCalledWith('No monitors due for check')
    })

    it('should process due monitors concurrently', async () => {
      const dueMonitors = [
        { id: '1', type: MonitorType.HTTP, checkInterval: 1, lastStatus: StatusEnum.up },
        { id: '2', type: MonitorType.HTTP, checkInterval: 1, lastStatus: StatusEnum.down },
      ]
      mockPrisma.monitor.findMany.mockResolvedValue(dueMonitors)
      mockHttpStrategy.check.mockResolvedValue({
        status: StatusEnum.up,
        error: null,
        responseTime: 10,
        checkedAt: new Date(),
      })

      vi.mocked(monitorCheckUtils.getTargetHost).mockReturnValue('example.com')
      vi.mocked(monitorCheckUtils.getMonitorConfig).mockReturnValue({})
      vi.spyOn(scheduler as any, 'sendNotificationIfNeeded').mockResolvedValue(undefined)

      await scheduler.checkMonitors()

      expect(mockPrisma.monitor.findMany).toHaveBeenCalled()
      expect(mockHttpStrategy.check).toHaveBeenCalledTimes(2)
      expect(mockPrisma.monitor.updateMany).toHaveBeenCalledTimes(2)
      expect((scheduler as any).isProcessing).toBe(false)
    })

    it('should catch fatal errors, log them, and reset isProcessing', async () => {
      mockPrisma.monitor.findMany.mockRejectedValue(new Error('DB connection lost'))

      await scheduler.checkMonitors()

      expect(mockLogger.error).toHaveBeenCalledWith('Fatal error in monitor scheduler', {
        error: 'DB connection lost',
      })
      expect((scheduler as any).isProcessing).toBe(false)
    })
  })

  describe('process', () => {
    it('should update monitor with lastCheckedAt, nextCheckAt, and lastStatus on success', async () => {
      const monitor = {
        id: '1',
        type: MonitorType.HTTP,
        checkInterval: 5,
        lastStatus: StatusEnum.up,
      } as any
      vi.spyOn(scheduler as any, 'checkSingleMonitor').mockResolvedValue(StatusEnum.up)

      await (scheduler as any).process(monitor)

      expect(mockLogger.debug).toHaveBeenCalledWith('Monitor checked successfully', {
        monitorId: '1',
      })
      expect(mockPrisma.monitor.updateMany).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          lastStatus: StatusEnum.up,
        }),
      })
    })

    it('should handle checkSingleMonitor errors, log, increment failure metric, but still update monitor', async () => {
      const monitor = {
        id: '1',
        type: MonitorType.HTTP,
        checkInterval: 5,
        lastStatus: StatusEnum.up,
      } as any
      vi.spyOn(scheduler as any, 'checkSingleMonitor').mockRejectedValue(new Error('Check failed'))

      await (scheduler as any).process(monitor)

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to check monitor', {
        monitorId: '1',
        error: 'Check failed',
      })
      expect(mockMetricsService.incrementMonitorChecksRequest).toHaveBeenCalledWith('failure')
      expect(mockPrisma.monitor.updateMany).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          lastStatus: StatusEnum.down,
        }),
      })
    })
  })

  describe('checkSingleMonitor', () => {
    const baseMonitor = {
      id: '1',
      type: MonitorType.HTTP,
      name: 'Test Monitor',
      userId: 'u1',
      timeout: 5000,
      lastStatus: StatusEnum.up,
      checkInterval: 5,
      httpMonitor: { url: 'https://example.com' },
    } as any

    it('should return down and log error for unknown monitor type', async () => {
      const unknownMonitor = { ...baseMonitor, type: 'UNKNOWN' }

      const result = await (scheduler as any).checkSingleMonitor(unknownMonitor)

      expect(result).toBe(StatusEnum.down)
      expect(mockLogger.error).toHaveBeenCalledWith('Unknown monitor type', {
        monitorType: 'UNKNOWN',
        monitorId: '1',
      })
    })

    it('should return down and log warn if target host cannot be determined', async () => {
      vi.mocked(monitorCheckUtils.getTargetHost).mockReturnValue(null)

      const result = await (scheduler as any).checkSingleMonitor(baseMonitor)

      expect(result).toBe(StatusEnum.down)
      expect(mockLogger.warn).toHaveBeenCalledWith("Can't determine target host", {
        monitorId: '1',
      })
    })

    it('should return down if rate limited', async () => {
      vi.mocked(monitorCheckUtils.getTargetHost).mockReturnValue('example.com')
      mockRateLimitService.domain.mockResolvedValue(true)

      const result = await (scheduler as any).checkSingleMonitor(baseMonitor)

      expect(result).toBe(StatusEnum.down)
      expect(mockLogger.debug).toHaveBeenCalledWith('Rate limit exceeded, skipping', {
        domain: 'example.com',
        monitorId: '1',
      })
    })

    it('should execute strategy, send notification if needed, increment success metric, and return status', async () => {
      vi.mocked(monitorCheckUtils.getTargetHost).mockReturnValue('example.com')
      vi.mocked(monitorCheckUtils.getMonitorConfig).mockReturnValue({ url: 'https://example.com' })
      mockHttpStrategy.check.mockResolvedValue({
        status: StatusEnum.up,
        error: null,
        responseTime: 50,
        checkedAt: new Date(),
      })
      vi.spyOn(scheduler as any, 'sendNotificationIfNeeded').mockResolvedValue(undefined)

      const result = await (scheduler as any).checkSingleMonitor(baseMonitor)

      expect(result).toBe(StatusEnum.up)
      expect(mockHttpStrategy.check).toHaveBeenCalledWith(baseMonitor)
      expect(mockMetricsService.incrementMonitorChecksRequest).toHaveBeenCalledWith('success')
    })
  })

  describe('sendNotificationIfNeeded', () => {
    const monitor = {
      id: '1',
      type: MonitorType.HTTP,
      name: 'Test',
      userId: 'u1',
      lastStatus: StatusEnum.up,
    }
    const monitorConfig = { url: 'https://example.com' }
    const checkConfig = {
      status: StatusEnum.down,
      error: 'Timeout',
      responseTime: null,
      checkedAt: new Date(),
    }

    it('should return early if oldLastStatus is null or equals checkConfig.status', async () => {
      await (scheduler as any).sendNotificationIfNeeded({
        monitor: monitor as any,
        oldLastStatus: null,
        monitorConfig,
        checkConfig,
        monitorId: '1',
      })
      expect(mockPrisma.alert.findUnique).not.toHaveBeenCalled()
    })

    it('should return early if alert is not enabled or has no telegramChatId', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({ enabled: false, telegramChatId: null })

      await (scheduler as any).sendNotificationIfNeeded({
        monitor: monitor as any,
        oldLastStatus: StatusEnum.up,
        monitorConfig,
        checkConfig,
        monitorId: '1',
      })

      expect(mockMonitorCheckService.scheduleNotification).not.toHaveBeenCalled()
    })

    it('should schedule notification if status changed and alert is enabled with telegramChatId', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({ enabled: true, telegramChatId: '12345' })
      vi.mocked(monitorCheckUtils.formatNotificationMessage).mockReturnValue(
        'Test notification message',
      )

      await (scheduler as any).sendNotificationIfNeeded({
        monitor: monitor as any,
        oldLastStatus: StatusEnum.up,
        monitorConfig,
        checkConfig,
        monitorId: '1',
      })

      expect(mockLogger.log).toHaveBeenCalledWith('Monitor status changed', expect.any(Object))
      expect(mockMonitorCheckService.scheduleNotification).toHaveBeenCalledWith({
        chatId: '12345',
        monitorId: '1',
        message: 'Test notification message',
        statusType: StatusEnum.down,
      })
    })
  })
})
