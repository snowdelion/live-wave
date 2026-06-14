import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Queue } from 'bullmq'

import { BULL_KEYS, BULL_NAMES } from '@/backend/shared/bull/bull.constants'
import { PrismaService } from '@/backend/shared/prisma/prisma.service'
import { logAndThrow } from '@/backend/shared/utils/error.utils'

@Injectable()
export class MonitorCheckService implements OnModuleInit {
  private readonly logger = new Logger(MonitorCheckService.name)

  constructor(
    private prisma: PrismaService,
    @InjectQueue(BULL_NAMES.QUEUE) private checksQueue: Queue<{ monitorId: string }>,
  ) {}

  async onModuleInit() {
    try {
      const monitors = await this.prisma.monitor.findMany({
        where: {
          OR: [{ nextCheckAt: { lte: new Date() } }, { nextCheckAt: null }],
        },
        select: { id: true, type: true, checkInterval: true },
      })

      for (const monitor of monitors)
        await this.scheduleCheck({
          monitorId: monitor.id,
          checkInterval: monitor.checkInterval,
          immediate: false,
        })
    } catch (e) {
      logAndThrow({
        name: MonitorCheckService.name,
        context: 'check monitors',
        e,
        shouldThrow: false,
      })
    }
  }

  async scheduleCheck({
    monitorId,
    checkInterval,
    immediate = false,
  }: {
    monitorId: string
    checkInterval?: number
    immediate?: boolean
  }) {
    let interval = checkInterval
    let delay: number
    try {
      if (!interval) {
        const monitor = await this.prisma.monitor.findUnique({
          where: { id: monitorId },
          select: { checkInterval: true },
        })
        if (!monitor) {
          return
        }
        interval = monitor.checkInterval
      }
      delay = immediate ? 0 : interval * 60 * 1000
      await this.enqueueCheck(monitorId, delay)
    } catch (e) {
      logAndThrow({
        name: MonitorCheckService.name,
        context: 'schedule check',
        e,
        shouldThrow: false,
      })
    }
  }

  private async enqueueCheck(monitorId: string, delay: number) {
    this.logger.debug(`Scheduled check for monitor ${monitorId} with delay ${delay}ms`)
    await this.clearScheduledJobs(monitorId)
    await this.checksQueue.add(
      BULL_NAMES.CHECK,
      { monitorId },
      { jobId: BULL_KEYS.CHECK(monitorId), delay },
    )
  }

  async clearScheduledJobs(monitorId: string) {
    const prefix = BULL_KEYS.RAW_CHECK(monitorId)
    const states: ('waiting' | 'delayed')[] = ['waiting', 'delayed']

    for (const state of states) {
      const jobs = await this.checksQueue.getJobs([state])

      for (const job of jobs)
        try {
          if (job.id && job.id.startsWith(prefix)) await job.remove()
        } catch (e) {
          logAndThrow({
            name: MonitorCheckService.name,
            context: 'remove job',
            e,
            shouldThrow: false,
            loggerType: 'warn',
          })
        }
    }
  }
}
