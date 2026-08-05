import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '@/shared/prisma/prisma.service'
import { REDIS_KEYS } from '@/shared/redis/redis.constants'
import { RedisService } from '@/shared/redis/redis.service'
import { logAndThrow } from '@/shared/utils/error.utils'

import { getUptimeItemSql } from '../analytics.sql'

@Injectable()
export class OverviewService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getOverview(userId: string, monitorId: string, days: number = 7) {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      select: { userId: true, name: true },
    })
    if (!monitor || monitor.userId !== userId) throw new NotFoundException('Monitor not found')

    const key = REDIS_KEYS.overviewAnalytics(monitorId, days)
    const cached = await this.redis.get(key)
    if (cached) return JSON.parse(cached) as OverviewResult

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
    return result
  }

  private async getUptime(monitorId: string, startDate: Date): Promise<UptimeItem> {
    try {
      const result = await this.prisma.$queryRaw<UptimeItem[]>(
        getUptimeItemSql(monitorId, startDate),
      )

      const item = result[0] || {}
      return {
        uptime: item.uptime !== null ? Number(item.uptime) : 0,
        averageResponseTime:
          item.averageResponseTime !== null ? Number(item.averageResponseTime) : null,
        totalChecks: item.totalChecks !== null ? Number(item.totalChecks) : 0,
        up: item.up ? Number(item.up) : 0,
        down: item.down ? Number(item.down) : 0,
      }
    } catch (e) {
      throw logAndThrow({ context: 'get uptime', e, name: OverviewService.name })
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
