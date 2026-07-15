import z from 'zod'

import { DnsRecordType, MonitorStatus, MonitorType } from '../../model/monitor.types'

const baseCheckSchema = z
  .object({
    id: z.string(),
    status: z.enum(MonitorStatus),
    statusCode: z.number().nullable(),
    responseTime: z.number().min(0).nullable(),
    error: z.string().nullable(),
    monitorId: z.string(),
    checkedAt: z.coerce.date(),
  })
  .strict()

const baseDetailedMonitorSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.enum(MonitorType),
    checkInterval: z.number().min(1).max(60),
    timeout: z.number().min(5000).max(30_000),
    lastStatus: z.enum(MonitorStatus).nullable(),
    userId: z.string(),

    lastCheckedAt: z.coerce.date(),
    nextCheckAt: z.coerce.date(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict()

const httpDetailsSchema = z.object({
  url: z.url(),
  method: z.enum(['HEAD']),
})
const tcpDetailsSchema = z.object({
  host: z.string(),
  port: z.coerce.number().min(1).max(65535),
})
const icmpDetailsSchema = z.object({
  host: z.string(),
})
const dnsDetailsSchema = z.object({
  host: z.string(),
  recordType: z.enum(DnsRecordType),
})

export const detailedHttpMonitorSchema = baseDetailedMonitorSchema
  .extend({
    type: z.literal(MonitorType.HTTP),
    httpMonitor: z.object({
      monitorId: z.string(),
      url: z.url(),
      method: z.enum(['HEAD']),
    }),
    checks: z.array(baseCheckSchema.extend({ details: httpDetailsSchema })),
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
    checks: z.array(baseCheckSchema.extend({ details: tcpDetailsSchema })),
  })
  .strict()
export const detailedIcmpMonitorSchema = baseDetailedMonitorSchema
  .extend({
    type: z.literal(MonitorType.ICMP),
    icmpMonitor: z.object({
      monitorId: z.string(),
      host: z.string(),
    }),
    checks: z.array(baseCheckSchema.extend({ details: icmpDetailsSchema })),
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
    checks: z.array(baseCheckSchema.extend({ details: dnsDetailsSchema })),
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
