import { Injectable, Logger } from '@nestjs/common'
import { StatusEnum } from '@prisma/client'
import { ping, PingResult } from 'node-ping-rs'

import { PrismaService } from '@/backend/shared/prisma/prisma.service'

@Injectable()
export class IcmpStrategy {
  private logger = new Logger(IcmpStrategy.name)
  constructor(private prisma: PrismaService) {}

  async check(monitorId: string) {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { icmpMonitor: true },
    })
    if (!monitor?.icmpMonitor) {
      this.logger.warn(`Monitor ${monitorId} or its IcmpMonitor not found, skipping check`)
      return
    }

    await this.performCheck({
      monitorId,
      host: monitor.icmpMonitor.host,
      timeout: monitor.timeout,
      checkInterval: monitor.checkInterval,
    })
  }

  private async performCheck({ monitorId, host, timeout, checkInterval }: PerformCheckOptions) {
    let status: StatusEnum = StatusEnum.down
    let error: string | null = null
    let responseTime: number | null = null
    const start = Date.now()

    const { timeoutPromise, timeoutId } = this.getTimeout(timeout)

    try {
      const pingPromise = ping(host)
      const result = await Promise.race([pingPromise, timeoutPromise])

      if (result.success) status = StatusEnum.up
      else error = this.getErrorMessage(result.error, timeout)
    } catch (e) {
      const originalError = e instanceof Error ? e.message : ''
      error = this.getErrorMessage(originalError, timeout)
      status = StatusEnum.down
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      responseTime = Date.now() - start
    }

    if (status === StatusEnum.down)
      this.logger.warn(`Monitor ${monitorId} (${host}) is down! Error: ${error}`)

    await this.confirmTransaction({ monitorId, status, responseTime, error, checkInterval, host })
  }

  private getTimeout(ms: number) {
    let timeoutId: NodeJS.Timeout | null = null
    const timeoutPromise = new Promise<Partial<PingResult>>(resolve => {
      timeoutId = setTimeout(() => {
        resolve({ success: false, error: `Ping timeout after ${ms}ms`, time: Date.now() })
      }, ms)
    })

    return { timeoutId, timeoutPromise }
  }

  private getErrorMessage(error: string = '', timeout: number) {
    if (/DNS|lookup|getaddrinfo/i.test(error)) return 'DNS lookup failed'
    if (/timeout/i.test(error)) return `Ping timeout after ${timeout}ms`
    if (/unreachable/i.test(error)) return 'Network unreachable'
    if (/permission/i.test(error)) return 'Permission denied'

    return 'No ping reply'
  }

  private async confirmTransaction({
    monitorId,
    status,
    responseTime,
    error,
    checkInterval,
    host,
  }: ConfirmTransactionOptions) {
    await this.prisma.$transaction([
      this.prisma.check.create({
        data: { monitorId, status, responseTime, error, details: { host } },
      }),

      this.prisma.monitor.update({
        where: { id: monitorId },
        data: {
          lastCheckedAt: new Date(),
          lastStatus: status,
          nextCheckAt: new Date(Date.now() + checkInterval * 60 * 1000),
        },
      }),
    ])
  }
}

interface PerformCheckOptions {
  monitorId: string
  host: string
  timeout: number
  checkInterval: number
}

interface ConfirmTransactionOptions {
  monitorId: string
  status: StatusEnum
  responseTime: number
  error: string | null
  checkInterval: number
  host: string
}
