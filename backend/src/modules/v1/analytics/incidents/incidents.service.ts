import { Injectable, NotFoundException } from '@nestjs/common'

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { logAndThrow } from '@/shared/utils/error.utils'

import { getIncidentsCountSql, getIncidentsSql } from '../analytics.sql'

@Injectable()
export class IncidentsService {
  private logger: Logger
  constructor(
    private prisma: PrismaService,
    baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: IncidentsService.name })
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
    if (!monitor || monitor.userId !== userId) {
      this.logger.warn('Monitor not found or access forbidden', {
        hasMonitor: !!monitor,
        currentUser: userId,
        monitorUser: monitor?.userId,
      })
      throw new NotFoundException('Monitor not found')
    }

    const incidents = await this.getIncidentsList(monitorId, startDate)
    const total = await this.getIncidentsCount(monitorId, startDate)

    return { incidents, total }
  }

  private async getIncidentsList(monitorId: string, startDate: Date): Promise<Incidents> {
    try {
      const incidents = await this.prisma.$queryRaw<IncidentRaw[]>(
        getIncidentsSql(monitorId, startDate),
      )
      this.logger.debug('Incidents list fetched from DB', {
        monitorId,
        startDate,
      })

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
      throw logAndThrow({ context: 'get incidents list', e, logger: this.logger })
    }
  }

  private async getIncidentsCount(monitorId: string, startDate: Date) {
    try {
      const result = await this.prisma.$queryRaw<{ count: number }[]>(
        getIncidentsCountSql(monitorId, startDate),
      )
      this.logger.debug('Incidents count fetched from DB', {
        monitorId,
        startDate,
      })
      return Number(result[0]?.count ?? 0)
    } catch (e) {
      throw logAndThrow({ context: 'get incidents count', e, logger: this.logger })
    }
  }
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
