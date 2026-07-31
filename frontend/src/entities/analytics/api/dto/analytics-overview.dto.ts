import z from 'zod'

const dailyStatSchema = z.object({
  day: z.string().min(1),
  uptime: z.coerce.number().min(0).max(100),
  averageResponseTime: z.coerce.number().min(0).nullable(),
  p95ResponseTime: z.coerce.number().min(0).nullable(),
  failureCount: z.coerce.number().min(0).int(),
})

export const analyticsOverviewSchema = z.object({
  monitorId: z.string().min(1),
  monitorName: z.string().min(1),
  periodDays: z.coerce.number().min(1).max(30),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  totalChecks: z.coerce.number().min(0),
  uptime: z.coerce.number().min(0).max(100),
  up: z.coerce.number().min(0).int(),
  down: z.coerce.number().min(0).int(),
  averageResponseTime: z.coerce.number().min(0).nullable(),
  p95ResponseTime: z.coerce.number().min(0).nullable(),
  dailyStats: z.array(dailyStatSchema),
})

export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>
