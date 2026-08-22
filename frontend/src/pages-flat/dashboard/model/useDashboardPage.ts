import Cookies from 'js-cookie'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  MonitorType,
  useDetailedMonitor,
  useMonitors,
  type DetailedMonitor,
} from '@/entities/monitors'
import { useAuthStore } from '@/shared/api'

export function useDashboardPage() {
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<MonitorType | 'ALL'>('ALL')

  const { data: detailedMonitor } = useDetailedMonitor(editId ?? '')
  const { isPending: isMonitorsPending } = useMonitors()

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

  const setAccessToken = useAuthStore(s => s.setAccessToken)
  const hasInitializedAuth = useRef(false)
  const getAccessTokenCookie = useCallback(() => {
    const match = document.cookie.match(/(?:^|; )accessToken=([^;]*)/)
    if (!match || !match[1]) return null
    return decodeURIComponent(match[1])
  }, [])

  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (token) {
      setAccessToken(token)
      Cookies.remove('accessToken', { path: '/' })
      hasInitializedAuth.current = true
    }
  }, [setAccessToken, getAccessTokenCookie])

  return {
    getInitial,
    showModal,
    openModal: () => setShowModal(true),
    closeModal: () => setShowModal(false),
    setEditId,
    detailedMonitor,
    editId,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    isMonitorsPending,
  }
}
