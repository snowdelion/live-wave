import { MonitorType } from '@/entities/monitors'

export const RESPONSE_THRESHOLD: Record<MonitorType, { good: number; warn: number }> = {
  [MonitorType.HTTP]: { good: 200, warn: 500 },
  [MonitorType.TCP]: { good: 50, warn: 200 },
  [MonitorType.ICMP]: { good: 30, warn: 100 },
  [MonitorType.DNS]: { good: 50, warn: 150 },
}
