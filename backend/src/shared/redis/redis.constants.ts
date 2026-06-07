export const REDIS_KEYS = {
  session: (clientId: string) => `live-wave:session:${clientId}`,
  ipSession: (ip: string) => `live-wave:ip:session:${ip}`,
  createMonitorIp: (ip: string) => `live-wave:ip:create-monitor:${ip}`,
  telegramToClient: (chatId: number | string) => `live-wave:telegram:chat-to-client:${chatId}`,
  telegramCode: (code: string) => `live-wave:telegram:code:${code}`,
  domainRateLimit: (domain: string) => `live-wave:ratelimit:${domain}`,
} as const

export const REDIS_CLIENT = 'REDIS_CLIENT'
