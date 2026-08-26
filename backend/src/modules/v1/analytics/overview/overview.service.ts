import { Injectable, NotFoundException } from '@nestjs/common'

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { REDIS_KEYS } from '@/shared/redis/redis.constants'
import { RedisService } from '@/shared/redis/redis.service'
import { logAndThrow } from '@/shared/utils/error.utils'

import { getUptimeItemSql } from '../analytics.sql'

@Injectable()
export class OverviewService {
  private logger: Logger
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: OverviewService.name })
  }

  async getOverview(userId: string, monitorId: string, days: number = 7) {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      select: { userId: true },
    })
    if (!monitor || monitor.userId !== userId) {
      this.logger.warn('Monitor not found or access forbidden', {
        hasMonitor: !!monitor,
        currentUser: userId,
        monitorUser: monitor?.userId,
      })
      throw new NotFoundException('Monitor not found')
    }

    const key = REDIS_KEYS.overviewAnalytics(monitorId, days)
    const cached = await this.redis.get(key)
    if (cached) {
      this.logger.debug('Overview data served from Redis cache', { monitorId, userId, days })
      return JSON.parse(cached) as OverviewResult
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const { uptime, averageResponseTime, totalChecks, up, down } = await this.getUptime(
      monitorId,
      startDate,
    )

    const result: OverviewResult = {
      totalChecks,
      up,
      down,
      uptime,
      averageResponseTime: averageResponseTime ?? null,
    }

    await this.redis.set(key, JSON.stringify(result), 120)
    this.logger.debug('Overview data computed and cached', { monitorId, days })
    return result
  }

  private async getUptime(monitorId: string, startDate: Date): Promise<UptimeItem> {
    try {
      const result = await this.prisma.$queryRaw<UptimeItem[]>(
        getUptimeItemSql(monitorId, startDate),
      )

      const item = result[0] || {}
      const data = {
        uptime: item.uptime !== null ? Number(item.uptime) : 0,
        averageResponseTime:
          item.averageResponseTime !== null ? Number(item.averageResponseTime) : null,
        totalChecks: item.totalChecks !== null ? Number(item.totalChecks) : 0,
        up: item.up ? Number(item.up) : 0,
        down: item.down ? Number(item.down) : 0,
      }
      this.logger.debug('Uptime data fetched from DB', {
        monitorId,
        startDate,
      })
      return data
    } catch (e) {
      throw logAndThrow({ context: 'get uptime', e, logger: this.logger })
    }
  }
}

export interface OverviewResult {
  totalChecks: number
  uptime: number
  up: number
  down: number
  averageResponseTime: number | null
}

type UptimeItem = {
  uptime: number
  averageResponseTime: number | null
  totalChecks: number
  up: number
  down: number
}
