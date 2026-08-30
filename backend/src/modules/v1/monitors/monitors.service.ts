import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
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

import { Logger } from '@/shared/logger/logger.service'
import { PrismaService } from '@/shared/prisma/prisma.service'
import { logAndThrow } from '@/shared/utils/error.utils'

import { CreateMonitorDto } from './dto/requests/create-monitor.dto'
import { UpdateMonitorDto } from './dto/requests/update-monitor.dto'
import { getIncidentsCountSql, getTrendSql } from './monitors.sql'
import {
  monitorRequestData,
  handleDnsTransaction,
  handleHttpTransaction,
  handleIcmpTransaction,
  handleTcpTransaction,
  Tx,
  UpdateData,
  getDomainByType,
} from './monitors.utils'

@Injectable()
export class MonitorsService {
  private logger: Logger
  constructor(
    private prisma: PrismaService,
    baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: MonitorsService.name })
  }

  async create(userId: string, dto: CreateMonitorDto) {
    const monitorsCount = await this.prisma.monitor.count({ where: { userId } })
    if (monitorsCount >= 5) {
      this.logger.warn('User attempted to create monitor beyond limit', { userId })
      throw new ForbiddenException('You have reached the maximum number of monitors')
    }

    const monitorType = dto.type
    const newMonitor = await this.prisma.monitor.create({
      data: monitorRequestData(userId, monitorType, dto),
      select: {
        id: true,
        type: true,
        httpMonitor: monitorType === MonitorType.HTTP,
        tcpMonitor: monitorType === MonitorType.TCP,
        icmpMonitor: monitorType === MonitorType.ICMP,
        dnsMonitor: monitorType === MonitorType.DNS,
      },
    })

    this.logger.log('Created monitor', { monitorId: newMonitor.id, monitorType, userId })
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
        const sparkline = stat?.sparkline.map(s => Number(s)) ?? []

        const trend = { avgResponseTime, sparkline }
        const data = { ...rest, trend, weekUptime }

        return {
          ...data,
          domain: getDomainByType({
            type: rest.type,
            url: httpMonitor?.url,
            host: icmpMonitor?.host || tcpMonitor?.host || dnsMonitor?.host,
            port: tcpMonitor?.port,
          }),
        }
      },
    )

    return {
      monitors: formattedMonitors,
      incidentsCount: await this.getIncidentsCountForMonitors(monitorIds),
    }
  }

  private async getIncidentsCountForMonitors(monitorIds: string[]) {
    const result = await this.prisma.$queryRaw<{ monitorId: string; count: bigint }[]>(
      getIncidentsCountSql(monitorIds),
    )
    return result.reduce((a, b) => a + Number(b.count), 0)
  }

  async findById(userId: string, id: string) {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        checkInterval: true,
        timeout: true,
        lastStatus: true,
        lastCheckedAt: true,
        userId: true,
        httpMonitor: true,
        icmpMonitor: true,
        tcpMonitor: true,
        dnsMonitor: true,
      },
    })
    if (!monitor || monitor.userId !== userId) {
      this.logger.warn('Monitor not found or access denied', { userId, monitorId: id })
      throw new NotFoundException('Monitor not found')
    }

    const { httpMonitor, icmpMonitor, tcpMonitor, dnsMonitor, userId: _userId, ...rest } = monitor
    const domain = getDomainByType({
      type: rest.type,
      url: httpMonitor?.url,
      host: icmpMonitor?.host || tcpMonitor?.host || dnsMonitor?.host,
      port: tcpMonitor?.port,
    })
    if (rest.type === MonitorType.HTTP) return { ...rest, httpMonitor, domain }
    if (rest.type === MonitorType.ICMP) return { ...rest, icmpMonitor, domain }
    if (rest.type === MonitorType.TCP) return { ...rest, tcpMonitor, domain }
    if (rest.type === MonitorType.DNS) return { ...rest, dnsMonitor, domain }
    return { ...rest, domain }
  }

  async update(userId: string, id: string, dto: UpdateMonitorDto) {
    const existing = await this.prisma.monitor.findUnique({
      where: { id },
      select: {
        userId: true,
        type: true,
        httpMonitor: true,
        icmpMonitor: true,
        tcpMonitor: true,
        dnsMonitor: true,
      },
    })
    if (!existing || existing.userId !== userId) {
      this.logger.warn('Monitor not found or access denied', { userId, monitorId: id })
      throw new NotFoundException('Monitor not found')
    }

    const updateData: Partial<Pick<Monitor, 'name' | 'checkInterval' | 'timeout'>> = {}
    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.checkInterval !== undefined) updateData.checkInterval = dto.checkInterval
    if (dto.timeout !== undefined) updateData.timeout = dto.timeout

    switch (existing.type) {
      case MonitorType.HTTP:
        if (!existing.httpMonitor) {
          this.logger.warn('httpMonitor data is missing', { monitorId: id, userId })
          throw new InternalServerErrorException('HTTP monitor data missing')
        }
        return await this.updateMonitor<{ httpMonitor: HttpMonitor }>(
          id,
          existing as Partial<Monitor> & { httpMonitor: HttpMonitor },
          updateData,
          dto,
          handleHttpTransaction,
          userId,
        )

      case MonitorType.ICMP:
        if (!existing.icmpMonitor) {
          this.logger.warn('icmpMonitor data is missing', { monitorId: id, userId })
          throw new InternalServerErrorException('ICMP monitor data missing')
        }
        return await this.updateMonitor<{ icmpMonitor: IcmpMonitor }>(
          id,
          existing as Partial<Monitor> & { icmpMonitor: IcmpMonitor },
          updateData,
          dto,
          handleIcmpTransaction,
          userId,
        )

      case MonitorType.TCP:
        if (!existing.tcpMonitor) {
          this.logger.warn('tcpMonitor data is missing', { monitorId: id, userId })
          throw new InternalServerErrorException('TCP monitor data missing')
        }
        return await this.updateMonitor<{ tcpMonitor: TcpMonitor }>(
          id,
          existing as Partial<Monitor> & { tcpMonitor: TcpMonitor },
          updateData,
          dto,
          handleTcpTransaction,
          userId,
        )

      case MonitorType.DNS:
        if (!existing.dnsMonitor) {
          this.logger.warn('dnsMonitor data is missing', { monitorId: id, userId })
          throw new InternalServerErrorException('DNS monitor data missing')
        }
        return await this.updateMonitor<{ dnsMonitor: DnsMonitor }>(
          id,
          existing as Partial<Monitor> & { dnsMonitor: DnsMonitor },
          updateData,
          dto,
          handleDnsTransaction,
          userId,
        )

      default:
        this.logger.warn('Unknown monitor type', { monitorType: existing.type, userId })
        throw new InternalServerErrorException(`Unknown monitor type`)
    }
  }

  private async updateMonitor<T>(
    id: string,
    existing: Partial<Monitor> & T,
    updateData: UpdateData,
    dto: UpdateMonitorDto,
    transactionHandler: (
      tx: Tx,
      id: string,
      existing: Partial<Monitor> & T,
      updateData: UpdateData,
      dto: UpdateMonitorDto,
    ) => Promise<Monitor & T>,
    userId: string,
  ) {
    const updatedMonitor = await this.prisma.$transaction(async tx =>
      transactionHandler(tx, id, existing, updateData, dto),
    )

    this.logger.log('Monitor updated', { monitorType: existing.type, monitorId: id, userId })
    return updatedMonitor
  }

  async delete(userId: string, id: string) {
    try {
      const monitor = await this.prisma.monitor.findUnique({
        where: { id },
        select: { userId: true },
      })
      if (!monitor || monitor.userId !== userId) {
        this.logger.warn('Monitor not found or access denied', { userId, monitorId: id })
        throw new NotFoundException('Monitor not found')
      }

      await this.prisma.monitor.deleteMany({ where: { id } })
      this.logger.log('Monitor deleted', { userId, monitorId: id })
    } catch (e) {
      throw logAndThrow({
        logger: this.logger,
        context: 'delete monitor',
        e,
        exception: NotFoundException,
        exceptionContext: 'Uptime monitoring service not found',
      })
    }
  }
}
