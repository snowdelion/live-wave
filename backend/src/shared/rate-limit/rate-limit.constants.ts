export const RATE_LIMIT_RULES = {
  CREATE_MONITOR: [
    { key: '10s', limit: 5, windowSeconds: 10 },
    { key: '1m', limit: 20, windowSeconds: 60 },
    { key: '6h', limit: 50, windowSeconds: 6 * 60 * 60 },
  ],
} as const
