import { BadRequestException } from '@nestjs/common'
import { Method, MonitorType, RecordType, type StatusEnum } from '@prisma/client'

import {
  monitorRequestData,
  handleDnsTransaction,
  handleHttpTransaction,
  handleIcmpTransaction,
  handleTcpTransaction,
  type Tx,
  type UpdateData,
} from '../monitor.utils'

// helpers
const MONITOR_ID = 'id'

// tests
describe('monitorRequestData', () => {
  const CLIENT_ID = 'client-1'

  it('builds HTTP create data with defaults', () => {
    const result = monitorRequestData(CLIENT_ID, MonitorType.HTTP, {
      type: MonitorType.HTTP,
      name: 'name',
      url: 'https://example.com',
    } as any)

    expect(result).toEqual({
      clientId: CLIENT_ID,
      name: 'name',
      checkInterval: 10,
      timeout: 5000,
      type: MonitorType.HTTP,
      httpMonitor: { create: { url: 'https://example.com', method: Method.HEAD } },
    })
  })

  it('throws BadRequestException for HTTP when url is missing', () => {
    expect(() => monitorRequestData(CLIENT_ID, MonitorType.HTTP, { name: 'name' } as any)).toThrow(
      BadRequestException,
    )
  })

  it('throws BadRequestException for ICMP when host is missing', () => {
    expect(() => monitorRequestData(CLIENT_ID, MonitorType.ICMP, { name: 'name' } as any)).toThrow(
      BadRequestException,
    )
  })

  it('throws BadRequestException for TCP when host is missing', () => {
    expect(() =>
      monitorRequestData(CLIENT_ID, MonitorType.TCP, { name: 'name', port: 8080 } as any),
    ).toThrow(BadRequestException)
  })

  it('throws BadRequestException for TCP when port is missing', () => {
    expect(() =>
      monitorRequestData(CLIENT_ID, MonitorType.TCP, {
        name: 'name',
        host: '127.0.0.1',
      } as any),
    ).toThrow(BadRequestException)
  })

  it('throws BadRequestException for DNS when host is missing', () => {
    expect(() => monitorRequestData(CLIENT_ID, MonitorType.DNS, { name: 'name' } as any)).toThrow(
      BadRequestException,
    )
  })

  it('defaults DNS recordType to A when not provided', () => {
    const result = monitorRequestData(CLIENT_ID, MonitorType.DNS, {
      name: 'name',
      host: 'example.com',
    } as any)

    expect(result).toMatchObject({
      dnsMonitor: { create: { host: 'example.com', recordType: RecordType.A } },
    })
  })

  it('throws BadRequestException for an unknown monitor type', () => {
    expect(() =>
      monitorRequestData(CLIENT_ID, 'UNKNOWN' as MonitorType, { name: 'name' } as any),
    ).toThrow(BadRequestException)
  })
})

describe('transaction handlers', () => {
  const mockTx = {
    monitor: { update: vi.fn(), findUnique: vi.fn() },
    httpMonitor: { upsert: vi.fn() },
    icmpMonitor: { upsert: vi.fn() },
    tcpMonitor: { upsert: vi.fn() },
    dnsMonitor: { upsert: vi.fn() },
  } as unknown as Tx

  const updateData: UpdateData = {}

  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('handleHttpTransaction', () => {
    const existing = {
      id: MONITOR_ID,
      httpMonitor: { monitorId: MONITOR_ID, url: 'https://old.com', method: Method.HEAD },
    } as any

    it('falls back to existing url/method when dto omits them', async () => {
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue({
        ...existing,
        httpMonitor: existing.httpMonitor,
      })

      await handleHttpTransaction(mockTx, MONITOR_ID, existing, updateData, {} as any)

      expect(mockTx.httpMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { url: 'https://old.com', method: Method.HEAD },
        create: { monitorId: MONITOR_ID, url: 'https://old.com', method: Method.HEAD },
      })
    })

    it('uses dto url/method over existing when provided', async () => {
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(existing)

      await handleHttpTransaction(mockTx, MONITOR_ID, existing, updateData, {
        url: 'https://new.com',
        method: Method.HEAD,
      } as any)

      expect(mockTx.httpMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { url: 'https://new.com', method: Method.HEAD },
        create: { monitorId: MONITOR_ID, url: 'https://new.com', method: Method.HEAD },
      })
    })

    it('throws BadRequestException when neither dto nor existing has a url', async () => {
      const noUrlExisting = { id: MONITOR_ID, httpMonitor: null } as any

      await expect(
        handleHttpTransaction(mockTx, MONITOR_ID, noUrlExisting, updateData, {} as any),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws when monitor.findUnique returns null after update', async () => {
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(null)

      await expect(
        handleHttpTransaction(mockTx, MONITOR_ID, existing, updateData, {} as any),
      ).rejects.toThrow('HTTP monitor not found after update')
    })
  })

  describe('handleIcmpTransaction', () => {
    const existing = {
      id: MONITOR_ID,
      icmpMonitor: { monitorId: MONITOR_ID, host: '127.0.0.1' },
    } as any

    it('falls back to existing host when dto omits it', async () => {
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(existing)

      await handleIcmpTransaction(mockTx, MONITOR_ID, existing, updateData, {} as any)

      expect(mockTx.icmpMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { host: '127.0.0.1' },
        create: { monitorId: MONITOR_ID, host: '127.0.0.1' },
      })
    })

    it('uses dto host over existing when provided', async () => {
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(existing)

      await handleIcmpTransaction(mockTx, MONITOR_ID, existing, updateData, {
        host: '10.0.0.1',
      } as any)

      expect(mockTx.icmpMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { host: '10.0.0.1' },
        create: { monitorId: MONITOR_ID, host: '10.0.0.1' },
      })
    })

    it('throws BadRequestException when neither dto nor existing has a host', async () => {
      const noHostExisting = { id: MONITOR_ID, icmpMonitor: null } as any

      await expect(
        handleIcmpTransaction(mockTx, MONITOR_ID, noHostExisting, updateData, {} as any),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws when monitor.findUnique returns null after update', async () => {
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(null)

      await expect(
        handleIcmpTransaction(mockTx, MONITOR_ID, existing, updateData, {} as any),
      ).rejects.toThrow('HTTP monitor not found after update')
    })
  })

  describe('handleTcpTransaction', () => {
    const existing = {
      id: MONITOR_ID,
      tcpMonitor: { monitorId: MONITOR_ID, host: '127.0.0.1', port: 8080 },
    } as any

    it('falls back to existing host/port when dto omits them', async () => {
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(existing)

      await handleTcpTransaction(mockTx, MONITOR_ID, existing, updateData, {} as any)

      expect(mockTx.tcpMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { host: '127.0.0.1', port: 8080 },
        create: { monitorId: MONITOR_ID, host: '127.0.0.1', port: 8080 },
      })
    })

    it('uses dto host/port over existing when provided', async () => {
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(existing)

      await handleTcpTransaction(mockTx, MONITOR_ID, existing, updateData, {
        host: '10.0.0.1',
        port: 9000,
      } as any)

      expect(mockTx.tcpMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { host: '10.0.0.1', port: 9000 },
        create: { monitorId: MONITOR_ID, host: '10.0.0.1', port: 9000 },
      })
    })

    it('throws BadRequestException when host is missing', async () => {
      const noHostExisting = {
        id: MONITOR_ID,
        tcpMonitor: { monitorId: MONITOR_ID, host: null, port: 8080 },
      } as any

      await expect(
        handleTcpTransaction(mockTx, MONITOR_ID, noHostExisting, updateData, {} as any),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when port is missing', async () => {
      const noPortExisting = {
        id: MONITOR_ID,
        tcpMonitor: { monitorId: MONITOR_ID, host: '127.0.0.1', port: null },
      } as any

      await expect(
        handleTcpTransaction(mockTx, MONITOR_ID, noPortExisting, updateData, {} as any),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws when monitor.findUnique returns null after update', async () => {
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(null)

      await expect(
        handleTcpTransaction(mockTx, MONITOR_ID, existing, updateData, {} as any),
      ).rejects.toThrow('HTTP monitor not found after update')
    })
  })

  describe('handleDnsTransaction', () => {
    const existing = {
      id: MONITOR_ID,
      dnsMonitor: { monitorId: MONITOR_ID, host: 'example.com', recordType: RecordType.A },
    } as any

    it('falls back to existing host/recordType when dto omits them', async () => {
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(existing)

      await handleDnsTransaction(mockTx, MONITOR_ID, existing, updateData, {} as any)

      expect(mockTx.dnsMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { host: 'example.com', recordType: RecordType.A },
        create: { monitorId: MONITOR_ID, host: 'example.com', recordType: RecordType.A },
      })
    })

    it('uses dto host/recordType over existing when provided', async () => {
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(existing)

      await handleDnsTransaction(mockTx, MONITOR_ID, existing, updateData, {
        host: 'new.example.com',
        recordType: RecordType.AAAA,
      } as any)

      expect(mockTx.dnsMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { host: 'new.example.com', recordType: RecordType.AAAA },
        create: { monitorId: MONITOR_ID, host: 'new.example.com', recordType: RecordType.AAAA },
      })
    })

    it('throws BadRequestException when host is missing', async () => {
      const noHostExisting = {
        id: MONITOR_ID,
        dnsMonitor: { monitorId: MONITOR_ID, host: null, recordType: RecordType.A },
      } as any

      await expect(
        handleDnsTransaction(mockTx, MONITOR_ID, noHostExisting, updateData, {} as any),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when recordType is missing', async () => {
      const noRecordTypeExisting = {
        id: MONITOR_ID,
        dnsMonitor: { monitorId: MONITOR_ID, host: 'example.com', recordType: null },
      } as any

      await expect(
        handleDnsTransaction(mockTx, MONITOR_ID, noRecordTypeExisting, updateData, {} as any),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws when monitor.findUnique returns null after update', async () => {
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(null)

      await expect(
        handleDnsTransaction(mockTx, MONITOR_ID, existing, updateData, {} as any),
      ).rejects.toThrow('HTTP monitor not found after update')
    })
  })
})
