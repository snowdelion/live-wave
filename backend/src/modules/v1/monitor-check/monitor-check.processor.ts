import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import {
  DnsMonitor,
  type HttpMonitor,
  type IcmpMonitor,
  MonitorType,
  type TcpMonitor,
} from '@prisma/client'
import { Job } from 'bullmq'

import { BULL_NAMES } from '@/backend/shared/bull/bull.constants'
import { PrismaService } from '@/backend/shared/prisma/prisma.service'
import { RateLimitService } from '@/backend/shared/rate-limit/rate-limit.service'

import { MonitorCheckService } from './monitor-check.service'
import { DnsStrategy } from './strategies/dns-check.strategy'
import { HttpStrategy } from './strategies/http-check.strategy'
import { IcmpStrategy } from './strategies/icmp-check.strategy'
import { TcpStrategy } from './strategies/tcp-check.strategy'

@Processor(BULL_NAMES.QUEUE, { concurrency: 5 })
export class MonitorCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(MonitorCheckProcessor.name)

  constructor(
    private prisma: PrismaService,
    private httpStrategy: HttpStrategy,
    private tcpStrategy: TcpStrategy,
    private icmpStrategy: IcmpStrategy,
    private dnsStrategy: DnsStrategy,
    private monitorCheckService: MonitorCheckService,
    private rateLimitService: RateLimitService,
  ) {
    super()
  }

  async process(job: Job<{ monitorId: string }>): Promise<void> {
    const monitorId = job.data.monitorId
    let shouldReschedule = false

    try {
      const monitor = await this.prisma.monitor.findUnique({
        where: { id: monitorId },
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
          dnsMonitor: true,
        },
      })

      if (!monitor) {
        this.logger.warn(`Monitor ${monitorId} not found, skipping check`)
        return
      }

      if (
        ![MonitorType.HTTP, MonitorType.TCP, MonitorType.ICMP, MonitorType.DNS].includes(
          monitor.type,
        )
      ) {
        this.logger.error(`Unknown monitor type: ${monitor.type}`)
        return
      }
      shouldReschedule = true

      const targetHost = this.getTargetHost(monitor)
      if (!targetHost) {
        this.logger.warn(`Can't determine target host for monitor ${monitorId}`)
        return
      }

      const isRateLimited = await this.rateLimitService.domain({
        domain: targetHost,
        expireSeconds: 60,
        maxPerMinute: 6,
      })
      if (isRateLimited) {
        this.logger.warn(`Rate limit exceeded for ${targetHost}, skipping check`)
        return
      }

      switch (monitor.type) {
        case MonitorType.HTTP:
          await this.httpStrategy.check(monitorId)
          break

        case MonitorType.TCP:
          await this.tcpStrategy.check(monitorId)
          break

        case MonitorType.ICMP:
          await this.icmpStrategy.check(monitorId)
          break

        case MonitorType.DNS:
          await this.dnsStrategy.check(monitorId)
          break
      }
    } catch (e) {
      const isError = e instanceof Error
      const errorStack = isError ? e.stack : undefined
      const details = isError ? e.message : 'unknown error'
      this.logger.error(`Failed to check monitor ${monitorId}: ${details}`, errorStack)

      if (!shouldReschedule) throw e
    } finally {
      if (shouldReschedule) {
        await this.monitorCheckService.scheduleCheck({ monitorId, immediate: false })
      }
    }
  }

  private getTargetHost(monitor: {
    type: MonitorType
    httpMonitor: HttpMonitor | null
    tcpMonitor: TcpMonitor | null
    icmpMonitor: IcmpMonitor | null
    dnsMonitor: DnsMonitor | null
  }): string | null {
    switch (monitor.type) {
      case MonitorType.HTTP:
        if (monitor.httpMonitor) return new URL(monitor.httpMonitor?.url).hostname
        else return null

      case MonitorType.ICMP:
        if (monitor.icmpMonitor) return monitor.icmpMonitor.host
        else return null

      case MonitorType.TCP:
        if (monitor.tcpMonitor) return monitor.tcpMonitor.host
        else return null

      case MonitorType.DNS:
        if (monitor.dnsMonitor) return monitor.dnsMonitor.host
        else return null
    }
  }
}
