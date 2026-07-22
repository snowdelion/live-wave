import type { MonitorType, UserMonitor } from '@/entities/monitor'

export interface MonitorTableProps {
  onEdit: (m: UserMonitor) => void
  search: string
  typeFilter: MonitorType | 'ALL'
  onMonitorChange: () => void
}
