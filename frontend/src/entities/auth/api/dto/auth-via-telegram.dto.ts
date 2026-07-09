import z from 'zod'

export const AuthViaTelegramRequestSchema = z.object({
  id: z.coerce.number().min(1),
  first_name: z.string().min(1),
  auth_date: z.coerce.number().min(1),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.url().optional(),
  hash: z.string(),
})

export type AuthViaTelegramRequest = z.infer<typeof AuthViaTelegramRequestSchema>
