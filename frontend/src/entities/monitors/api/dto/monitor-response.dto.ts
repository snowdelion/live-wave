import z from 'zod'

import { DnsRecordType, MonitorType } from '../../model/monitors.types'

export const baseCreateMonitorResponseSchema = z.object({ id: z.string() }).strict()

export const createHttpMonitorResponseSchema = baseCreateMonitorResponseSchema
  .extend({
    type: z.literal(MonitorType.HTTP),
    httpMonitor: z.object({
      monitorId: z.string(),
      url: z.url(),
      method: z.enum(['HEAD']),
    }),
  })
  .strict()
export const createTcpMonitorResponseSchema = baseCreateMonitorResponseSchema
  .extend({
    type: z.literal(MonitorType.TCP),
    tcpMonitor: z.object({
      monitorId: z.string(),
      host: z.string(),
      port: z.coerce.number().min(1).max(65535),
    }),
  })
  .strict()
export const createIcmpMonitorResponseSchema = baseCreateMonitorResponseSchema
  .extend({
    type: z.literal(MonitorType.ICMP),
    icmpMonitor: z.object({
      monitorId: z.string(),
      host: z.string(),
    }),
  })
  .strict()
export const createDnsMonitorResponseSchema = baseCreateMonitorResponseSchema
  .extend({
    type: z.literal(MonitorType.DNS),
    dnsMonitor: z.object({
      monitorId: z.string(),
      host: z.string(),
      recordType: z.enum(DnsRecordType),
    }),
  })
  .strict()

export const updateHttpMonitorResponseSchema = z
  .object({
    type: z.literal(MonitorType.HTTP),
    httpMonitor: z.object({
      monitorId: z.string(),
      url: z.url(),
      method: z.enum(['HEAD']),
    }),
  })
  .strict()
export const updateTcpMonitorResponseSchema = z
  .object({
    type: z.literal(MonitorType.TCP),
    tcpMonitor: z.object({
      monitorId: z.string(),
      host: z.string(),
      port: z.coerce.number().min(1).max(65535),
    }),
  })
  .strict()
export const updateIcmpMonitorResponseSchema = z
  .object({
    type: z.literal(MonitorType.ICMP),
    icmpMonitor: z.object({
      monitorId: z.string(),
      host: z.string(),
    }),
  })
  .strict()
export const updateDnsMonitorResponseSchema = z
  .object({
    type: z.literal(MonitorType.DNS),
    dnsMonitor: z.object({
      monitorId: z.string(),
      host: z.string(),
      recordType: z.enum(DnsRecordType),
    }),
  })
  .strict()

export const createMonitorResponseSchema = z.discriminatedUnion('type', [
  createHttpMonitorResponseSchema,
  createTcpMonitorResponseSchema,
  createIcmpMonitorResponseSchema,
  createDnsMonitorResponseSchema,
])
export const updateMonitorResponseSchema = z.discriminatedUnion('type', [
  updateHttpMonitorResponseSchema,
  updateTcpMonitorResponseSchema,
  updateIcmpMonitorResponseSchema,
  updateDnsMonitorResponseSchema,
])

export type CreateMonitorResponse = z.infer<typeof createMonitorResponseSchema>
export type UpdateMonitorResponse = z.infer<typeof updateMonitorResponseSchema>
