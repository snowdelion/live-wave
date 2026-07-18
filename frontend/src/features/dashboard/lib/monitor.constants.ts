import { MonitorType } from '@/entities/monitor'

export const MONITOR_TYPES: MonitorType[] = [
  MonitorType.HTTP,
  MonitorType.TCP,
  MonitorType.ICMP,
  MonitorType.DNS,
]
