import z from 'zod'

export const AuthViaEmailRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export type AuthViaEmailRequest = z.infer<typeof AuthViaEmailRequestSchema>
