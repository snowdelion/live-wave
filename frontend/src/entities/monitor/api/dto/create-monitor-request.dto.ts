import z from 'zod'

import { DnsRecordType, MonitorType } from '../../model/monitor.types'

export const baseCreateMonitorRequestSchema = z
  .object({
    name: z.string().min(1),
    checkInterval: z.number().min(1).max(60).default(10),
    timeout: z.number().min(5000).max(30_000).default(5000),
  })
  .strict()

const createHttpMonitorRequestSchema = baseCreateMonitorRequestSchema
  .extend({
    type: z.literal(MonitorType.HTTP),
    url: z.url(),
    method: z.enum(['HEAD']).default('HEAD'),
  })
  .strict()
const createTcpMonitorRequestSchema = baseCreateMonitorRequestSchema
  .extend({
    type: z.literal(MonitorType.TCP),
    host: z.string().min(1),
    port: z.coerce.number().min(1).max(65535),
  })
  .strict()
const createIcmpMonitorRequestSchema = baseCreateMonitorRequestSchema
  .extend({
    type: z.literal(MonitorType.ICMP),
    host: z.string().min(1),
  })
  .strict()
const createDnsMonitorRequestSchema = baseCreateMonitorRequestSchema
  .extend({
    type: z.literal(MonitorType.DNS),
    host: z.string().min(1),
    recordType: z.enum(DnsRecordType).default(DnsRecordType.A),
  })
  .strict()

export const createMonitorRequestSchema = z.discriminatedUnion('type', [
  createHttpMonitorRequestSchema,
  createTcpMonitorRequestSchema,
  createIcmpMonitorRequestSchema,
  createDnsMonitorRequestSchema,
])

export type CreateMonitorRequest = z.infer<typeof createMonitorRequestSchema>
