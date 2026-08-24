import { Injectable } from '@nestjs/common'
import { Method, StatusEnum } from '@prisma/client'

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { getErrorMessage } from '@/shared/utils/error.utils'
import { httpFetch } from '@/shared/utils/http-fetch.utils'

import { BaseCheckStrategy } from './base-check.strategy'
import type { StrategyContext, StrategyResult } from './strategy-result.types'

@Injectable()
export class HttpStrategy extends BaseCheckStrategy {
  constructor(
    protected prisma: PrismaService,
    baseLogger: Logger,
  ) {
    super(prisma, baseLogger, HttpStrategy.name)
  }

  async check(monitor: StrategyContext): Promise<StrategyResult> {
    if (!monitor.httpMonitor) {
      this.logger.warn('HttpMonitor not found', { monitorId: monitor.id })
      return { status: StatusEnum.down, error: null, responseTime: null, checkedAt: new Date() }
    }
    const { status, statusCode, responseTime, error } = await this.performCheck({
      url: monitor.httpMonitor.url,
      method: monitor.httpMonitor.method,
      timeout: monitor.timeout,
      monitorId: monitor.id,
    })

    await this.confirmCheckResult(monitor.id, {
      status,
      error,
      details: { url: monitor.httpMonitor.url, method: monitor.httpMonitor.method },
      responseTime,
    })
    if (status === StatusEnum.down)
      this.logger.warn('HTTP monitor is down', {
        monitorId: monitor.id,
        statusCode: statusCode,
        responseTime: responseTime,
        error: error,
      })
    return { status, responseTime, error, checkedAt: new Date() }
  }

  private async performCheck({ monitorId, url, timeout, method }: GetFetchResultsOptions) {
    const start = Date.now()
    let status: StatusEnum = StatusEnum.down
    let statusCode: number | null = null
    let error: string | null = null
    let responseTime: number | null = null

    try {
      const res = await httpFetch({
        url,
        timeout,
        retries: 3,
        options: {
          method,
          redirect: 'follow',
          cache: 'no-cache',
          headers: { 'User-Agent': 'LiveWave-Uptime-Monitor/1.0' },
        },
      })

      statusCode = res.status
      status = res.ok ? StatusEnum.up : StatusEnum.down
    } catch (e) {
      error = getErrorMessage(e)
      status = StatusEnum.down
      this.logger.warn('Failed to fetch for monitor check', { url, method, monitorId, timeout })
    } finally {
      responseTime = Date.now() - start
    }

    return { status, statusCode, error, responseTime }
  }
}

interface GetFetchResultsOptions {
  monitorId: string
  url: string
  timeout: number
  method: Method
}
