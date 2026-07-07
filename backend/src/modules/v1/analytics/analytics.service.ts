import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '@/backend/shared/prisma/prisma.service'
import { REDIS_KEYS } from '@/backend/shared/redis/redis.constants'
import { RedisService } from '@/backend/shared/redis/redis.service'
import { logAndThrow } from '@/backend/shared/utils/error.utils'

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

    const { uptime, averageResponseTime, totalChecks, p95ResponseTime } = await this.getUptime(
      monitorId,
      startDate,
    )
    const dailyStats = await this.getDailyStats(monitorId, startDate)

    const result: OverviewResult = {
      monitorId,
      monitorName: monitor.name,
      periodDays: days,
      startDate,
      endDate: new Date(),
      totalChecks,
      uptime,
      averageResponseTime: averageResponseTime ?? null,
      p95ResponseTime: p95ResponseTime ?? null,
      dailyStats: dailyStats,
    }

    await this.redis.set(key, JSON.stringify(result), 120)
    return result
  }

  private async getDailyStats(monitorId: string, startDate: Date): Promise<DailyStats> {
    try {
      const stats = await this.prisma.$queryRaw<DailyStatsRaw[]>`
        SELECT
          TO_CHAR(DATE("checkedAt"), 'YYYY-MM-DD') AS day,
          ROUND((COUNT(*) FILTER (WHERE status = 'up')::float / NULLIF(COUNT(*), 0) * 100)::numeric, 1) AS uptime,
          ROUND(AVG("responseTime") FILTER (WHERE "responseTime" IS NOT NULL), 1) AS "averageResponseTime",
          ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "responseTime")::numeric, 1) AS "p95ResponseTime",
          COUNT(*) FILTER (WHERE status = 'down') AS "failureCount"
        FROM "Check"
        WHERE "monitorId" = ${monitorId} AND "checkedAt" >= ${startDate}
        GROUP BY TO_CHAR(DATE("checkedAt"), 'YYYY-MM-DD')
        ORDER BY day ASC
      `
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
      const result = await this.prisma.$queryRaw<UptimeRaw[]>`
        SELECT 
          ROUND((COUNT(*) FILTER (WHERE status = 'up')::float / NULLIF(COUNT(*), 0) * 100)::numeric, 1) AS uptime,
          ROUND(AVG("responseTime") FILTER (WHERE "responseTime" IS NOT NULL), 1) AS "averageResponseTime",
          ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "responseTime")::numeric, 1) AS "p95ResponseTime",
          COUNT(*) AS "totalChecks"
        FROM "Check"
        WHERE "monitorId" = ${monitorId} AND "checkedAt" >= ${startDate}
      `
      const item = result[0] || {}
      return {
        uptime: item.uptime !== null ? Number(item.uptime) : null,
        averageResponseTime:
          item.averageResponseTime !== null ? Number(item.averageResponseTime) : null,
        p95ResponseTime: item.p95ResponseTime !== null ? Number(item.p95ResponseTime) : null,
        totalChecks: item.totalChecks !== null ? Number(item.totalChecks) : 0,
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
      const incidents = await this.prisma.$queryRaw<IncidentRaw[]>`
        WITH ranked AS (
          SELECT 
            "checkedAt",
            status,
            error,
            ROW_NUMBER() OVER (ORDER BY "checkedAt", "id") AS rn
          FROM "Check"
          WHERE "monitorId" = ${monitorId} 
            AND "checkedAt" >= ${startDate} 
            AND "checkedAt" <= ${new Date()}
        ),
        changes AS (
          SELECT 
            rn,
            "checkedAt",
            status,
            error,
            CASE 
              WHEN status = 'down' AND (LAG(status) OVER (ORDER BY rn) = 'up' OR LAG(status) OVER (ORDER BY rn) IS NULL) 
                THEN 'start'
              WHEN status = 'up' AND LAG(status) OVER (ORDER BY rn) = 'down'
                THEN 'end'
              ELSE 'none'
            END AS boundary
          FROM ranked
        ),
        starts AS (
          SELECT rn, "checkedAt", error
          FROM changes
          WHERE boundary = 'start'
        ),
        ends AS (
          SELECT rn, "checkedAt"
          FROM changes
          WHERE boundary = 'end'
        )
        SELECT 
          s."checkedAt" AS "startAt",
          e."checkedAt" AS "endAt",
          EXTRACT(EPOCH FROM (e."checkedAt" - s."checkedAt")) * 1000 AS "durationMs",
          s.error AS "cause"
        FROM starts s
        LEFT JOIN LATERAL (
          SELECT "checkedAt"
          FROM ends e
          WHERE e.rn > s.rn
          ORDER BY e.rn
          LIMIT 1
        ) e ON true
        ORDER BY s."checkedAt" DESC
      `
      return incidents.map(i => ({
        startAt: i.startAt,
        endAt: i.endAt,
        durationMs: i.durationMs !== null ? Number(i.durationMs) : 0,
        cause: i.cause ?? null,
      }))
    } catch (e) {
      throw logAndThrow({ context: 'get incidents list', e, name: AnalyticsService.name })
    }
  }

  private async getIncidentsCount(monitorId: string, startDate: Date) {
    try {
      const result = await this.prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*) AS count FROM (
          WITH with_prev AS (
            SELECT 
              status,
              LAG(status) OVER (ORDER BY "checkedAt") AS prev_status
            FROM "Check"
            WHERE "monitorId" = ${monitorId} AND "checkedAt" >= ${startDate} AND "checkedAt" <= ${new Date()}
          )
          SELECT 1
          FROM with_prev
          WHERE status = 'down' AND (prev_status IS NULL OR prev_status != status)
        ) AS down_starts
      `
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

  private async getRawTimeline(monitorId: string, startDate: Date) {
    try {
      const bucketMinutes = this.getBucketMinutes(startDate)
      const results = await this.prisma.$queryRaw<
        {
          bucket: Date
          up: bigint
          down: bigint
          averageResponseTime: number
          p95ResponseTime: number | null
        }[]
      >`
        SELECT
          DATE_TRUNC('minute', "checkedAt") - (EXTRACT(MINUTE FROM "checkedAt")::int % ${bucketMinutes}) * INTERVAL '1 minute' AS bucket,
          COUNT(*) FILTER (WHERE status = 'up') AS up,
          COUNT(*) FILTER (WHERE status = 'down') AS down,
          ROUND(AVG("responseTime") FILTER (WHERE "responseTime" IS NOT NULL), 1) AS "averageResponseTime",
          ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "responseTime")::numeric, 1) AS "p95ResponseTime"
        FROM "Check"
        WHERE "monitorId" = ${monitorId} AND "checkedAt" BETWEEN ${startDate} AND ${new Date()}
        GROUP BY bucket
        ORDER BY bucket ASC
      `
      return results.map(r => ({
        timestamp: r.bucket,
        up: Number(r.up),
        down: Number(r.down),
        averageResponseTime: r.averageResponseTime ? Number(r.averageResponseTime) : null,
        p95ResponseTime: r.p95ResponseTime ? Number(r.p95ResponseTime) : null,
      }))
    } catch (e) {
      throw logAndThrow({ context: 'get timeline', e, name: AnalyticsService.name })
    }
  }

  private getBucketMinutes(startDate: Date) {
    const diffMs = Date.now() - startDate.getTime()
    const diffMinutes = diffMs / (60 * 1000)
    const targetPoints = 100

    const bucket = Math.max(1, Math.floor(diffMinutes / targetPoints))
    const bucketValues = [1, 5, 15, 30, 60, 120, 240, 1440]

    for (const b of bucketValues) if (bucket <= b) return b
    return 1440
  }
}

type UptimeRaw = {
  uptime: number | null
  averageResponseTime: number | null
  p95ResponseTime: number | null
  totalChecks: number | null
}
type UptimeItem = {
  uptime: number | null
  averageResponseTime: number | null
  p95ResponseTime: number | null
  totalChecks: number
}

type DailyStatsRaw = {
  day: string
  uptime: number | null
  averageResponseTime: number | null
  p95ResponseTime: number | null
  failureCount: number | null
}
type DailyStats = {
  day: string
  uptime: number
  averageResponseTime: number | null
  p95ResponseTime: number | null
  failureCount: number
}[]

type IncidentRaw = { startAt: Date; endAt: Date; cause: string | null; durationMs: number | null }
type Incidents = { startAt: Date; endAt: Date; cause: string | null; durationMs: number }[]

export interface OverviewResult {
  monitorId: string
  monitorName: string
  periodDays: number
  startDate: Date
  endDate: Date
  totalChecks: number
  uptime: number | null
  averageResponseTime: number | null
  p95ResponseTime: number | null
  dailyStats: DailyStats
}
