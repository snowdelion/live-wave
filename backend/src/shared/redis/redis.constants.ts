export const REDIS_KEYS = {
  refreshToken: (userId: string) => `live-wave:token:refresh:${userId}`,

  createRateLimit: (ip: string) => `live-wave:rate-limit:create-monitor:${ip}`,
  domainRateLimit: (domain: string) => `live-wave:ratelimit:${domain}`,

  overviewAnalytics: (monitorId: string, days: number) =>
    `live-wave:analytics:overview:${monitorId}:${days}`,
} as const

export const REDIS_CLIENT = 'REDIS_CLIENT'
