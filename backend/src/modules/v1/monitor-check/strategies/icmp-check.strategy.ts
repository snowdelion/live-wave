import { Injectable } from '@nestjs/common'
import { StatusEnum } from '@prisma/client'
import { ping } from 'node-ping-rs'

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { getErrorMessage } from '@/shared/utils/error.utils'

import type { StrategyResult } from './strategy-result.types'

@Injectable()
export class IcmpStrategy {
  private logger: Logger
  constructor(
    private prisma: PrismaService,
    baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: IcmpStrategy.name })
  }

  async check(monitorId: string): StrategyResult {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { icmpMonitor: true },
    })
    if (!monitor?.icmpMonitor) {
      this.logger.warn('Monitor or its IcmpMonitor not found, skipping check', { monitorId })
      return {
        status: StatusEnum.down,
        error: 'Monitor or IcmpMonitor not found',
        responseTime: null,
        checkedAt: new Date(),
      }
    }

    return await this.performCheck({
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
      const result = await Promise.race([ping(host), timeoutPromise])
      if (result.success) status = StatusEnum.up
      else error = this.getFormattedIcmpError(result.error, timeout)
    } catch (e) {
      const originalError = getErrorMessage(e, '')
      error = this.getFormattedIcmpError(originalError, timeout)
      status = StatusEnum.down
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      responseTime = Date.now() - start
    }

    if (status === StatusEnum.down)
      this.logger.warn('ICMP monitor is down', { monitorId, host, error })

    await this.confirmTransaction({ monitorId, status, responseTime, error, checkInterval, host })
    return { status, error, responseTime, checkedAt: new Date() }
  }

  private getTimeout(ms: number) {
    let timeoutId: NodeJS.Timeout | null = null
    const timeoutPromise = new Promise<never>(
      (_, rej) =>
        (timeoutId = setTimeout(() => {
          rej(new Error(`Ping timeout after ${ms}ms`))
        }, ms)),
    )

    return { timeoutId, timeoutPromise }
  }

  private getFormattedIcmpError(error: string = '', timeout: number) {
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
    try {
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
    } catch (e) {
      if (e instanceof Error && 'code' in e && e.code === 'P2003') {
        this.logger.warn('ICMP Monitor not found, skipping check', { monitorId })
        return
      }
      error = getErrorMessage(e)
      status = StatusEnum.down
      this.logger.error('Transaction failed for ICMP check', {
        monitorId,
        error: getErrorMessage(e),
      })
    }
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
