import { Injectable, NotFoundException } from '@nestjs/common'
import { StatusEnum } from '@prisma/client'

import { PrismaService } from '@/shared/prisma/prisma.service'
import { logAndThrow } from '@/shared/utils/error.utils'

import { getTimelineSql } from '../analytics.sql'

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) {}

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
      throw logAndThrow({ context: 'get timeline', e, name: TimelineService.name })
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
