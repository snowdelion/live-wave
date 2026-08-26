import { BadRequestException } from '@nestjs/common'
import {
  type DnsMonitor,
  type HttpMonitor,
  type IcmpMonitor,
  Method,
  type Monitor,
  MonitorType,
  type Prisma,
  type PrismaClient,
  RecordType,
  type TcpMonitor,
} from '@prisma/client'
import type { DefaultArgs } from '@prisma/client/runtime/library'

import type { CreateMonitorDto } from './dto/requests/create-monitor.dto'
import type { UpdateMonitorDto } from './dto/requests/update-monitor.dto'

export function monitorRequestData(userId: string, type: MonitorType, dto: CreateMonitorDto) {
  const data = {
    userId,
    name: dto.name,
    checkInterval: dto.checkInterval ?? 10,
    timeout: dto.timeout ?? 5000,
  }

  switch (type) {
    case MonitorType.HTTP:
      if (!dto.url) throw new BadRequestException('URL is required')
      return {
        ...data,
        type: MonitorType.HTTP,
        httpMonitor: {
          create: {
            url: dto.url,
            method: dto.method ?? Method.HEAD,
          },
        },
      }

    case MonitorType.ICMP:
      if (!dto.host) throw new BadRequestException('Host required')
      return {
        ...data,
        type: MonitorType.ICMP,
        icmpMonitor: {
          create: { host: dto.host },
        },
      }

    case MonitorType.TCP:
      if (!dto.host || !dto.port) throw new BadRequestException('Host and port are required')
      return {
        ...data,
        type: MonitorType.TCP,
        tcpMonitor: {
          create: { host: dto.host, port: dto.port },
        },
      }

    case MonitorType.DNS:
      if (!dto.host) throw new BadRequestException('Host required')
      return {
        ...data,
        type: MonitorType.DNS,
        dnsMonitor: {
          create: { host: dto.host, recordType: dto.recordType ?? RecordType.A },
        },
      }

    default:
      throw new BadRequestException('Unknown monitor type')
  }
}

export async function handleHttpTransaction(
  tx: Tx,
  id: string,
  existing: Partial<Monitor> & { httpMonitor: HttpMonitor | null },
  updateData: UpdateData,
  dto: UpdateMonitorDto,
) {
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
    select: { httpMonitor: true, type: true },
  })
  if (!updatedHttpMonitor) throw new Error('HTTP monitor not found after update')

  return updatedHttpMonitor as Monitor & { httpMonitor: HttpMonitor }
}

export async function handleIcmpTransaction(
  tx: Tx,
  id: string,
  existing: Partial<Monitor> & { icmpMonitor: IcmpMonitor | null },
  updateData: UpdateData,
  dto: UpdateMonitorDto,
) {
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
    select: { icmpMonitor: true, type: true },
  })
  if (!updatedIcmpMonitor) throw new Error('HTTP monitor not found after update')

  return updatedIcmpMonitor as Monitor & { icmpMonitor: IcmpMonitor }
}

export async function handleTcpTransaction(
  tx: Tx,
  id: string,
  existing: Partial<Monitor> & { tcpMonitor: TcpMonitor | null },
  updateData: UpdateData,
  dto: UpdateMonitorDto,
) {
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
    select: { tcpMonitor: true, type: true },
  })
  if (!updatedTcpMonitor) throw new Error('HTTP monitor not found after update')

  return updatedTcpMonitor as Monitor & { tcpMonitor: TcpMonitor }
}

export async function handleDnsTransaction(
  tx: Tx,
  id: string,
  existing: Partial<Monitor> & { dnsMonitor: DnsMonitor | null },
  updateData: UpdateData,
  dto: UpdateMonitorDto,
) {
  await tx.monitor.update({ where: { id }, data: updateData })

  const host = dto.host ?? existing.dnsMonitor?.host
  const recordType = dto.recordType ?? existing.dnsMonitor?.recordType
  if (!host || !recordType) throw new BadRequestException('Host and recordType required')

  await tx.dnsMonitor.upsert({
    where: { monitorId: id },
    update: { host, recordType },
    create: { monitorId: id, host, recordType },
  })

  const updatedDnsMonitor = await tx.monitor.findUnique({
    where: { id },
    select: { dnsMonitor: true, type: true },
  })
  if (!updatedDnsMonitor) throw new Error('HTTP monitor not found after update')

  return updatedDnsMonitor as Monitor & { dnsMonitor: DnsMonitor }
}

export type Tx = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>
export type UpdateData = Partial<Pick<Monitor, 'name' | 'checkInterval' | 'timeout'>>

export const getDomainByType = ({
  type,
  host,
  port,
  url,
}: {
  type: MonitorType
  host?: string
  port?: number
  url?: string
}) => {
  if (type === MonitorType.HTTP && url) return url
  if (type === MonitorType.ICMP && host) return host
  if (type === MonitorType.TCP && host && port) return `${host}:${port}`
  if (type === MonitorType.DNS && host) return host
  throw new BadRequestException(`invalid domain setup for ${type}`)
}
