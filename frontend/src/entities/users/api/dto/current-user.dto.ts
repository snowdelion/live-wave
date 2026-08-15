import z from 'zod'

export const currentUserSchema = z.object({
  email: z.email().nullable(),
  telegramId: z.coerce.number().nullable(),
  username: z.string().min(1).nullable(),
  createdAt: z.coerce.date(),
  isNotificationsEnabled: z.boolean(),
})

export type CurrentUser = z.infer<typeof currentUserSchema>
