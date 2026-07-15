import z from 'zod'

import { MonitorStatus, MonitorType } from '../../model/monitor.types'

const trendConfigSchema = z
  .object({
    avgResponseTime: z.coerce.number().nullable(),
    minResponseTime: z.coerce.number().nullable(),
    maxResponseTime: z.coerce.number().nullable(),
    sparkline: z.array(z.coerce.number()),
    weekUptime: z.number().min(0).max(100).nullable(),
  })
  .strict()

export const userMonitorSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    domain: z.string(),
    type: z.enum(MonitorType),
    lastStatus: z.enum(MonitorStatus).nullable(),
    lastCheckedAt: z.coerce.date(),
    trend: trendConfigSchema,
  })
  .strict()

export const userMonitorsSchema = z.array(userMonitorSchema)

export type UserMonitor = z.infer<typeof userMonitorSchema>
export type UserMonitors = z.infer<typeof userMonitorsSchema>
