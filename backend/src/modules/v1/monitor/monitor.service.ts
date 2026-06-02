import { InjectQueue } from '@nestjs/bull'
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Method } from '@prisma/client'
import type { Queue } from 'bull'

import { BULL_KEYS, BULL_NAMES } from '@/backend/shared/bull/bull.constants'
import { PrismaService } from '@/backend/shared/prisma/prisma.service'

import { MonitorCheckService } from '../monitor-check/monitor-check.service'

import { CreateMonitorDto } from './dto/requests/create-monitor.dto'
import { UpdateMonitorDto } from './dto/requests/update-monitor.dto'

@Injectable()
export class MonitorService {
  constructor(
    private prisma: PrismaService,
    private monitorCheckService: MonitorCheckService,
    @InjectQueue(BULL_NAMES.QUEUE) private checksQueue: Queue,
  ) {}

  async create(clientId: string, dto: CreateMonitorDto) {
    const monitorCount = await this.prisma.monitor.count({ where: { clientId } })
    if (monitorCount >= 5)
      throw new ForbiddenException('You have reached the maximum number of monitors')

    const newMonitor = await this.prisma.monitor.create({
      data: {
        name: dto.name,
        url: dto.url,
        method: dto.method ?? Method.HEAD,
        checkInterval: dto.checkInterval ?? 10,
        timeout: dto.timeout ?? 5000,
        clientId,
      },
    })

    await this.monitorCheckService.scheduleCheck(newMonitor)
    return newMonitor
  }

  async findAllByClientId(clientId: string) {
    return await this.prisma.monitor.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
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
      },
    })
    if (!monitor) throw new NotFoundException('Uptime monitoring service not found')
    if (monitor.clientId !== clientId)
      throw new ForbiddenException('Uptime monitoring service not found')

    return monitor
  }

  async update(clientId: string, id: string, dto: UpdateMonitorDto) {
    try {
      const oldMonitor = await this.prisma.monitor.findUnique({ where: { id } })
      const updatedMonitor = await this.prisma.monitor.update({
        where: { id },
        data: dto,
      })

      if (updatedMonitor.clientId !== clientId)
        throw new ForbiddenException('Uptime monitoring service not found')

      if (dto.checkInterval !== undefined && dto.checkInterval !== oldMonitor?.checkInterval)
        await this.monitorCheckService.scheduleCheck(updatedMonitor)

      return updatedMonitor
    } catch (e) {
      const details = e instanceof Error ? e.message : 'unexpected error'
      throw new NotFoundException(`Uptime monitoring service not found: ${details}`)
    }
  }

  async delete(clientId: string, id: string) {
    try {
      const monitor = await this.prisma.monitor.findUnique({ where: { id } })
      if (monitor?.clientId !== clientId) throw new ForbiddenException('Access denied')

      await this.prisma.monitor.delete({ where: { id, clientId } })
      await this.checksQueue.removeJobs(`${BULL_KEYS.RAW_CHECK(monitor.id)}-*`)
    } catch (e) {
      const details = e instanceof Error ? e.message : 'unexpected error'
      throw new NotFoundException(`Uptime monitoring service not found: ${details}`)
    }
  }
}
