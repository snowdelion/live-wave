import type { MonitorType, UserMonitor } from '@/entities/monitors'

export interface MonitorTableProps {
  onEdit: (m: UserMonitor) => void
  search: string
  typeFilter: MonitorType | 'ALL'
  onMonitorChange: () => void
}
