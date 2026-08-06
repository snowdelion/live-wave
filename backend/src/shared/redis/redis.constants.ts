export const REDIS_KEYS = {
  refreshToken: (userId: string) => `live-wave:token:refresh:${userId}`,

  domainRateLimit: (domain: string) => `live-wave:ratelimit:${domain}`,

  overviewAnalytics: (monitorId: string, days: number) =>
    `live-wave:analytics:overview:${monitorId}:${days}`,

  telegramToken: (token: string) => `live-wave:telegram:link:${token}`,
} as const

export const REDIS_CLIENT = 'REDIS_CLIENT'
