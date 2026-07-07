import { BadRequestException, Logger } from '@nestjs/common'
import {
  type DnsMonitor,
  type HttpMonitor,
  type IcmpMonitor,
  Method,
  type Monitor,
  MonitorType,
  Prisma,
  type PrismaClient,
  RecordType,
  type TcpMonitor,
} from '@prisma/client'
import type { DefaultArgs } from '@prisma/client/runtime/library'

import type { CreateMonitorDto } from './dto/requests/create-monitor.dto'
import type { UpdateMonitorDto } from './dto/requests/update-monitor.dto'

const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
export function getTrendSql(monitorIds: string[]) {
  return Prisma.sql`
    WITH numbered AS (
      SELECT
        "monitorId",
        "responseTime",
        ROW_NUMBER() OVER (PARTITION BY "monitorId" ORDER BY "checkedAt") AS rn,
        COUNT(*) OVER (PARTITION BY "monitorId") AS total
      FROM "Check"
      WHERE "checkedAt" >= ${sevenDaysAgo}
        AND "monitorId" IN (${Prisma.join(monitorIds)})
    ),
    stats AS (
      SELECT
        "monitorId",
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) AS up,
        ROUND(AVG("responseTime")::numeric) AS "avgResponse",
        ROUND(MIN("responseTime")::numeric) AS "minResponse",
        ROUND(MAX("responseTime")::numeric) AS "maxResponse"
      FROM "Check"
      WHERE "checkedAt" >= ${sevenDaysAgo}
        AND "monitorId" IN (${Prisma.join(monitorIds)})
      GROUP BY "monitorId"
    ),
    blocks AS (
      SELECT
        "monitorId",
        CEIL(rn / (total::float / 20)) AS block_num,
        AVG("responseTime") AS avg_response
      FROM numbered
      WHERE "responseTime" IS NOT NULL
      GROUP BY "monitorId", block_num
    ),
    spark AS (
      SELECT
        "monitorId",
        array_agg(ROUND(avg_response::numeric) ORDER BY block_num) AS sparkline
      FROM blocks
      GROUP BY "monitorId"
    )
    SELECT
      s."monitorId",
      s.total,
      s.up,
      s."avgResponse",
      s."minResponse",
      s."maxResponse",
      sp.sparkline
    FROM stats s
    LEFT JOIN spark sp ON s."monitorId" = sp."monitorId"
        `
}

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

const logger = new Logger('MonitorUtils')
export async function handleHttpTransaction(
  tx: Tx,
  id: string,
  existing: Monitor & { httpMonitor: HttpMonitor | null },
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
    include: { httpMonitor: true },
  })
  if (!updatedHttpMonitor) throw new Error('HTTP monitor not found after update')

  logger.debug(
    `HTTP monitor ${updatedHttpMonitor?.id} updated successfully. From ${JSON.stringify(existing)} to ${JSON.stringify(updatedHttpMonitor)}`,
  )
  return updatedHttpMonitor as Monitor & { httpMonitor: HttpMonitor }
}

export async function handleIcmpTransaction(
  tx: Tx,
  id: string,
  existing: Monitor & { icmpMonitor: IcmpMonitor | null },
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
    include: { icmpMonitor: true },
  })
  if (!updatedIcmpMonitor) throw new Error('HTTP monitor not found after update')

  logger.debug(
    `ICMP monitor ${updatedIcmpMonitor?.id} updated successfully. From ${JSON.stringify(existing)} to ${JSON.stringify(updatedIcmpMonitor)}`,
  )
  return updatedIcmpMonitor as Monitor & { icmpMonitor: IcmpMonitor }
}

export async function handleTcpTransaction(
  tx: Tx,
  id: string,
  existing: Monitor & { tcpMonitor: TcpMonitor | null },
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
    include: { tcpMonitor: true },
  })
  if (!updatedTcpMonitor) throw new Error('HTTP monitor not found after update')

  logger.debug(
    `TCP monitor ${updatedTcpMonitor?.id} updated successfully. From ${JSON.stringify(existing)} to ${JSON.stringify(updatedTcpMonitor)}`,
  )
  return updatedTcpMonitor as Monitor & { tcpMonitor: TcpMonitor }
}

export async function handleDnsTransaction(
  tx: Tx,
  id: string,
  existing: Monitor & { dnsMonitor: DnsMonitor | null },
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
    include: { dnsMonitor: true },
  })
  if (!updatedDnsMonitor) throw new Error('HTTP monitor not found after update')

  logger.log(
    `Dns monitor ${updatedDnsMonitor?.id} updated successfully. From ${JSON.stringify(existing)} to ${JSON.stringify(updatedDnsMonitor)}`,
  )
  return updatedDnsMonitor as Monitor & { dnsMonitor: DnsMonitor }
}

export type Tx = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>
export type UpdateData = Partial<Pick<Monitor, 'name' | 'checkInterval' | 'timeout'>>
