import { InjectQueue, Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Monitor, StatusEnum } from '@prisma/client'
import { Job, Queue } from 'bull'

import { BULL_KEYS, BULL_NAMES } from '@/backend/shared/bull/bull.constants'
import { PrismaService } from '@/backend/shared/prisma/prisma.service'

@Processor(BULL_NAMES.QUEUE)
export class MonitorCheckProcessor {
  private readonly logger = new Logger(MonitorCheckProcessor.name)

  constructor(
    private prisma: PrismaService,
    @InjectQueue(BULL_NAMES.QUEUE) private checksQueue: Queue<Monitor>,
  ) {}

  @Process(BULL_NAMES.CHECK)
  async handleCheck(job: Job<Monitor>) {
    try {
      const monitorId = job.data.id
      const monitor = await this.prisma.monitor.findUnique({ where: { id: monitorId } })
      if (!monitor) {
        this.logger.warn(`Monitor ${monitorId} not found, skipping check`)
        return
      }

      await this.performCheck(monitor)
      await this.checksQueue.add(BULL_NAMES.CHECK, monitor, {
        jobId: BULL_KEYS.CHECK(monitor.id),
        delay: monitor.checkInterval * 60 * 1000,
      })
    } catch (e) {
      const isError = e instanceof Error
      const errorStack = isError ? e.stack : undefined
      const details = isError ? e.message : 'unknown error'

      this.logger.error(`Failed to handle check: ${details}`, errorStack)
    }
  }

  private async performCheck(monitor: Monitor) {
    const start = Date.now()
    let status: StatusEnum
    let statusCode: number | null = null
    let error: string | null = null
    let responseTime: number | null = null

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), monitor.timeout)

      const res = await fetch(monitor.url, {
        method: monitor.method,
        signal: controller.signal,
        redirect: 'follow',
        cache: 'no-cache',
        headers: { 'User-Agent': 'LiveWave-Uptime-Monitor/1.0', Accept: '*/*' },
      })

      clearTimeout(timeout)

      statusCode = res.status
      status = res.ok ? StatusEnum.up : StatusEnum.down
      responseTime = Date.now() - start
    } catch (e) {
      status = StatusEnum.down
      error = e instanceof Error ? e.message : 'Timeout or network error'
      responseTime = Date.now() - start
    }

    try {
      await this.prisma.check.create({
        data: { monitorId: monitor.id, status, statusCode, responseTime, error },
      })

      const hasLastStatusChanged = monitor.lastStatus !== status
      await this.prisma.monitor.update({
        where: { id: monitor.id },
        data: {
          lastCheckedAt: new Date(),
          ...(hasLastStatusChanged && { lastStatus: status }),
        },
      })

      const nextCheckAt = new Date(Date.now() + monitor.checkInterval * 60 * 1000)
      await this.prisma.monitor.update({
        where: { id: monitor.id },
        data: { nextCheckAt },
      })
    } catch (e) {
      const isError = e instanceof Error
      if (isError && 'code' in e && e.code === 'P2003') {
        this.logger.warn(`Monitor ${monitor.id} not found, skipping check`)
        return
      }
      const errorStack = isError ? e.stack : undefined
      const details = isError ? e.message : 'unknown error'

      this.logger.error(`Failed to handle check: ${details}`, errorStack)
    }
  }
}
