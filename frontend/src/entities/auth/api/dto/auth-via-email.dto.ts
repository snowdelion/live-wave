import z from 'zod'

export const AuthViaEmailRequestSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, 'Password should be between 8-16 characters')
    .max(16, 'Password should be between 8-16 characters'),
})

export type AuthViaEmailRequest = z.infer<typeof AuthViaEmailRequestSchema>
