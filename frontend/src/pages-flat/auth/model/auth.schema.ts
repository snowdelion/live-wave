import z from 'zod'

import { AuthViaEmailRequestSchema } from '@/entities/auth'

export const loginSchema = AuthViaEmailRequestSchema

export const registerSchema = AuthViaEmailRequestSchema.extend({
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
