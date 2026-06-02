import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import type { Monitor } from '@prisma/client'
import { Queue } from 'bull'

import { BULL_KEYS, BULL_NAMES } from '@/backend/shared/bull/bull.constants'
import { PrismaService } from '@/backend/shared/prisma/prisma.service'

@Injectable()
export class MonitorCheckService implements OnModuleInit {
  private readonly logger = new Logger(MonitorCheckService.name)

  constructor(
    private prisma: PrismaService,
    @InjectQueue(BULL_NAMES.QUEUE) private checksQueue: Queue<Monitor>,
  ) {}

  async onModuleInit() {
    try {
      const monitors = await this.prisma.monitor.findMany()
      for (const monitor of monitors) await this.scheduleCheck(monitor)
    } catch (e) {
      const isError = e instanceof Error
      const msg = isError ? e.message : 'unknown error'
      const errorStack = isError ? e.stack : undefined
      this.logger.error(`Failed to check monitors: ${msg}`, errorStack)
    }
  }

  async scheduleCheck(monitor: Monitor) {
    try {
      const now = Date.now()
      const nextCheckTime = monitor.nextCheckAt?.getTime() ?? now

      await this.checksQueue.removeJobs(`${BULL_KEYS.RAW_CHECK(monitor.id)}-*`)
      await this.checksQueue.add(BULL_NAMES.CHECK, monitor, {
        jobId: BULL_KEYS.CHECK(monitor.id),
        delay: Math.max(0, nextCheckTime - now),
      })
    } catch (e) {
      const isError = e instanceof Error
      const msg = isError ? e.message : 'unknown error'
      const errorStack = isError ? e.stack : undefined
      this.logger.error(`Failed to check schedule monitors: ${msg}`, errorStack)
    }
  }
}
