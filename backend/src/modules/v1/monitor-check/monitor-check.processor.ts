import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { MonitorType } from '@prisma/client'
import { Job } from 'bullmq'

import { BULL_NAMES } from '@/backend/shared/bull/bull.constants'
import { PrismaService } from '@/backend/shared/prisma/prisma.service'

import { MonitorCheckService } from './monitor-check.service'
import { HttpStrategy } from './strategies/http-check.strategy'

@Processor(BULL_NAMES.QUEUE, { concurrency: 5 })
export class MonitorCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(MonitorCheckProcessor.name)

  constructor(
    private prisma: PrismaService,
    private httpStrategy: HttpStrategy,
    private monitorCheckService: MonitorCheckService,
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
        },
      })

      if (!monitor) {
        this.logger.warn(`Monitor ${monitorId} not found, skipping check`)
        return
      }
      shouldReschedule = true

      switch (monitor.type) {
        case MonitorType.HTTP:
          await this.httpStrategy.check(monitorId)
          break

        default:
          this.logger.error(`Unknown monitor type: ${monitor.type}`)
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
}
