import net from 'net'

import { Injectable } from '@nestjs/common'
import { StatusEnum } from '@prisma/client'

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { getErrorMessage } from '@/shared/utils/error.utils'

import type { StrategyResult } from './strategy-result.types'

@Injectable()
export class TcpStrategy {
  private logger: Logger
  constructor(
    private prisma: PrismaService,
    baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: TcpStrategy.name })
  }

  async check(monitorId: string): StrategyResult {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { tcpMonitor: true },
    })

    if (!monitor || !monitor.tcpMonitor) {
      this.logger.warn('Monitor or its TcpMonitor not found, skipping check', { monitorId })
      return {
        status: StatusEnum.down,
        error: 'Monitor or TcpMonitor not found',
        responseTime: null,
        checkedAt: new Date(),
      }
    }

    const { host, port } = monitor.tcpMonitor
    return await this.performCheck({
      monitorId,
      host,
      port,
      timeout: monitor.timeout,
      checkInterval: monitor.checkInterval,
    })
  }

  private async performCheck({
    monitorId,
    host,
    port,
    timeout,
    checkInterval,
  }: PerformCheckOptions) {
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

    await this.confirmTransaction({
      monitorId,
      status,
      responseTime,
      error,
      checkInterval,
      host,
      port,
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

  private async confirmTransaction({
    monitorId,
    status,
    responseTime,
    error,
    checkInterval,
    host,
    port,
  }: ConfirmTransactionOptions) {
    try {
      await this.prisma.$transaction([
        this.prisma.check.create({
          data: { monitorId, status, responseTime, error, details: { host, port } },
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
        this.logger.warn('TCP Monitor not found, skipping check', { monitorId })
        return
      }
      error = getErrorMessage(e)
      status = StatusEnum.down
      this.logger.error('Transaction failed for TCP check', {
        monitorId,
        error: getErrorMessage(e),
      })
    }
  }

  private normalizeTcpError(e: unknown, host: string, port: number, timeout: number) {
    const rawError = getErrorMessage(e, '')
    if (/ENOTFOUND/i.test(rawError)) return `DNS lookup failed for ${host}:${port}`
    if (/ECONNREFUSED/i.test(rawError)) return `Connection refused by ${host}:${port}`
    if (/timeout/i.test(rawError))
      return `Connections timeout after ${timeout}ms to ${host}:${port}`
    if (/ECONNRESET/i.test(rawError)) return `Connection reset by ${host}:${port}`
    return rawError || `Failed to connect to ${host}:${port}`
  }
}

interface PerformCheckOptions {
  monitorId: string
  host: string
  port: number
  timeout: number
  checkInterval: number
}

interface CheckTcpPortOptions {
  host: string
  port: number
  timeout: number
}

interface ConfirmTransactionOptions {
  monitorId: string
  status: StatusEnum
  responseTime: number
  error: string | null
  checkInterval: number
  host: string
  port: number
}
