import { renderHook, act } from '@testing-library/react'

import {
  useDetailedMonitor,
  useDeleteMonitor,
  MonitorType,
  DnsRecordType,
} from '@/entities/monitors'

import { useMonitorDetails } from './useMonitorDetails'

vi.mock('@/entities/monitors', async () => {
  const actual = await vi.importActual('@/entities/monitors')
  return { ...actual, useDetailedMonitor: vi.fn(), useDeleteMonitor: vi.fn() }
})

describe('useMonitorDetails', () => {
  const monitorId = 'mon-123'
  const mockDeleteMonitor = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useDeleteMonitor).mockReturnValue({
      mutate: mockDeleteMonitor,
    } as any)
  })

  describe('initial state', () => {
    it('returns default values when monitor is undefined (loading state)', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({ data: undefined } as any)

      const { result } = renderHook(() => useMonitorDetails(monitorId))

      expect(result.current.periodDays).toBe(7)
      expect(result.current.showEdit).toBe(false)
      expect(result.current.showDeleteConfirm).toBe(false)
      expect(result.current.selectedIncident).toBeNull()

      expect(result.current.initialMonitor).toEqual({
        id: undefined,
        name: '',
        type: MonitorType.HTTP,
        checkInterval: 10,
        timeout: 5000,
        url: undefined,
        host: '',
        port: undefined,
        recordType: DnsRecordType.A,
        method: 'HEAD',
      })
    })
  })

  describe('monitor data mapping', () => {
    it('maps HTTP monitor data correctly', () => {
      const mockMonitor = {
        id: 'mon-1',
        name: 'API',
        type: MonitorType.HTTP,
        checkInterval: 30,
        timeout: 10000,
        httpMonitor: { url: 'https://api.com', method: 'GET' },
      }
      vi.mocked(useDetailedMonitor).mockReturnValue({ data: mockMonitor } as any)

      const { result } = renderHook(() => useMonitorDetails(monitorId))

      expect(result.current.initialMonitor).toMatchObject({
        id: 'mon-1',
        name: 'API',
        type: MonitorType.HTTP,
        checkInterval: 30,
        timeout: 10000,
        url: 'https://api.com',
        method: 'GET',
        host: '',
      })
    })

    it('extracts host and port from TCP monitor', () => {
      const mockMonitor = {
        id: 'mon-2',
        name: 'DB',
        type: MonitorType.TCP,
        checkInterval: 60,
        timeout: 5000,
        tcpMonitor: { host: 'db.example.com', port: 5432 },
      }
      vi.mocked(useDetailedMonitor).mockReturnValue({ data: mockMonitor } as any)

      const { result } = renderHook(() => useMonitorDetails(monitorId))

      expect(result.current.initialMonitor).toMatchObject({
        host: 'db.example.com',
        port: 5432,
        url: undefined,
      })
    })

    it('extracts host from ICMP monitor', () => {
      const mockMonitor = {
        id: 'mon-3',
        name: 'Server',
        type: MonitorType.ICMP,
        checkInterval: 60,
        timeout: 5000,
        icmpMonitor: { host: '192.168.1.1' },
      }
      vi.mocked(useDetailedMonitor).mockReturnValue({ data: mockMonitor } as any)

      const { result } = renderHook(() => useMonitorDetails(monitorId))

      expect(result.current.initialMonitor.host).toBe('192.168.1.1')
    })

    it('extracts host and recordType from DNS monitor', () => {
      const mockMonitor = {
        id: 'mon-4',
        name: 'DNS',
        type: MonitorType.DNS,
        checkInterval: 60,
        timeout: 5000,
        dnsMonitor: { host: 'example.com', recordType: DnsRecordType.AAAA },
      }
      vi.mocked(useDetailedMonitor).mockReturnValue({ data: mockMonitor } as any)

      const { result } = renderHook(() => useMonitorDetails(monitorId))

      expect(result.current.initialMonitor).toMatchObject({
        host: 'example.com',
        recordType: DnsRecordType.AAAA,
      })
    })
  })

  describe('state setters', () => {
    beforeEach(() => {
      vi.mocked(useDetailedMonitor).mockReturnValue({ data: undefined } as any)
    })

    it('updates periodDays via setPeriodDays', () => {
      const { result } = renderHook(() => useMonitorDetails(monitorId))

      act(() => {
        result.current.setPeriodDays(30)
      })

      expect(result.current.periodDays).toBe(30)
    })

    it('updates showEdit via setShowEdit', () => {
      const { result } = renderHook(() => useMonitorDetails(monitorId))

      act(() => {
        result.current.setShowEdit(true)
      })

      expect(result.current.showEdit).toBe(true)
    })

    it('updates showDeleteConfirm via setShowDeleteConfirm', () => {
      const { result } = renderHook(() => useMonitorDetails(monitorId))

      act(() => {
        result.current.setShowDeleteConfirm(true)
      })

      expect(result.current.showDeleteConfirm).toBe(true)
    })

    it('updates selectedIncident via setSelectedIncident', () => {
      const { result } = renderHook(() => useMonitorDetails(monitorId))
      const mockIncident = { id: 'inc-1' } as any

      act(() => {
        result.current.setSelectedIncident(mockIncident)
      })

      expect(result.current.selectedIncident).toEqual(mockIncident)
    })
  })

  describe('delete mutation', () => {
    it('exposes deleteMonitor function', () => {
      vi.mocked(useDetailedMonitor).mockReturnValue({ data: undefined } as any)

      const { result } = renderHook(() => useMonitorDetails(monitorId))

      act(() => {
        result.current.deleteMonitor('id')
      })

      expect(mockDeleteMonitor).toHaveBeenCalledTimes(1)
    })
  })
})
