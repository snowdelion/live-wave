import z from 'zod'

import { DnsRecordType, MonitorStatus, MonitorType } from '../../model/monitors.types'

const baseDetailedMonitorSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.enum(MonitorType),
    checkInterval: z.number().min(5).max(60),
    timeout: z.number().min(5000).max(30_000),
    lastStatus: z.enum(MonitorStatus).nullable(),
    lastCheckedAt: z.coerce.date().nullable(),
    domain: z.string().min(1),
  })
  .strict()

export const detailedHttpMonitorSchema = baseDetailedMonitorSchema
  .extend({
    type: z.literal(MonitorType.HTTP),
    httpMonitor: z.object({
      monitorId: z.string(),
      url: z.url(),
      method: z.enum(['HEAD']),
    }),
  })
  .strict()
export const detailedTcpMonitorSchema = baseDetailedMonitorSchema
  .extend({
    type: z.literal(MonitorType.TCP),
    tcpMonitor: z.object({
      monitorId: z.string(),
      host: z.string(),
      port: z.coerce.number().min(1).max(65535),
    }),
  })
  .strict()
export const detailedIcmpMonitorSchema = baseDetailedMonitorSchema
  .extend({
    type: z.literal(MonitorType.ICMP),
    icmpMonitor: z.object({
      monitorId: z.string(),
      host: z.string(),
    }),
  })
  .strict()
export const detailedDnsMonitorSchema = baseDetailedMonitorSchema
  .extend({
    type: z.literal(MonitorType.DNS),
    dnsMonitor: z.object({
      monitorId: z.string(),
      host: z.string(),
      recordType: z.enum(DnsRecordType),
    }),
  })
  .strict()

export type DetailedHttpMonitor = z.infer<typeof detailedHttpMonitorSchema>
export type DetailedTcpMonitor = z.infer<typeof detailedTcpMonitorSchema>
export type DetailedIcmpMonitor = z.infer<typeof detailedIcmpMonitorSchema>
export type DetailedDnsMonitor = z.infer<typeof detailedDnsMonitorSchema>

export const detailedMonitorSchema = z.discriminatedUnion('type', [
  detailedHttpMonitorSchema,
  detailedTcpMonitorSchema,
  detailedIcmpMonitorSchema,
  detailedDnsMonitorSchema,
])

export type DetailedMonitor = z.infer<typeof detailedMonitorSchema>
