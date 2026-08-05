import z from 'zod'

export const analyticsTimelineItemSchema = z.object({
  date: z.coerce.date(),
  uptime: z.coerce.number().min(0).max(100),
  averageResponseTime: z.coerce.number().min(0).nullable(),
  p95ResponseTime: z.coerce.number().min(0).nullable(),
})

export const analyticsTimelineSchema = z.array(analyticsTimelineItemSchema)

export type AnalyticsTimelineItem = z.infer<typeof analyticsTimelineItemSchema>
export type AnalyticsTimeline = z.infer<typeof analyticsTimelineSchema>
