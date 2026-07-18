import { useState } from 'react'

import { MonitorType, useDetailedMonitor, type DetailedMonitor } from '@/entities/monitor'

export function useDashboardPage() {
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const { data: detailedMonitor } = useDetailedMonitor(editId ?? '')

  const getInitial = (monitor: DetailedMonitor) => {
    const base = {
      id: monitor.id,
      name: monitor.name,
      type: monitor.type,
      checkInterval: monitor.checkInterval,
      timeout: monitor.timeout,
    }

    switch (monitor.type) {
      case MonitorType.HTTP:
        return {
          ...base,
          url: monitor.httpMonitor.url,
          method: monitor.httpMonitor.method,
        }
      case MonitorType.TCP:
        return {
          ...base,
          host: monitor.tcpMonitor.host,
          port: monitor.tcpMonitor.port,
        }
      case MonitorType.ICMP:
        return {
          ...base,
          host: monitor.icmpMonitor.host,
        }
      case MonitorType.DNS:
        return {
          ...base,
          host: monitor.dnsMonitor.host,
          recordType: monitor.dnsMonitor.recordType,
        }
      default:
        return base
    }
  }

  return {
    getInitial,
    showModal,
    openModal: () => setShowModal(true),
    closeModal: () => setShowModal(false),
    setEditId,
    detailedMonitor,
    editId,
  }
}
