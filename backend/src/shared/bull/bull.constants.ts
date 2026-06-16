import type { StatusEnum } from '@prisma/client'

export const BULL_NAMES = {
  QUEUE: 'monitor-checks',
  CHECK: 'check',
  NOTIFICATION: 'notifications',
  SEND_NOTIFICATION: 'send-notification',
} as const

export const BULL_KEYS = {
  CHECK: (monitorId: string) => `check-${monitorId}-${Date.now()}`,
  RAW_CHECK: (monitorId: string) => `check-${monitorId}`,
  SEND_NOTIFICATION: (chatId: string, monitorid: string, statusType: StatusEnum) =>
    `notification-${chatId}-${monitorid}-${statusType}`,
} as const
