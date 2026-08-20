import z from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL required'),
  DIRECT_URL: z.string().optional(),
  REDIS_TLS: z.enum(['true', 'false']).default('true'),
  REDIS_URL: z.string().min(1, 'REDIS_URL required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_USERNAME: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),

  GF_SECURITY_ADMIN_PASSWORD: z.string().optional(),
  METRICS_BEARER_TOKEN: z.string().optional(),

  LOG_LEVEL: z.string().default('info'),
  LOKI_HOST: z.string().default('http://127.0.0.1:3100'),
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
