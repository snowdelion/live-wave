import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Monitor, MonitorType, StatusEnum } from '@prisma/client'
import { Job } from 'bullmq'

import { BULL_NAMES } from '@/shared/bull/bull.constants'
import { Logger } from '@/shared/logger/logger.service'
import { MetricsService } from '@/shared/metrics/metrics.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { RateLimitService } from '@/shared/rate-limit/rate-limit.service'
import { logAndThrow } from '@/shared/utils/error.utils'

import { MonitorCheckService } from './monitor-check.service'
import { formatNotificationMessage, getMonitorConfig, getTargetHost } from './monitor-check.utils'
import { DnsStrategy } from './strategies/dns-check.strategy'
import { HttpStrategy } from './strategies/http-check.strategy'
import { IcmpStrategy } from './strategies/icmp-check.strategy'
import { StrategyResult } from './strategies/strategy-result.types'
import { TcpStrategy } from './strategies/tcp-check.strategy'

@Processor(BULL_NAMES.QUEUE, { concurrency: 5 })
export class MonitorCheckProcessor extends WorkerHost {
  private logger: Logger
  constructor(
    private prisma: PrismaService,
    private httpStrategy: HttpStrategy,
    private tcpStrategy: TcpStrategy,
    private icmpStrategy: IcmpStrategy,
    private dnsStrategy: DnsStrategy,
    private monitorCheckService: MonitorCheckService,
    private rateLimitService: RateLimitService,
    private metricsService: MetricsService,
    baseLogger: Logger,
  ) {
    super()
    this.logger = baseLogger.child({ context: MonitorCheckProcessor.name })
  }

  async process(job: Job<{ monitorId: string }>): Promise<void> {
    const monitorId = job.data.monitorId
    let shouldReschedule = false

    try {
      const monitor = await this.prisma.monitor.findUnique({
        where: { id: monitorId },
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

      if (!monitor) {
        this.logger.warn('Monitor not found, skipping check', { monitorId })
        return
      }

      if (
        ![MonitorType.HTTP, MonitorType.TCP, MonitorType.ICMP, MonitorType.DNS].includes(
          monitor.type,
        )
      ) {
        this.logger.error('Unknown monitor type', { monitorType: monitor.type })
        return
      }

      const targetHost = getTargetHost(monitor)
      if (!targetHost) {
        this.logger.warn("Can't determine target host", { monitorId })
        return
      }

      const isRateLimited = await this.rateLimitService.domain({
        domain: targetHost,
        expireSeconds: 60,
        maxPerMinute: 6,
      })
      if (isRateLimited) {
        this.logger.warn('Rate limit exceeded for domain, skipping check', { domain: targetHost })
        return
      }

      shouldReschedule = true

      const monitorConfig = getMonitorConfig(monitor)

      const strategy = this.strategies[monitor.type]
      if (!strategy) {
        this.logger.error('Unknown monitor type', { monitorType: monitor.type })
        return
      }
      const { status, error, responseTime, checkedAt } = await strategy(monitorId)
      const checkConfig: CheckConfig = {
        status,
        error: error ?? null,
        responseTime,
        checkedAt,
      }

      await this.sendNotificationIfNeeded({
        monitorConfig,
        checkConfig,
        monitorId,
        oldLastStatus: monitor.lastStatus,
        monitor,
      })
      this.metricsService.incrementMonitorChecksRequest('success')
    } catch (e) {
      logAndThrow({
        logger: this.logger,
        context: `check monitor ${monitorId}`,
        e,
        shouldThrow: !shouldReschedule,
      })
      this.metricsService.incrementMonitorChecksRequest('failure')
    } finally {
      if (shouldReschedule) {
        await this.monitorCheckService.scheduleCheck({ monitorId, immediate: false })
      }
    }
  }

  private async sendNotificationIfNeeded({
    monitor,
    oldLastStatus,
    monitorConfig,
    checkConfig,
    monitorId,
  }: SendNotificationIfNeededOptions) {
    if (!oldLastStatus || oldLastStatus === checkConfig.status) return
    this.logger.log('Monitor status changed', {
      monitorId,
      monitorName: monitor.name,
      oldStatus: oldLastStatus,
      newStatus: checkConfig.status,
    })

    const alert = await this.prisma.alert.findUnique({
      where: { userId: monitor.userId },
      select: { enabled: true, telegramChatId: true },
    })
    if (!alert?.enabled || !alert.telegramChatId) return

    this.logger.debug('Trying to send Telegram notification', {
      monitorId,
      telegramId: alert.telegramChatId,
    })
    const message = formatNotificationMessage({
      monitorName: monitor.name,
      monitorType: monitor.type,
      monitorConfig,
      status: checkConfig.status,
      error: checkConfig.error,
      responseTime: checkConfig.responseTime,
      checkedAt: checkConfig.checkedAt,
    })

    await this.monitorCheckService.scheduleNotification({
      chatId: alert.telegramChatId,
      monitorId,
      message,
      statusType: checkConfig.status,
      monitorName: monitor.name,
    })
  }

  private readonly strategies: Record<MonitorType, (monitorId: string) => StrategyResult> = {
    [MonitorType.HTTP]: monitorId => this.httpStrategy.check(monitorId),
    [MonitorType.DNS]: monitorId => this.dnsStrategy.check(monitorId),
    [MonitorType.ICMP]: monitorId => this.icmpStrategy.check(monitorId),
    [MonitorType.TCP]: monitorId => this.tcpStrategy.check(monitorId),
  }
}

interface SendNotificationIfNeededOptions {
  monitor: Pick<Monitor, 'type' | 'name' | 'userId' | 'lastStatus'>
  oldLastStatus: StatusEnum | null
  monitorConfig: { url?: string; host?: string; port?: number }
  monitorId: string
  checkConfig: CheckConfig
}

interface CheckConfig {
  status: StatusEnum
  error: string | null
  responseTime: number | null
  checkedAt: Date
}
