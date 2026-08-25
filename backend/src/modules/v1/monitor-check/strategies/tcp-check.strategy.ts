import net from 'net'

import { Injectable } from '@nestjs/common'
import { StatusEnum } from '@prisma/client'

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { getErrorMessage } from '@/shared/utils/error.utils'

import { BaseCheckStrategy } from './base-check.strategy'
import type { StrategyContext, StrategyResult } from './strategy-result.types'

@Injectable()
export class TcpStrategy extends BaseCheckStrategy {
  constructor(
    protected prisma: PrismaService,
    baseLogger: Logger,
  ) {
    super(prisma, baseLogger, TcpStrategy.name)
  }

  async check(monitor: StrategyContext): Promise<StrategyResult> {
    if (!monitor || !monitor.tcpMonitor) {
      this.logger.warn('Monitor or its TcpMonitor not found, skipping check', {
        monitorId: monitor.id,
      })
      return {
        status: StatusEnum.down,
        error: 'Monitor or TcpMonitor not found',
        responseTime: null,
        checkedAt: new Date(),
      }
    }

    const { host, port } = monitor.tcpMonitor
    return await this.performCheck({
      monitorId: monitor.id,
      host,
      port,
      timeout: monitor.timeout,
    })
  }

  private async performCheck({ monitorId, host, port, timeout }: PerformCheckOptions) {
    let status: StatusEnum = StatusEnum.down
    let error: string | null = null
    let responseTime: number | null = null
    const start = Date.now()

    try {
      await this.checkTcpPort({ host, port, timeout })
      status = StatusEnum.up
    } catch (e) {
      error = this.normalizeTcpError(e, host, port, timeout)
      status = StatusEnum.down
      this.logger.warn('TCP monitor is down', { monitorId, host, port, timeout })
    } finally {
      responseTime = Date.now() - start
    }

    await this.confirmCheckResult(monitorId, {
      status,
      error,
      responseTime,
      details: { host, port },
    })

    return { status, error, responseTime, checkedAt: new Date() }
  }

  private checkTcpPort({ host, port, timeout }: CheckTcpPortOptions): Promise<void> {
    return new Promise((res, rej) => {
      const socket = new net.Socket()

      socket.setTimeout(timeout)
      socket.once('timeout', () => {
        socket.destroy()
        rej(new Error(`Connection timeout after ${timeout}ms`))
      })

      socket.once('error', rej)
      socket.connect(port, host, () => {
        socket.destroy()
        res()
      })
    })
  }

  private normalizeTcpError(e: unknown, host: string, port: number, timeout: number) {
    const rawError = getErrorMessage(e, '')
    if (/ENOTFOUND/i.test(rawError)) return `DNS lookup failed for ${host}:${port}`
    if (/ECONNREFUSED/i.test(rawError)) return `Connection refused by ${host}:${port}`
    if (/timeout/i.test(rawError)) return `Connection timeout after ${timeout}ms to ${host}:${port}`
    if (/ECONNRESET/i.test(rawError)) return `Connection reset by ${host}:${port}`
    return rawError || `Failed to connect to ${host}:${port}`
  }
}

interface PerformCheckOptions {
  monitorId: string
  host: string
  port: number
  timeout: number
}

interface CheckTcpPortOptions {
  host: string
  port: number
  timeout: number
}
