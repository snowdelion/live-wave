import { act } from '@testing-library/react'

import { MonitorType, useDetailedMonitor, type DetailedMonitor } from '@/entities/monitor'
import { renderHookWithClient } from '@/shared/test-utils'

import { useDashboardPage } from './useDashboardPage'

vi.mock('@/entities/monitor', async () => {
  const actual = await vi.importActual('@/entities/monitor')
  return {
    ...actual,
    useDetailedMonitor: vi.fn(),
  }
})

describe('useDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDetailedMonitor).mockReturnValue({ data: undefined } as never)
  })

  describe('initial state', () => {
    it('should default showModal to false', () => {
      const { result } = renderHookWithClient(() => useDashboardPage())

      expect(result.current.showModal).toBe(false)
    })

    it('should default editId to null', () => {
      const { result } = renderHookWithClient(() => useDashboardPage())

      expect(result.current.editId).toBeNull()
    })

    it('should call useDetailedMonitor with an empty string when editId is null', () => {
      renderHookWithClient(() => useDashboardPage())

      expect(useDetailedMonitor).toHaveBeenCalledWith('')
    })
  })

  describe('modal open/close', () => {
    it('should set showModal to true when openModal is called', () => {
      const { result } = renderHookWithClient(() => useDashboardPage())

      act(() => {
        result.current.openModal()
      })

      expect(result.current.showModal).toBe(true)
    })

    it('should set showModal to false when closeModal is called', () => {
      const { result } = renderHookWithClient(() => useDashboardPage())

      act(() => {
        result.current.openModal()
      })
      act(() => {
        result.current.closeModal()
      })

      expect(result.current.showModal).toBe(false)
    })
  })

  describe('editId / detailedMonitor', () => {
    it('should call useDetailedMonitor with the given editId once set', () => {
      const { result, rerender } = renderHookWithClient(() => useDashboardPage())

      act(() => {
        result.current.setEditId('mon_1')
      })
      rerender()

      expect(useDetailedMonitor).toHaveBeenCalledWith('mon_1')
    })

    it('should expose the data returned by useDetailedMonitor as detailedMonitor', () => {
      const monitor = { id: 'mon_1', name: 'Test', type: MonitorType.HTTP } as DetailedMonitor
      vi.mocked(useDetailedMonitor).mockReturnValue({ data: monitor } as never)

      const { result } = renderHookWithClient(() => useDashboardPage())

      expect(result.current.detailedMonitor).toBe(monitor)
    })
  })

  describe('getInitial', () => {
    it('should build HTTP initial values with url and method', () => {
      const { result } = renderHookWithClient(() => useDashboardPage())

      const monitor = {
        id: 'mon_1',
        name: 'My site',
        type: MonitorType.HTTP,
        checkInterval: 10,
        timeout: 5000,
        httpMonitor: { url: 'https://example.com', method: 'GET' },
      } as unknown as DetailedMonitor

      const initial = result.current.getInitial(monitor)

      expect(initial).toEqual({
        id: 'mon_1',
        name: 'My site',
        type: MonitorType.HTTP,
        checkInterval: 10,
        timeout: 5000,
        url: 'https://example.com',
        method: 'GET',
      })
    })

    it('should build TCP initial values with host and port', () => {
      const { result } = renderHookWithClient(() => useDashboardPage())

      const monitor = {
        id: 'mon_2',
        name: 'TCP check',
        type: MonitorType.TCP,
        checkInterval: 5,
        timeout: 3000,
        tcpMonitor: { host: '10.0.0.1', port: 8080 },
      } as unknown as DetailedMonitor

      const initial = result.current.getInitial(monitor)

      expect(initial).toEqual({
        id: 'mon_2',
        name: 'TCP check',
        type: MonitorType.TCP,
        checkInterval: 5,
        timeout: 3000,
        host: '10.0.0.1',
        port: 8080,
      })
    })

    it('should build ICMP initial values with only host', () => {
      const { result } = renderHookWithClient(() => useDashboardPage())

      const monitor = {
        id: 'mon_3',
        name: 'Ping check',
        type: MonitorType.ICMP,
        checkInterval: 15,
        timeout: 2000,
        icmpMonitor: { host: '8.8.8.8' },
      } as unknown as DetailedMonitor

      const initial = result.current.getInitial(monitor)

      expect(initial).toEqual({
        id: 'mon_3',
        name: 'Ping check',
        type: MonitorType.ICMP,
        checkInterval: 15,
        timeout: 2000,
        host: '8.8.8.8',
      })
    })

    it('should build DNS initial values with host and recordType', () => {
      const { result } = renderHookWithClient(() => useDashboardPage())

      const monitor = {
        id: 'mon_4',
        name: 'DNS check',
        type: MonitorType.DNS,
        checkInterval: 20,
        timeout: 4000,
        dnsMonitor: { host: 'example.com', recordType: 'A' },
      } as unknown as DetailedMonitor

      const initial = result.current.getInitial(monitor)

      expect(initial).toEqual({
        id: 'mon_4',
        name: 'DNS check',
        type: MonitorType.DNS,
        checkInterval: 20,
        timeout: 4000,
        host: 'example.com',
        recordType: 'A',
      })
    })

    it('should return only base fields for an unknown monitor type', () => {
      const { result } = renderHookWithClient(() => useDashboardPage())

      const monitor = {
        id: 'mon_5',
        name: 'Unknown',
        type: 'UNKNOWN' as MonitorType,
        checkInterval: 30,
        timeout: 1000,
      } as unknown as DetailedMonitor

      const initial = result.current.getInitial(monitor)

      expect(initial).toEqual({
        id: 'mon_5',
        name: 'Unknown',
        type: 'UNKNOWN',
        checkInterval: 30,
        timeout: 1000,
      })
    })
  })
})
