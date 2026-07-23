import z from 'zod'

export const currentUserSchema = z.object({
  email: z.email().nullable(),
  telegramId: z.coerce.number().nullable(),
  username: z.string().min(1).nullable(),
  createdAt: z.coerce.date(),
  isNotificationEnabled: z.boolean(),
  monitorsCount: z.coerce.number().min(0),
  checksCount: z.coerce.number().min(0),
})

export type CurrentUser = z.infer<typeof currentUserSchema>
