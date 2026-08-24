import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { Monitor, MonitorType, StatusEnum } from '@prisma/client'
import pLimit from 'p-limit'

import { Logger } from '@/shared/logger/logger.service'
import { MetricsService } from '@/shared/metrics/metrics.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { RateLimitService } from '@/shared/rate-limit/rate-limit.service'
import { getErrorMessage } from '@/shared/utils/error.utils'

import { MonitorCheckService } from './monitor-check.service'
import { formatNotificationMessage, getMonitorConfig, getTargetHost } from './monitor-check.utils'
import { DnsStrategy } from './strategies/dns-check.strategy'
import { HttpStrategy } from './strategies/http-check.strategy'
import { IcmpStrategy } from './strategies/icmp-check.strategy'
import { CheckStrategy, StrategyContext } from './strategies/strategy-result.types'
import { TcpStrategy } from './strategies/tcp-check.strategy'

@Injectable()
export class MonitorCheckScheduler {
  private isProcessing = false
  private logger: Logger
  private readonly strategies: Record<MonitorType, CheckStrategy>
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
    this.logger = baseLogger.child({ context: MonitorCheckScheduler.name })
    this.strategies = {
      [MonitorType.HTTP]: this.httpStrategy,
      [MonitorType.DNS]: this.dnsStrategy,
      [MonitorType.ICMP]: this.icmpStrategy,
      [MonitorType.TCP]: this.tcpStrategy,
    }
  }

  @Cron('*/15 * * * * *', { name: 'monitor-check-every-15s', timeZone: 'UTC' })
  async checkMonitors() {
    if (this.isProcessing) {
      this.logger.warn('Previous check still running')
      return
    }
    this.isProcessing = true

    try {
      const dueMonitors = await this.getDueMonitors()
      if (dueMonitors.length === 0) {
        this.logger.debug('No monitors due for check')
        return
      }
      const limit = pLimit(5)
      await Promise.all(dueMonitors.map(m => limit(() => this.process(m))))
    } catch (e) {
      this.logger.error('Fatal error in monitor scheduler', {
        error: getErrorMessage(e),
      })
    } finally {
      this.isProcessing = false
    }
  }

  private async getDueMonitors() {
    return await this.prisma.monitor.findMany({
      where: {
        OR: [{ nextCheckAt: null }, { nextCheckAt: { lte: new Date(Date.now() + 1000) } }],
      },
      select: {
        id: true,
        type: true,
        name: true,
        userId: true,
        timeout: true,
        lastStatus: true,
        checkInterval: true,
        lastCheckedAt: true,
        httpMonitor: true,
        dnsMonitor: true,
        tcpMonitor: true,
        icmpMonitor: true,
      },
      take: 30,
      orderBy: { nextCheckAt: 'asc' },
    })
  }

  private async process(monitor: StrategyContext) {
    const now = new Date()
    now.setMilliseconds(0)
    let lastStatus: StatusEnum = StatusEnum.down
    try {
      lastStatus = await this.checkSingleMonitor(monitor)

      this.logger.debug('Monitor checked successfully', { monitorId: monitor.id })
    } catch (e) {
      this.logger.error('Failed to check monitor', {
        monitorId: monitor.id,
        error: getErrorMessage(e),
      })
      this.metricsService.incrementMonitorChecksRequest('failure')
    } finally {
      const nextCheckAt = new Date(now.getTime() + monitor.checkInterval * 60 * 1000)
      await this.prisma.monitor.update({
        where: { id: monitor.id },
        data: {
          lastCheckedAt: now,
          nextCheckAt,
          lastStatus,
        },
      })
    }
  }

  private async checkSingleMonitor(monitor: StrategyContext) {
    const monitorId = monitor.id
    if (
      ![MonitorType.HTTP, MonitorType.TCP, MonitorType.ICMP, MonitorType.DNS].includes(monitor.type)
    ) {
      this.logger.error('Unknown monitor type', {
        monitorType: monitor.type,
        monitorId,
      })
      return StatusEnum.down
    }

    const targetHost = getTargetHost(monitor)
    if (!targetHost) {
      this.logger.warn("Can't determine target host", { monitorId })
      return StatusEnum.down
    }

    const isRateLimited = await this.rateLimitService.domain({
      domain: targetHost,
      expireSeconds: 60,
      maxPerMinute: 6,
    })
    if (isRateLimited) {
      this.logger.debug('Rate limit exceeded, skipping', {
        domain: targetHost,
        monitorId,
      })
      return StatusEnum.down
    }

    const strategy = this.strategies[monitor.type]
    const { status, error, responseTime, checkedAt } = await strategy.check(monitor)

    const checkConfig = {
      status,
      error: error ?? null,
      responseTime,
      checkedAt,
    }

    const monitorConfig = getMonitorConfig(monitor)

    await this.sendNotificationIfNeeded({
      monitorConfig,
      checkConfig,
      monitorId,
      oldLastStatus: monitor.lastStatus,
      monitor,
    })

    this.metricsService.incrementMonitorChecksRequest('success')
    return status
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
    })
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
