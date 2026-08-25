import { Injectable } from '@nestjs/common'
import { StatusEnum } from '@prisma/client'
import { ping } from 'node-ping-rs'

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { getErrorMessage } from '@/shared/utils/error.utils'

import { BaseCheckStrategy } from './base-check.strategy'
import type { StrategyContext, StrategyResult } from './strategy-result.types'

@Injectable()
export class IcmpStrategy extends BaseCheckStrategy {
  constructor(
    protected prisma: PrismaService,
    baseLogger: Logger,
  ) {
    super(prisma, baseLogger, IcmpStrategy.name)
  }

  async check(monitor: StrategyContext): Promise<StrategyResult> {
    if (!monitor?.icmpMonitor) {
      this.logger.warn('Monitor or its IcmpMonitor not found, skipping check', {
        monitorId: monitor.id,
      })
      return {
        status: StatusEnum.down,
        error: 'Monitor or IcmpMonitor not found',
        responseTime: null,
        checkedAt: new Date(),
      }
    }

    return await this.performCheck({
      monitorId: monitor.id,
      host: monitor.icmpMonitor.host,
      timeout: monitor.timeout,
    })
  }

  private async performCheck({ monitorId, host, timeout }: PerformCheckOptions) {
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

    await this.confirmCheckResult(monitorId, { status, responseTime, error, details: { host } })
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
}

interface PerformCheckOptions {
  monitorId: string
  host: string
  timeout: number
}
