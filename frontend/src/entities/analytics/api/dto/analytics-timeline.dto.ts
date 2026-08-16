import z from 'zod'

export const analyticsTimelineItemSchema = z.object({
  date: z.coerce.date(),
  uptime: z.coerce.number().min(0).max(100),
  averageResponseTime: z.coerce.number().min(0).nullable(),
  p95ResponseTime: z.coerce.number().min(0).nullable(),
})

export const analyticsTimelineItemsSchema = z.array(analyticsTimelineItemSchema)

export const analyticsTimelineSchema = z.object({
  items: analyticsTimelineItemsSchema,
  shouldShowP95: z.boolean(),
})

export type AnalyticsTimelineItem = z.infer<typeof analyticsTimelineItemSchema>
export type AnalyticsTimelineItems = z.infer<typeof analyticsTimelineItemsSchema>
export type AnalyticsTimeline = z.infer<typeof analyticsTimelineSchema>
