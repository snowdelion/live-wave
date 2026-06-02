export const BULL_NAMES = {
  QUEUE: 'monitor-checks',
  CHECK: 'check',
} as const

export const BULL_KEYS = {
  CHECK: (monitorId: string) => `check-${monitorId}-${Date.now()}`,
  RAW_CHECK: (monitorId: string) => `check-${monitorId}`,
} as const
