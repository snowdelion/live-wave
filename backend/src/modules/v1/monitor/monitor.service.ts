import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {
  DnsMonitor,
  HttpMonitor,
  IcmpMonitor,
  Monitor,
  MonitorType,
  TcpMonitor,
} from '@prisma/client'

import { PrismaService } from '@/shared/prisma/prisma.service'
import { logAndThrow } from '@/shared/utils/error.utils'

import { MonitorCheckService } from '../monitor-check/monitor-check.service'

import { CreateMonitorDto } from './dto/requests/create-monitor.dto'
import { UpdateMonitorDto } from './dto/requests/update-monitor.dto'
import {
  monitorRequestData,
  handleDnsTransaction,
  handleHttpTransaction,
  handleIcmpTransaction,
  handleTcpTransaction,
  Tx,
  UpdateData,
  getTrendSql,
} from './monitor.utils'

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name)
  constructor(
    private prisma: PrismaService,
    private monitorCheckService: MonitorCheckService,
  ) {}

  async create(userId: string, dto: CreateMonitorDto) {
    const monitorCount = await this.prisma.monitor.count({ where: { userId } })
    if (monitorCount >= 5)
      throw new ForbiddenException('You have reached the maximum number of monitors')

    const monitorType = dto.type
    const newMonitor = await this.prisma.monitor.create({
      data: monitorRequestData(userId, monitorType, dto),
      include: {
        httpMonitor: monitorType === MonitorType.HTTP,
        tcpMonitor: monitorType === MonitorType.TCP,
        icmpMonitor: monitorType === MonitorType.ICMP,
        dnsMonitor: monitorType === MonitorType.DNS,
      },
    })

    this.logger.debug(`Created ${monitorType} monitor ${newMonitor.id}`)
    await this.monitorCheckService.scheduleCheck({
      monitorId: newMonitor.id,
      checkInterval: newMonitor.checkInterval,
      immediate: true,
    })
    return newMonitor
  }

  async findAllByUserId(userId: string) {
    const monitors = await this.prisma.monitor.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        lastStatus: true,
        type: true,
        lastCheckedAt: true,
        httpMonitor: { select: { url: true } },
        icmpMonitor: { select: { host: true } },
        tcpMonitor: { select: { host: true, port: true } },
        dnsMonitor: { select: { host: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (monitors.length === 0) return { monitors: [], incidentsCount: 0 }

    const monitorIds = monitors.map(m => m.id)
    const stats = await this.prisma.$queryRaw<
      {
        monitorId: string
        total: number
        up: number
        avgResponse: number | null
        minResponse: number | null
        maxResponse: number | null
        sparkline: number[]
      }[]
    >(getTrendSql(monitorIds))

    const statsMap = new Map(stats.map(s => [s.monitorId, s]))

    const formattedMonitors = monitors.map(
      ({ httpMonitor, icmpMonitor, tcpMonitor, dnsMonitor, ...rest }) => {
        const stat = statsMap.get(rest.id)
        const total = stat?.total ? Number(stat.total) : 0
        const up = stat?.up ? Number(stat.up) : 0
        const weekUptime = total > 0 ? Math.round((up / total) * 100 * 100) / 100 : null

        const avgResponseTime = stat?.avgResponse ? Number(stat.avgResponse) : null
        const minResponseTime = stat?.minResponse ? Number(stat.minResponse) : null
        const maxResponseTime = stat?.maxResponse ? Number(stat.maxResponse) : null
        const sparkline = stat?.sparkline.map(s => Number(s)) ?? []

        const trend = { avgResponseTime, minResponseTime, maxResponseTime, sparkline }
        const data = { ...rest, trend, weekUptime }

        if (rest.type === MonitorType.HTTP) return { ...data, domain: httpMonitor?.url }
        if (rest.type === MonitorType.ICMP) return { ...data, domain: icmpMonitor?.host }
        if (rest.type === MonitorType.TCP)
          return { ...data, domain: `${tcpMonitor?.host}:${tcpMonitor?.port}` }
        if (rest.type === MonitorType.DNS) return { ...data, domain: dnsMonitor?.host }
        return data
      },
    )

    return {
      monitors: formattedMonitors,
      incidentsCount: await this.getIncidentsCountForMonitors(monitorIds),
    }
  }

  private async getIncidentsCountForMonitors(monitorIds: string[]) {
    const result = await this.prisma.$queryRaw<{ monitorId: string; count: bigint }[]>`
      SELECT "monitorId", COUNT(*) AS count FROM (
        WITH with_prev AS (
          SELECT
            "monitorId",
            status,
            LAG(status) OVER (PARTITION BY "monitorId" ORDER BY "checkedAt") AS prev_status
            FROM "Check"
            WHERE "monitorId" = ANY(${monitorIds}) AND "checkedAt" >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
        )
        SELECT "monitorId", 1
        FROM with_prev
        WHERE status = 'down' AND (prev_status IS NULL OR prev_status != status)
      ) AS down_starts
      GROUP BY "monitorId"
    `
    return result.reduce((a, b) => a + Number(b.count), 0)
  }

  async findById(userId: string, id: string) {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id },
      include: {
        checks: {
          orderBy: { checkedAt: 'desc' },
          take: 10,
        },
        httpMonitor: true,
        icmpMonitor: true,
        tcpMonitor: true,
        dnsMonitor: true,
      },
    })
    if (!monitor) throw new NotFoundException('Uptime monitoring service not found')
    if (monitor.userId !== userId)
      throw new ForbiddenException('Uptime monitoring service not found')

    const { httpMonitor, icmpMonitor, tcpMonitor, dnsMonitor, ...rest } = monitor
    if (rest.type === MonitorType.HTTP) return { ...rest, httpMonitor }
    if (rest.type === MonitorType.ICMP) return { ...rest, icmpMonitor }
    if (rest.type === MonitorType.TCP) return { ...rest, tcpMonitor }
    if (rest.type === MonitorType.DNS) return { ...rest, dnsMonitor }
    return rest
  }

  async update(userId: string, id: string, dto: UpdateMonitorDto) {
    const existing = await this.prisma.monitor.findUnique({
      where: { id },
      include: { httpMonitor: true, icmpMonitor: true, tcpMonitor: true, dnsMonitor: true },
    })
    if (!existing || existing.userId !== userId) throw new NotFoundException('Monitor not found')

    const updateData: Partial<Pick<Monitor, 'name' | 'checkInterval' | 'timeout'>> = {}
    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.checkInterval !== undefined) updateData.checkInterval = dto.checkInterval
    if (dto.timeout !== undefined) updateData.timeout = dto.timeout

    switch (existing.type) {
      case MonitorType.HTTP:
        if (!existing.httpMonitor) throw new BadRequestException('HTTP monitor data missing')
        return await this.updateMonitor<{ httpMonitor: HttpMonitor }>(
          id,
          existing as Monitor & { httpMonitor: HttpMonitor },
          updateData,
          dto,
          handleHttpTransaction,
        )

      case MonitorType.ICMP:
        if (!existing.icmpMonitor) throw new BadRequestException('ICMP monitor data missing')
        return await this.updateMonitor<{ icmpMonitor: IcmpMonitor }>(
          id,
          existing as Monitor & { icmpMonitor: IcmpMonitor },
          updateData,
          dto,
          handleIcmpTransaction,
        )

      case MonitorType.TCP:
        if (!existing.tcpMonitor) throw new BadRequestException('ICMP monitor data missing')
        return await this.updateMonitor<{ tcpMonitor: TcpMonitor }>(
          id,
          existing as Monitor & { tcpMonitor: TcpMonitor },
          updateData,
          dto,
          handleTcpTransaction,
        )

      case MonitorType.DNS:
        if (!existing.dnsMonitor) throw new BadRequestException('ICMP monitor data missing')
        return await this.updateMonitor<{ dnsMonitor: DnsMonitor }>(
          id,
          existing as Monitor & { dnsMonitor: DnsMonitor },
          updateData,
          dto,
          handleDnsTransaction,
        )

      default:
        throw new BadRequestException(`Unknown monitor type`)
    }
  }

  private async updateMonitor<T>(
    id: string,
    existing: Monitor & T,
    updateData: UpdateData,
    dto: UpdateMonitorDto,
    transactionHandler: (
      tx: Tx,
      id: string,
      existing: Monitor & T,
      updateData: UpdateData,
      dto: UpdateMonitorDto,
    ) => Promise<Monitor & T>,
  ) {
    const updatedMonitor = await this.prisma.$transaction(async tx =>
      transactionHandler(tx, id, existing, updateData, dto),
    )

    await this.rescheduleIfNeeded(id, existing.checkInterval, updateData.checkInterval)
    this.logger.debug(`${existing.type} monitor "${id}" updated successfully`)
    return updatedMonitor
  }

  async delete(userId: string, id: string) {
    try {
      const monitor = await this.prisma.monitor.findUnique({ where: { id } })
      if (!monitor || monitor?.userId !== userId) throw new NotFoundException('Monitor not found')

      await this.prisma.monitor.delete({ where: { id } })
      await this.monitorCheckService.clearScheduledJobs(monitor.id)
    } catch (e) {
      throw logAndThrow({
        name: MonitorService.name,
        context: 'delete monitor',
        e,
        exception: NotFoundException,
        exceptionContext: 'Uptime monitoring service not found',
      })
    }
  }

  private async rescheduleIfNeeded(
    monitorId: string,
    oldInterval: number,
    newInterval: number | undefined,
  ) {
    if (newInterval !== undefined && newInterval !== oldInterval)
      await this.monitorCheckService.scheduleCheck({
        monitorId,
        checkInterval: newInterval,
        immediate: false,
      })
  }
}
