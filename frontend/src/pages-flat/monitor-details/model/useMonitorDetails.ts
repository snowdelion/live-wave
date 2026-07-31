import { useState } from 'react'

import {
  useDetailedMonitor,
  useDeleteMonitor,
  DnsRecordType,
  MonitorType,
} from '@/entities/monitor'

export function useMonitorDetails(monitorId: string) {
  const [periodDays, setPeriodDays] = useState(7)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: monitor } = useDetailedMonitor(monitorId)
  const { mutate: deleteMonitor } = useDeleteMonitor()

  let host = ''
  if (monitor && 'dnsMonitor' in monitor) host = monitor.dnsMonitor.host
  if (monitor && 'icmpMonitor' in monitor) host = monitor.icmpMonitor.host
  if (monitor && 'tcpMonitor' in monitor) host = monitor.tcpMonitor.host

  const initialMonitor = {
    id: monitor?.id,
    name: monitor?.name || '',
    type: monitor?.type || MonitorType.HTTP,
    checkInterval: monitor?.checkInterval || 10,
    timeout: monitor?.timeout || 5000,
    url: monitor && 'httpMonitor' in monitor ? monitor.httpMonitor.url : undefined,
    host,
    port: monitor && 'tcpMonitor' in monitor ? monitor.tcpMonitor.port : undefined,
    recordType:
      monitor && 'dnsMonitor' in monitor ? monitor.dnsMonitor.recordType : DnsRecordType.A,
    method: monitor && 'httpMonitor' in monitor ? monitor.httpMonitor.method : 'HEAD',
  }

  return {
    setShowEdit,
    setShowDeleteConfirm,
    monitor,
    showDeleteConfirm,
    deleteMonitor,
    showEdit,
    initialMonitor,
    periodDays,
    setPeriodDays,
  }
}
