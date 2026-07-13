import z from 'zod'

import { AuthViaEmailRequestSchema } from '@/entities/auth'

export const loginSchema = AuthViaEmailRequestSchema

export const registerSchema = AuthViaEmailRequestSchema.extend({
  confirmPassword: z
    .string()
    .min(8, 'Confirm password should be between 8-16 characters')
    .max(16, 'Confirm password should be between 8-16 characters'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
