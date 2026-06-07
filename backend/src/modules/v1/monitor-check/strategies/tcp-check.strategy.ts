import net from 'net'

import { Injectable, Logger } from '@nestjs/common'
import { StatusEnum } from '@prisma/client'

import { PrismaService } from '@/backend/shared/prisma/prisma.service'

@Injectable()
export class TcpStrategy {
  private readonly logger = new Logger(TcpStrategy.name)
  constructor(private prisma: PrismaService) {}

  async check(monitorId: string) {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { tcpMonitor: true },
    })

    if (!monitor || !monitor.tcpMonitor) {
      this.logger.warn(`Monitor ${monitorId} or its TcpMonitor not found, skipping check`)
      return
    }

    const { host, port } = monitor.tcpMonitor
    await this.performCheck({
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
      await this.checkTcpPort({ host, port, timeoutMs: timeout })
      status = StatusEnum.up
      responseTime = Date.now() - start
    } catch (e) {
      error = e instanceof Error ? e.message : 'unknown error'
      status = StatusEnum.down
      responseTime = Date.now() - start
    }

    await this.confirmTransaction({ monitorId, status, responseTime, error, checkInterval })
  }

  private checkTcpPort({ host, port, timeoutMs }: CheckTcpPortOptions): Promise<void> {
    return new Promise((res, rej) => {
      const socket = new net.Socket()

      socket.setTimeout(timeoutMs)
      socket.once('timeout', () => {
        socket.destroy()
        rej(new Error(`Connection timeout after ${timeoutMs}ms`))
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
  }: ConfirmTransactionOptions) {
    await this.prisma.$transaction([
      this.prisma.check.create({
        data: { monitorId, status, responseTime, error },
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
  port: number
  timeout: number
  checkInterval: number
}

interface CheckTcpPortOptions {
  host: string
  port: number
  timeoutMs: number
}

interface ConfirmTransactionOptions {
  monitorId: string
  status: StatusEnum
  responseTime: number
  error: string | null
  checkInterval: number
}
