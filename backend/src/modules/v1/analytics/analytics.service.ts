import { Injectable, NotFoundException } from '@nestjs/common'
import { StatusEnum } from '@prisma/client'

import { PrismaService } from '@/shared/prisma/prisma.service'
import { REDIS_KEYS } from '@/shared/redis/redis.constants'
import { RedisService } from '@/shared/redis/redis.service'
import { logAndThrow } from '@/shared/utils/error.utils'

import {
  getDailyStatsSql,
  getIncidentsCountSql,
  getIncidentsSql,
  getTimelineSql,
  getUptimeItemSql,
} from './analytics.sql'

@Injectable()
export class AnalyticsService {
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
      throw logAndThrow({ context: 'get daily stats', e, name: AnalyticsService.name })
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
      throw logAndThrow({ context: 'get uptime', e, name: AnalyticsService.name })
    }
  }

  async getIncidents(
    userId: string,
    monitorId: string,
    startDate: Date,
  ): Promise<{ incidents: Incidents; total: number }> {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      select: { userId: true },
    })
    if (!monitor || monitor.userId !== userId) throw new NotFoundException('Monitor not found')

    const incidents = await this.getIncidentsList(monitorId, startDate)
    const total = await this.getIncidentsCount(monitorId, startDate)

    return { incidents, total }
  }

  private async getIncidentsList(monitorId: string, startDate: Date): Promise<Incidents> {
    try {
      const incidents = await this.prisma.$queryRaw<IncidentRaw[]>(
        getIncidentsSql(monitorId, startDate),
      )

      return incidents.map(i => {
        const durationMs = i.durationMs !== null ? Number(i.durationMs) : null
        let duration: string
        if (durationMs !== null) {
          const seconds = Math.floor(durationMs / 1000)
          const minutes = Math.floor(seconds / 60)
          const remainingSeconds = seconds % 60
          if (minutes > 0 && remainingSeconds > 0) duration = `${minutes}m ${remainingSeconds}s`
          else if (minutes > 0) duration = `${minutes}m`
          else duration = `${seconds}s`
        } else duration = 'Active'

        return {
          id: Number(i.id),
          startAt: i.startAt,
          endAt: i.endAt ?? null,
          durationMs,
          cause: i.cause ?? null,
          status: i.status,
          formattedDuration: duration,
        }
      })
    } catch (e) {
      throw logAndThrow({ context: 'get incidents list', e, name: AnalyticsService.name })
    }
  }

  private async getIncidentsCount(monitorId: string, startDate: Date) {
    try {
      const result = await this.prisma.$queryRaw<{ count: number }[]>(
        getIncidentsCountSql(monitorId, startDate),
      )
      return Number(result[0]?.count ?? 0)
    } catch (e) {
      throw logAndThrow({ context: 'get incidents count', e, name: AnalyticsService.name })
    }
  }

  async getTimeline(userId: string, monitorId: string, startDate: Date) {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      select: { userId: true },
    })
    if (!monitor || monitor.userId !== userId) throw new NotFoundException('Monitor not found')

    return await this.getRawTimeline(monitorId, startDate)
  }

  private async getRawChecks(monitorId: string, startDate: Date) {
    const results = await this.prisma.check.findMany({
      where: { monitorId, checkedAt: { gte: startDate, lte: new Date() } },
      select: { checkedAt: true, status: true, responseTime: true, error: true },
      orderBy: { checkedAt: 'asc' },
      take: 40,
    })

    return results.map(r => ({
      date: r.checkedAt,
      up: r.status === StatusEnum.up ? 1 : 0,
      down: r.status === StatusEnum.down ? 1 : 0,
      uptime: r.status === StatusEnum.up ? 100 : 0,
      averageResponseTime: Number(r.responseTime) || null,
      p95ResponseTime: null,
    }))
  }

  private async getRawTimeline(monitorId: string, startDate: Date) {
    try {
      const totalChecks = await this.prisma.check.count({
        where: { monitorId, checkedAt: { gte: startDate, lte: new Date() } },
      })
      if (totalChecks < 40) return await this.getRawChecks(monitorId, startDate)

      const bucketMinutes = this.getBucketMinutes(startDate)
      const results = await this.prisma.$queryRaw<
        {
          bucket: Date
          up: bigint
          down: bigint
          averageResponseTime: bigint | null
          p95ResponseTime: bigint | null
          uptime: bigint | null
        }[]
      >(getTimelineSql(monitorId, startDate, bucketMinutes))

      return results.map(r => ({
        date: r.bucket,
        up: r.up ? Number(r.up) : 0,
        down: r.down ? Number(r.down) : 0,
        uptime: r.uptime ? Number(r.uptime) : 0,
        averageResponseTime: r.averageResponseTime ? Number(r.averageResponseTime) : null,
        p95ResponseTime: r.p95ResponseTime ? Number(r.p95ResponseTime) : null,
      }))
    } catch (e) {
      throw logAndThrow({ context: 'get timeline', e, name: AnalyticsService.name })
    }
  }

  private getBucketMinutes(startDate: Date, checkIntervalSeconds: number = 60) {
    const diffMs = Date.now() - startDate.getTime()
    const diffMinutes = Math.max(1, diffMs / (60 * 1000))

    const minBucket = Math.max(1, Math.ceil(checkIntervalSeconds / 60))
    const maxBucket = 1440
    const targetPoints = 40

    let idealBucket = diffMinutes / targetPoints
    idealBucket = Math.min(Math.max(idealBucket, minBucket), maxBucket)

    const bucketValues = [1, 2, 3, 5, 10, 15, 20, 30, 60, 120, 180, 240, 360, 480, 720, 1440]

    let bestBucket = bucketValues[0]
    let minDiff = Infinity

    for (const b of bucketValues) {
      const diff = Math.abs(b - idealBucket)
      if (diff < minDiff) {
        minDiff = diff
        bestBucket = b
      }
    }

    return bestBucket
  }
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

type IncidentRaw = {
  id: bigint
  startAt: Date
  endAt: Date | null
  cause: string | null
  durationMs: bigint | null
  status: 'Resolved' | 'Active'
}
type Incidents = {
  id: number
  startAt: Date
  endAt: Date | null
  cause: string | null
  durationMs: number | null
  status: 'Resolved' | 'Active'
  formattedDuration: string
}[]

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
