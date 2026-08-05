import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '@/shared/prisma/prisma.service'
import { REDIS_KEYS } from '@/shared/redis/redis.constants'
import { RedisService } from '@/shared/redis/redis.service'
import { logAndThrow } from '@/shared/utils/error.utils'

import { getDailyStatsSql, getUptimeItemSql } from '../analytics.sql'

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

    const { uptime, averageResponseTime, totalChecks, p95ResponseTime, up, down } =
      await this.getUptime(monitorId, startDate)
    const dailyStats = await this.getDailyStats(monitorId, startDate)

    const result: OverviewResult = {
      monitorId,
      monitorName: monitor.name,
      periodDays: days,
      startDate,
      endDate: new Date(),
      totalChecks,
      up,
      down,
      uptime,
      averageResponseTime: averageResponseTime ?? null,
      p95ResponseTime: p95ResponseTime ?? null,
      dailyStats: dailyStats,
    }

    await this.redis.set(key, JSON.stringify(result), 120)
    return result
  }

  private async getDailyStats(monitorId: string, startDate: Date): Promise<DailyStatsItem[]> {
    try {
      const stats = await this.prisma.$queryRaw<DailyStatsItem[]>(
        getDailyStatsSql(monitorId, startDate),
      )

      return stats.map(r => ({
        day: r.day,
        uptime: r.uptime ? Number(r.uptime) : 0,
        averageResponseTime: r.averageResponseTime ? Number(r.averageResponseTime) : null,
        p95ResponseTime: r.p95ResponseTime ? Number(r.p95ResponseTime) : null,
        failureCount: r.failureCount ? Number(r.failureCount) : 0,
      }))
    } catch (e) {
      throw logAndThrow({ context: 'get daily stats', e, name: OverviewService.name })
    }
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
        p95ResponseTime: item.p95ResponseTime !== null ? Number(item.p95ResponseTime) : null,
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
  monitorId: string
  monitorName: string
  periodDays: number
  startDate: Date
  endDate: Date
  totalChecks: number
  uptime: number
  up: number
  down: number
  averageResponseTime: number | null
  p95ResponseTime: number | null
  dailyStats: DailyStatsItem[]
}

type UptimeItem = {
  uptime: number
  averageResponseTime: number | null
  p95ResponseTime: number | null
  totalChecks: number
  up: number
  down: number
}

type DailyStatsItem = {
  day: string
  uptime: number
  averageResponseTime: number | null
  p95ResponseTime: number | null
  failureCount: number | null
}
