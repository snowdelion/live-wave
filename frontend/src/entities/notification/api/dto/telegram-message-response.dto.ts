import z from 'zod'

export const telegramMessageResponseSchema = z.object({
  message: z.string().min(1),
})

export type TelegramMessageResponse = z.infer<typeof telegramMessageResponseSchema>
