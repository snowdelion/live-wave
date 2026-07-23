import z from 'zod'

export const linkTelegramBodySchema = z.object({
  chatId: z.string().min(1),
})

export type LinkTelegramBody = z.infer<typeof linkTelegramBodySchema>
