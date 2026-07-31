import z from 'zod'

export const analyticsIncidentSchema = z.object({
  id: z.coerce.number().int(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().nullable(),
  durationMs: z.coerce.number().min(0),
  cause: z.string().nullable(),
  status: z.enum(['Active', 'Resolved']).default('Active'),
  formattedDuration: z.string(),
})

export const analyticsIncidentsSchema = z.object({
  incidents: z.array(analyticsIncidentSchema),
  total: z.coerce.number().min(0),
})

export type AnalyticsIncident = z.infer<typeof analyticsIncidentSchema>
export type AnalyticsIncidents = z.infer<typeof analyticsIncidentsSchema>
