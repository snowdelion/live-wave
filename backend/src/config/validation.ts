import z from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL required'),
  POSTGRES_USER: z.string().min(1, 'POSTGRES_USER is required'),
  POSTGRES_PASSWORD: z.string().min(1, 'POSTGRES_PASSWORD is required'),
  POSTGRES_DB: z.string().min(1, 'POSTGRES_DB is required'),
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
})

export type EnvironmentVariables = z.infer<typeof envSchema>

export function validate(config: Record<string, unknown>) {
  const { data, success, error } = envSchema.safeParse(config)

  if (!success) {
    const errors = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    throw new Error(`Environment configuration error: ${errors}`)
  }

  return data
}
