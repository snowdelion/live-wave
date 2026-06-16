import type { StatusEnum } from '@prisma/client'

export type StrategyResult = Promise<{
  status: StatusEnum
  error?: string | null
  responseTime: number | null
  checkedAt: Date
}>
