import z from 'zod'

import { DnsRecordType, MonitorStatus, MonitorType } from '../../model/monitor.types'

export const baseMonitorResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    checkInterval: z.number().min(1).max(60),
    timeout: z.number().min(5000).max(30_000),
    lastStatus: z.enum(MonitorStatus).nullable(),
    userId: z.string(),

    lastCheckedAt: z.coerce.date().nullable(),
    nextCheckAt: z.coerce.date(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict()

export const httpMonitorResponseSchema = baseMonitorResponseSchema
  .extend({
    type: z.literal(MonitorType.HTTP),
    httpMonitor: z.object({
      monitorId: z.string(),
      url: z.url(),
      method: z.enum(['HEAD']),
    }),
  })
  .strict()
export const tcpMonitorResponseSchema = baseMonitorResponseSchema
  .extend({
    type: z.literal(MonitorType.TCP),
    tcpMonitor: z.object({
      monitorId: z.string(),
      host: z.string(),
      port: z.coerce.number().min(1).max(65535),
    }),
  })
  .strict()
export const icmpMonitorResponseSchema = baseMonitorResponseSchema
  .extend({
    type: z.literal(MonitorType.ICMP),
    icmpMonitor: z.object({
      monitorId: z.string(),
      host: z.string(),
    }),
  })
  .strict()
export const dnsMonitorResponseSchema = baseMonitorResponseSchema
  .extend({
    type: z.literal(MonitorType.DNS),
    dnsMonitor: z.object({
      monitorId: z.string(),
      host: z.string(),
      recordType: z.enum(DnsRecordType),
    }),
  })
  .strict()

export const monitorResponseSchema = z.discriminatedUnion('type', [
  httpMonitorResponseSchema,
  tcpMonitorResponseSchema,
  icmpMonitorResponseSchema,
  dnsMonitorResponseSchema,
])

export type MonitorResponse = z.infer<typeof monitorResponseSchema>
