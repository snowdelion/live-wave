import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '@/backend/shared/prisma/prisma.service'

import { CreateMonitorDto } from './dto/create-monitor.dto'
import { UpdateMonitorDto } from './dto/update-monitor.dto'

@Injectable()
export class MonitorService {
  constructor(private prisma: PrismaService) {}

  async create(clientId: string, dto: CreateMonitorDto) {
    return await this.prisma.monitor.create({
      data: {
        name: dto.name,
        url: dto.url,
        method: dto.method ?? 'HEAD',
        checkInterval: dto.checkInterval ?? 10,
        timeout: dto.timeout ?? 5000,
        clientId,
      },
    })
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
      const monitor = await this.prisma.monitor.update({
        where: { id },
        data: dto,
      })
      if (monitor.clientId !== clientId)
        throw new ForbiddenException('Uptime monitoring service not found')

      return monitor
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
    } catch (e) {
      const details = e instanceof Error ? e.message : 'unexpected error'
      throw new NotFoundException(`Uptime monitoring service not found: ${details}`)
    }
  }
}
