import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { HttpMonitor, IcmpMonitor, Method, Monitor, MonitorType, TcpMonitor } from '@prisma/client'

import { PrismaService } from '@/backend/shared/prisma/prisma.service'

import { MonitorCheckService } from '../monitor-check/monitor-check.service'

import { CreateHttpMonitorDto } from './dto/requests/create-monitor/create-http-monitor.dto'
import { CreateIcmpMonitorDto } from './dto/requests/create-monitor/create-icmp-monitor.dto'
import { CreateTcpMonitorDto } from './dto/requests/create-monitor/create-tcp-monitor.dto'
import { UpdateHttpMonitorDto } from './dto/requests/update-monitor/update-http-monitor.dto'
import { UpdateIcmpMonitorDto } from './dto/requests/update-monitor/update-icmp-monitor.dto'
import { UpdateTcpMonitorDto } from './dto/requests/update-monitor/update-tcp-monitor.dto'

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name)
  constructor(
    private prisma: PrismaService,
    private monitorCheckService: MonitorCheckService,
  ) {}

  async create(
    clientId: string,
    dto: CreateHttpMonitorDto | CreateIcmpMonitorDto | CreateTcpMonitorDto,
  ) {
    const monitorCount = await this.prisma.monitor.count({ where: { clientId } })
    if (monitorCount >= 5)
      throw new ForbiddenException('You have reached the maximum number of monitors')

    switch (dto.type) {
      case MonitorType.HTTP:
        return await this.createHttp(clientId, dto)

      case MonitorType.ICMP:
        return await this.createIcmp(clientId, dto)

      case MonitorType.TCP:
        return await this.createTcp(clientId, dto)

      default:
        throw new BadRequestException(`Unknown monitor type`)
    }
  }

  async createHttp(clientId: string, dto: CreateHttpMonitorDto) {
    const newMonitor = await this.prisma.monitor.create({
      data: {
        clientId,
        name: dto.name,
        checkInterval: dto.checkInterval ?? 10,
        timeout: dto.timeout ?? 5000,
        type: MonitorType.HTTP,
        httpMonitor: {
          create: {
            url: dto.url,
            method: dto.method ?? Method.HEAD,
          },
        },
      },

      include: { httpMonitor: true },
    })

    this.logger.log(`Created HTTP monitor ${newMonitor.id}`)
    await this.monitorCheckService.scheduleCheck({
      monitorId: newMonitor.id,
      checkInterval: newMonitor.checkInterval,
      immediate: true,
    })
    return newMonitor
  }

  async createTcp(clientId: string, dto: CreateTcpMonitorDto) {
    const newMonitor = await this.prisma.monitor.create({
      data: {
        clientId,
        name: dto.name,
        checkInterval: dto.checkInterval ?? 10,
        timeout: dto.timeout ?? 5000,
        type: MonitorType.TCP,
        tcpMonitor: {
          create: { host: dto.host, port: dto.port },
        },
      },

      include: { tcpMonitor: true },
    })

    this.logger.log(`Created TCP monitor ${newMonitor.id}`)
    await this.monitorCheckService.scheduleCheck({
      monitorId: newMonitor.id,
      checkInterval: newMonitor.checkInterval,
      immediate: true,
    })
    return newMonitor
  }

  async createIcmp(clientId: string, dto: CreateIcmpMonitorDto) {
    const newMonitor = await this.prisma.monitor.create({
      data: {
        clientId,
        name: dto.name,
        checkInterval: dto.checkInterval ?? 10,
        timeout: dto.timeout ?? 5000,
        type: MonitorType.ICMP,
        icmpMonitor: {
          create: { host: dto.host },
        },
      },

      include: { icmpMonitor: true },
    })

    this.logger.log(`Created ICMP monitor ${newMonitor.id}`)
    await this.monitorCheckService.scheduleCheck({
      monitorId: newMonitor.id,
      checkInterval: newMonitor.checkInterval,
      immediate: true,
    })
    return newMonitor
  }

  async findAllByClientId(clientId: string) {
    const monitors = await this.prisma.monitor.findMany({
      where: { clientId },
      include: { httpMonitor: true, icmpMonitor: true, tcpMonitor: true },
      orderBy: { createdAt: 'desc' },
    })

    return monitors.map(({ httpMonitor, icmpMonitor, tcpMonitor, ...rest }) => {
      if (rest.type === MonitorType.HTTP) return { ...rest, httpMonitor }
      if (rest.type === MonitorType.ICMP) return { ...rest, icmpMonitor }
      if (rest.type === MonitorType.TCP) return { ...rest, tcpMonitor }
      return rest
    })
  }

  async findById(clientId: string, id: string) {
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
      },
    })
    if (!monitor) throw new NotFoundException('Uptime monitoring service not found')
    if (monitor.clientId !== clientId)
      throw new ForbiddenException('Uptime monitoring service not found')

    const { httpMonitor, icmpMonitor, tcpMonitor, ...rest } = monitor

    if (rest.type === MonitorType.HTTP) return { ...rest, httpMonitor }
    if (rest.type === MonitorType.ICMP) return { ...rest, icmpMonitor }
    if (rest.type === MonitorType.TCP) return { ...rest, tcpMonitor }
    return rest
  }

  async update(
    clientId: string,
    id: string,
    dto: UpdateHttpMonitorDto | UpdateIcmpMonitorDto | UpdateTcpMonitorDto,
  ) {
    const existing = await this.prisma.monitor.findUnique({
      where: { id },
      include: { httpMonitor: true, icmpMonitor: true, tcpMonitor: true },
    })
    if (!existing || existing.clientId !== clientId)
      throw new NotFoundException('Monitor not found')

    const updateData: Partial<Pick<Monitor, 'name' | 'checkInterval' | 'timeout'>> = {}
    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.checkInterval !== undefined) updateData.checkInterval = dto.checkInterval
    if (dto.timeout !== undefined) updateData.timeout = dto.timeout

    switch (existing.type) {
      case MonitorType.HTTP:
        return await this.updateHttp(id, existing, dto)

      case MonitorType.ICMP:
        return await this.updateIcmp(id, existing, dto)

      case MonitorType.TCP:
        return await this.updateTcp(id, existing, dto)

      default:
        throw new BadRequestException(`Unknown monitor type`)
    }
  }

  async updateHttp(
    id: string,
    existing: Monitor & { httpMonitor: HttpMonitor | null },
    dto: UpdateHttpMonitorDto,
  ) {
    const updateData: Partial<Monitor> = {}
    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.checkInterval !== undefined) updateData.checkInterval = dto.checkInterval
    if (dto.timeout !== undefined) updateData.timeout = dto.timeout

    const updatedMonitor = await this.prisma.$transaction(async tx => {
      await tx.monitor.update({ where: { id }, data: updateData })

      const url = dto.url ?? existing.httpMonitor?.url
      if (!url) throw new BadRequestException('URL required')

      const method = dto.method ?? existing.httpMonitor?.method ?? Method.HEAD
      await tx.httpMonitor.upsert({
        where: { monitorId: id },
        update: { url, method },
        create: { monitorId: id, url, method },
      })

      const updatedHttpMonitor = await tx.monitor.findUnique({
        where: { id },
        include: { httpMonitor: true },
      })

      this.logger.log(
        `HTTP monitor ${updatedHttpMonitor?.id} updated successfully. From ${JSON.stringify(existing)} to ${JSON.stringify(updatedHttpMonitor)}`,
      )
      return updatedHttpMonitor
    })

    if (
      updateData.checkInterval !== undefined &&
      updateData.checkInterval !== existing.checkInterval
    ) {
      await this.monitorCheckService.scheduleCheck({
        monitorId: id,
        checkInterval: updateData.checkInterval,
        immediate: false,
      })
    }
    return updatedMonitor
  }

  async updateIcmp(
    id: string,
    existing: Monitor & { icmpMonitor: IcmpMonitor | null },
    dto: UpdateIcmpMonitorDto,
  ) {
    const updateData: Partial<Monitor> = {}
    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.checkInterval !== undefined) updateData.checkInterval = dto.checkInterval
    if (dto.timeout !== undefined) updateData.timeout = dto.timeout

    const updatedMonitor = await this.prisma.$transaction(async tx => {
      await tx.monitor.update({ where: { id }, data: updateData })

      const host = dto.host ?? existing.icmpMonitor?.host
      if (!host) throw new BadRequestException('Host required')

      await tx.icmpMonitor.upsert({
        where: { monitorId: id },
        update: { host },
        create: { monitorId: id, host },
      })

      const updatedIcmpMonitor = await tx.monitor.findUnique({
        where: { id },
        include: { icmpMonitor: true },
      })

      this.logger.log(
        `ICMP monitor ${updatedIcmpMonitor?.id} updated successfully. From ${JSON.stringify(existing)} to ${JSON.stringify(updatedIcmpMonitor)}`,
      )
      return updatedIcmpMonitor
    })

    if (
      updateData.checkInterval !== undefined &&
      updateData.checkInterval !== existing.checkInterval
    ) {
      await this.monitorCheckService.scheduleCheck({
        monitorId: id,
        checkInterval: updateData.checkInterval,
        immediate: false,
      })
    }
    return updatedMonitor
  }

  async updateTcp(
    id: string,
    existing: Monitor & { tcpMonitor: TcpMonitor | null },
    dto: UpdateTcpMonitorDto,
  ) {
    const updateData: Partial<Monitor> = {}
    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.checkInterval !== undefined) updateData.checkInterval = dto.checkInterval
    if (dto.timeout !== undefined) updateData.timeout = dto.timeout

    const updatedMonitor = await this.prisma.$transaction(async tx => {
      await tx.monitor.update({ where: { id }, data: updateData })

      const host = dto.host ?? existing.tcpMonitor?.host
      const port = dto.port ?? existing.tcpMonitor?.port
      if (!host || !port) throw new BadRequestException('Host and port required')

      await tx.tcpMonitor.upsert({
        where: { monitorId: id },
        update: { host, port },
        create: { monitorId: id, host, port },
      })

      const updatedTcpMonitor = await tx.monitor.findUnique({
        where: { id },
        include: { tcpMonitor: true },
      })

      this.logger.log(
        `ICMP monitor ${updatedTcpMonitor?.id} updated successfully. From ${JSON.stringify(existing)} to ${JSON.stringify(updatedTcpMonitor)}`,
      )
      return updatedTcpMonitor
    })

    if (
      updateData.checkInterval !== undefined &&
      updateData.checkInterval !== existing.checkInterval
    ) {
      try {
        await this.monitorCheckService.scheduleCheck({
          monitorId: id,
          checkInterval: updateData.checkInterval,
          immediate: false,
        })
      } catch (e) {
        const details = e instanceof Error ? e.message : 'unexpected error'
        this.logger.error(`Failed to reschedule monitor ${id}: ${details}`)
      }
    }
    return updatedMonitor
  }

  async delete(clientId: string, id: string) {
    try {
      const monitor = await this.prisma.monitor.findUnique({ where: { id } })
      if (!monitor || monitor?.clientId !== clientId)
        throw new NotFoundException('Monitor not found')

      await this.prisma.monitor.delete({ where: { id } })
      await this.monitorCheckService.clearScheduledJobs(monitor.id)
    } catch (e) {
      const details = e instanceof Error ? e.message : 'unexpected error'
      throw new NotFoundException(`Uptime monitoring service not found: ${details}`)
    }
  }
}
