import z from 'zod'

export const analyticsOverviewSchema = z.object({
  totalChecks: z.coerce.number().min(0),
  uptime: z.coerce.number().min(0).max(100),
  up: z.coerce.number().min(0).int(),
  down: z.coerce.number().min(0).int(),
  averageResponseTime: z.coerce.number().min(0).nullable(),
})

export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>
