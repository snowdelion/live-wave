import { Injectable } from '@nestjs/common'
import { Method, StatusEnum } from '@prisma/client'

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { getErrorMessage } from '@/shared/utils/error.utils'
import { httpFetch } from '@/shared/utils/http-fetch.utils'

import type { StrategyResult } from './strategy-result.types'

@Injectable()
export class HttpStrategy {
  private logger: Logger
  constructor(
    private prisma: PrismaService,
    baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: HttpStrategy.name })
  }

  async check(monitorId: string): StrategyResult {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { httpMonitor: true },
    })

    if (!monitor || !monitor.httpMonitor) {
      this.logger.warn('Monitor or its HttpMonitor not found, skipping check', { monitorId })
      return {
        status: StatusEnum.down,
        error: 'Monitor or HttpMonitor not found',
        responseTime: null,
        checkedAt: new Date(),
      }
    }

    const { id, checkInterval, timeout, httpMonitor } = monitor
    return await this.performCheck(id, checkInterval, timeout, httpMonitor.url, httpMonitor.method)
  }

  private async performCheck(
    monitorId: string,
    checkInterval: number,
    timeout: number,
    url: string,
    method: Method,
  ) {
    const { status, statusCode, error, responseTime } = await this.getFetchResults({
      monitorId,
      url,
      timeout,
      method,
    })

    if (status === StatusEnum.down)
      this.logger.warn('HTTP monitor is down', { monitorId, statusCode, responseTime, error })

    await this.confirmTransaction({
      monitorId,
      statusCode,
      responseTime,
      error,
      status,
      checkInterval,
      url,
      method,
    })

    return { status, error, responseTime, checkedAt: new Date() }
  }

  private async confirmTransaction({
    monitorId,
    statusCode,
    responseTime,
    error,
    status,
    checkInterval,
    url,
    method,
  }: ConfirmTransactionOptions) {
    try {
      await this.prisma.$transaction([
        this.prisma.check.create({
          data: {
            monitorId,
            status,
            statusCode,
            responseTime,
            error,
            details: { url, method },
          },
        }),
        this.prisma.monitor.update({
          where: { id: monitorId },
          data: {
            lastCheckedAt: new Date(),
            lastStatus: status,
            nextCheckAt: new Date(Date.now() + checkInterval * 60 * 1000),
          },
        }),
        this.prisma.check.deleteMany({
          where: {
            monitorId,
            checkedAt: { lt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) },
          },
        }),
      ])
    } catch (e) {
      const isNotFound = e instanceof Error && 'code' in e && e.code === 'P2003'
      if (isNotFound) {
        this.logger.warn('HTTP Monitor not found, skipping check', { monitorId })
        return
      }

      error = getErrorMessage(e)
      status = StatusEnum.down
      this.logger.error('Transaction failed for HTTP check', {
        monitorId,
        error: getErrorMessage(e),
      })
    }
  }

  private async getFetchResults({ monitorId, url, timeout, method }: GetFetchResultsOptions) {
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

interface ConfirmTransactionOptions {
  monitorId: string
  statusCode: number | null
  responseTime: number | null
  error: string | null
  status: StatusEnum
  checkInterval: number
  url: string
  method: Method
}

interface GetFetchResultsOptions {
  monitorId: string
  url: string
  timeout: number
  method: Method
}
