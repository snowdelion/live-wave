import z from 'zod'

import { DnsRecordType } from '../../model/monitor.types'

export const updateMonitorRequestSchema = z
  .object({
    name: z.string().min(1).optional(),
    checkInterval: z.number().min(1).max(60).optional(),
    timeout: z.number().min(5000).max(30_000).optional(),
    url: z.url().optional(),
    method: z.enum(['HEAD']).optional(),
    host: z.string().min(1).optional(),
    port: z.coerce.number().min(1).max(65535),
    recordType: z.enum(DnsRecordType),
  })
  .strict()

export type UpdateMonitorRequest = z.infer<typeof updateMonitorRequestSchema>
