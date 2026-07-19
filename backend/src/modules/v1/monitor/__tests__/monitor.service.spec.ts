import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Method, type Monitor, MonitorType, RecordType, type PrismaClient } from '@prisma/client'

import type { PrismaService } from '@/backend/shared/prisma/prisma.service'

import { MonitorService } from '../monitor.service'

// --- mocks ---
const mockTx = {
  monitor: {
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  httpMonitor: { upsert: vi.fn() },
  icmpMonitor: { upsert: vi.fn() },
  tcpMonitor: { upsert: vi.fn() },
  dnsMonitor: { upsert: vi.fn() },
} as unknown as PrismaClient

const USER_ID = 'user-abc'
const OTHER_USER_ID = 'user-xyz'
const MONITOR_ID = 'id'

const mockPrisma = {
  monitor: {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $queryRaw: vi.fn().mockResolvedValue([
    {
      monitorId: MONITOR_ID,
      total: 10,
      up: 10,
      avgResponse: 30,
      minResponse: 10,
      maxResponse: 50,
      sparkline: [30, 40, 50],
    },
  ]),
  $transaction: vi.fn(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
} as unknown as PrismaService

const mockMonitorCheckService = {
  scheduleCheck: vi.fn(),
  clearScheduledJobs: vi.fn(),
}

const makeService = () => new MonitorService(mockPrisma, mockMonitorCheckService as any)

// --- helpers ---
const baseMonitor = {
  id: MONITOR_ID,
  userId: USER_ID,
  name: 'name',
  type: MonitorType.HTTP,
  checkInterval: 10,
  timeout: 5000,
  lastStatus: null,
  lastCheckedAt: null,
  nextCheckAt: null,
  checks: [],
  createdAt: expect.any(Date),
  updatedAt: expect.any(Date),
}

const httpMonitorRelation = {
  monitorId: MONITOR_ID,
  url: 'https://example.com',
  method: Method.HEAD,
}

const httpMonitorWithRelation = {
  ...baseMonitor,
  weekUptime: null,
  trend: {
    avgResponseTime: null,
    minResponseTime: null,
    maxResponseTime: null,
    sparkline: [],
  },
  httpMonitor: httpMonitorRelation,
}

const existingHttpMonitor = {
  ...baseMonitor,
  httpMonitor: httpMonitorRelation,
  icmpMonitor: null,
  tcpMonitor: null,
  dnsMonitor: null,
}

const icmpMonitorRelation = { monitorId: MONITOR_ID, host: '127.0.0.1' }

const existingIcmpMonitor = {
  ...baseMonitor,
  type: MonitorType.ICMP,
  httpMonitor: null,
  icmpMonitor: icmpMonitorRelation,
  tcpMonitor: null,
  dnsMonitor: null,
}

const tcpMonitorRelation = { monitorId: MONITOR_ID, host: '127.0.0.1', port: 8080 }

const existingTcpMonitor = {
  ...baseMonitor,
  type: MonitorType.TCP,
  httpMonitor: null,
  icmpMonitor: null,
  tcpMonitor: tcpMonitorRelation,
  dnsMonitor: null,
}

const dnsMonitorRelation = {
  monitorId: MONITOR_ID,
  host: 'example.com',
  recordType: RecordType.A,
}

const existingDnsMonitor = {
  ...baseMonitor,
  type: MonitorType.DNS,
  httpMonitor: null,
  icmpMonitor: null,
  tcpMonitor: null,
  dnsMonitor: dnsMonitorRelation,
}

const createHttpDto = {
  type: MonitorType.HTTP,
  name: 'name',
  url: 'https://example.com',
} as const

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(mockPrisma.monitor.count).mockResolvedValue(0)
  vi.mocked(mockPrisma.$transaction).mockImplementation(
    async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
  )
})

// --- POST /api/v1/monitor ---
describe('create', () => {
  describe('HTTP', () => {
    it('creates a monitor with defaults', async () => {
      vi.mocked(mockPrisma.monitor.create).mockResolvedValue(httpMonitorWithRelation as any)

      const service = makeService()
      const result = await service.create(USER_ID, createHttpDto)

      expect(mockPrisma.monitor.create).toHaveBeenCalledWith({
        data: {
          userId: USER_ID,
          name: 'name',
          checkInterval: 10,
          timeout: 5000,
          type: MonitorType.HTTP,
          httpMonitor: {
            create: {
              url: 'https://example.com',
              method: Method.HEAD,
            },
          },
        },
        include: expect.objectContaining({ httpMonitor: true }),
      })
      expect(result).toEqual(httpMonitorWithRelation)
    })

    it('passes explicit method / interval / timeout through', async () => {
      vi.mocked(mockPrisma.monitor.create).mockResolvedValue(httpMonitorWithRelation as any)

      const service = makeService()
      await service.create(USER_ID, {
        ...createHttpDto,
        method: Method.HEAD,
        checkInterval: 30,
        timeout: 3000,
      })

      expect(mockPrisma.monitor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          checkInterval: 30,
          timeout: 3000,
          httpMonitor: {
            create: { url: 'https://example.com', method: Method.HEAD },
          },
        }),
        include: expect.objectContaining({ httpMonitor: true }),
      })
    })

    it('schedules a check after creation', async () => {
      vi.mocked(mockPrisma.monitor.create).mockResolvedValue(httpMonitorWithRelation as any)

      const service = makeService()
      await service.create(USER_ID, createHttpDto)

      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
        checkInterval: baseMonitor.checkInterval,
        immediate: true,
        monitorId: MONITOR_ID,
      })
    })
  })

  describe('ICMP', () => {
    it('creates an ICMP monitor', async () => {
      const icmpMonitor = {
        ...baseMonitor,
        type: MonitorType.ICMP,
        icmpMonitor: { monitorId: MONITOR_ID, host: '127.0.0.1' },
      }
      vi.mocked(mockPrisma.monitor.create).mockResolvedValue(icmpMonitor as any)

      const service = makeService()
      await service.create(USER_ID, {
        type: MonitorType.ICMP,
        name: 'name',
        host: '127.0.0.1',
      })

      expect(mockPrisma.monitor.create).toHaveBeenCalledWith({
        data: {
          userId: USER_ID,
          name: 'name',
          checkInterval: 10,
          timeout: 5000,
          type: MonitorType.ICMP,
          icmpMonitor: { create: { host: '127.0.0.1' } },
        },
        include: expect.objectContaining({ icmpMonitor: true }),
      })
      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
        monitorId: MONITOR_ID,
        checkInterval: 10,
        immediate: true,
      })
    })
  })

  describe('TCP', () => {
    it('creates a TCP monitor', async () => {
      const tcpMonitor = {
        ...baseMonitor,
        type: MonitorType.TCP,
        tcpMonitor: { monitorId: MONITOR_ID, host: '127.0.0.1', port: 8080 },
      }
      vi.mocked(mockPrisma.monitor.create).mockResolvedValue(tcpMonitor as any)

      const service = makeService()
      await service.create(USER_ID, {
        type: MonitorType.TCP,
        name: 'name',
        host: '127.0.0.1',
        port: 8080,
      })

      expect(mockPrisma.monitor.create).toHaveBeenCalledWith({
        data: {
          userId: USER_ID,
          name: 'name',
          checkInterval: 10,
          timeout: 5000,
          type: MonitorType.TCP,
          tcpMonitor: { create: { host: '127.0.0.1', port: 8080 } },
        },
        include: expect.objectContaining({ tcpMonitor: true }),
      })
      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
        monitorId: MONITOR_ID,
        checkInterval: 10,
        immediate: true,
      })
    })
  })

  describe('DNS', () => {
    it('creates a DNS monitor with defaults', async () => {
      const dnsMonitor = {
        ...baseMonitor,
        type: MonitorType.DNS,
        dnsMonitor: { monitorId: MONITOR_ID, host: 'example.com', recordType: RecordType.A },
      }
      vi.mocked(mockPrisma.monitor.create).mockResolvedValue(dnsMonitor as any)

      const service = makeService()
      await service.create(USER_ID, {
        type: MonitorType.DNS,
        name: 'dns monitor',
        host: 'example.com',
      })

      expect(mockPrisma.monitor.create).toHaveBeenCalledWith({
        data: {
          userId: USER_ID,
          name: 'dns monitor',
          checkInterval: 10,
          timeout: 5000,
          type: MonitorType.DNS,
          dnsMonitor: { create: { host: 'example.com', recordType: RecordType.A } },
        },
        include: expect.objectContaining({ dnsMonitor: true }),
      })
      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
        monitorId: MONITOR_ID,
        checkInterval: 10,
        immediate: true,
      })
    })

    it('passes explicit recordType / interval / timeout through', async () => {
      const dnsMonitor = {
        ...baseMonitor,
        type: MonitorType.DNS,
        checkInterval: 60,
        timeout: 8000,
        dnsMonitor: { monitorId: MONITOR_ID, host: 'example.com', recordType: RecordType.AAAA },
      }
      vi.mocked(mockPrisma.monitor.create).mockResolvedValue(dnsMonitor as any)

      const service = makeService()
      await service.create(USER_ID, {
        type: MonitorType.DNS,
        name: 'dns monitor',
        host: 'example.com',
        recordType: RecordType.AAAA,
        checkInterval: 60,
        timeout: 8000,
      })

      expect(mockPrisma.monitor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          checkInterval: 60,
          timeout: 8000,
          dnsMonitor: { create: { host: 'example.com', recordType: RecordType.AAAA } },
        }),
        include: expect.objectContaining({ dnsMonitor: true }),
      })
      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
        monitorId: MONITOR_ID,
        checkInterval: 60,
        immediate: true,
      })
    })
  })

  it('throws BadRequestException for unknown monitor type', async () => {
    const service = makeService()
    await expect(service.create(USER_ID, { type: 'UNKNOWN' } as any)).rejects.toThrow(
      BadRequestException,
    )
    expect(mockPrisma.monitor.create).not.toHaveBeenCalled()
  })

  it('throws ForbiddenException when the user already has 5 monitors', async () => {
    vi.mocked(mockPrisma.monitor.count).mockResolvedValue(5)

    const service = makeService()
    await expect(service.create(USER_ID, createHttpDto)).rejects.toThrow(ForbiddenException)

    expect(mockPrisma.monitor.create).not.toHaveBeenCalled()
  })
})

// --- GET /api/v1/monitor ---
describe('findAllByUserId', () => {
  it('returns monitors ordered by createdAt desc', async () => {
    const monitorData = {
      id: MONITOR_ID,
      name: 'test',
      type: 'HTTP',
      lastStatus: 'up',
      lastCheckedAt: new Date(),
      httpMonitor: { url: 'https://example.com' },
    }
    vi.mocked(mockPrisma.monitor.findMany).mockResolvedValue([monitorData as unknown as Monitor])
    vi.mocked(mockPrisma.$queryRaw).mockResolvedValue([
      {
        monitorId: MONITOR_ID,
        total: 10,
        up: 10,
        avgResponse: 30,
        minResponse: 10,
        maxResponse: 50,
        sparkline: [30, 40, 50],
      },
    ])

    const service = makeService()
    const result = await service.findAllByUserId(USER_ID)

    expect(mockPrisma.monitor.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      select: {
        id: true,
        name: true,
        lastStatus: true,
        type: true,
        lastCheckedAt: true,
        httpMonitor: { select: { url: true } },
        icmpMonitor: { select: { host: true } },
        tcpMonitor: { select: { host: true, port: true } },
        dnsMonitor: { select: { host: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    expect(mockPrisma.$queryRaw).toHaveBeenCalled()

    expect(result.monitors[0]).toMatchObject({
      id: MONITOR_ID,
      name: 'test',
      trend: {
        avgResponseTime: 30,
        minResponseTime: 10,
        maxResponseTime: 50,
        sparkline: [30, 40, 50],
      },
      weekUptime: 100,
      domain: 'https://example.com',
    })
  })
})

// --- GET /api/v1/monitor/{id} ---
describe('findById', () => {
  it('returns the monitor when found and owned by userId', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue({
      ...httpMonitorWithRelation,
      checks: [],
      icmpMonitor: null,
      tcpMonitor: null,
    } as any)

    const service = makeService()
    const result = await service.findById(USER_ID, MONITOR_ID)

    expect(mockPrisma.monitor.findUnique).toHaveBeenCalledWith({
      where: { id: MONITOR_ID },
      include: {
        checks: { orderBy: { checkedAt: 'desc' }, take: 10 },
        httpMonitor: true,
        icmpMonitor: true,
        tcpMonitor: true,
        dnsMonitor: true,
      },
    })
    expect(result).toMatchObject({ id: MONITOR_ID })
  })

  it('throws NotFoundException when monitor does not exist', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(null)

    const service = makeService()
    await expect(service.findById(USER_ID, MONITOR_ID)).rejects.toThrow(NotFoundException)
  })

  it('throws ForbiddenException when monitor belongs to another user', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue({
      ...baseMonitor,
      userId: OTHER_USER_ID,
      checks: [],
    } as any)

    const service = makeService()
    await expect(service.findById(USER_ID, MONITOR_ID)).rejects.toThrow(ForbiddenException)
  })
})

// --- PATCH /api/v1/monitor/{id} ---
describe('update', () => {
  it('updates and returns the HTTP monitor', async () => {
    const updated = { ...existingHttpMonitor, name: 'Updated' }
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(existingHttpMonitor as any)
    vi.mocked(mockTx.monitor.update).mockResolvedValue(updated)
    vi.mocked(mockTx.httpMonitor.upsert).mockResolvedValue(httpMonitorRelation)
    vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(updated as any)

    const service = makeService()
    const result = await service.update(USER_ID, MONITOR_ID, {
      name: 'Updated',
    })

    expect(mockTx.monitor.update).toHaveBeenCalledWith({
      where: { id: MONITOR_ID },
      data: { name: 'Updated' },
    })
    expect(mockTx.httpMonitor.upsert).toHaveBeenCalledWith({
      where: { monitorId: MONITOR_ID },
      update: { url: 'https://example.com', method: Method.HEAD },
      create: {
        monitorId: MONITOR_ID,
        url: 'https://example.com',
        method: Method.HEAD,
      },
    })
    expect(result).toEqual(updated)
  })

  it('throws NotFoundException when monitor belongs to another user', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue({
      ...existingHttpMonitor,
      userId: OTHER_USER_ID,
    } as any)

    const service = makeService()
    await expect(service.update(USER_ID, MONITOR_ID, {})).rejects.toThrow(NotFoundException)
  })

  it('throws NotFoundException when monitor does not exist', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(null)

    const service = makeService()
    await expect(service.update(USER_ID, MONITOR_ID, {})).rejects.toThrow(NotFoundException)
  })

  it('reschedules check when checkInterval changes', async () => {
    const updated = { ...existingHttpMonitor, checkInterval: 30 }
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(existingHttpMonitor as any)
    vi.mocked(mockTx.monitor.update).mockResolvedValue(updated)
    vi.mocked(mockTx.httpMonitor.upsert).mockResolvedValue(httpMonitorRelation)
    vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(updated as any)

    const service = makeService()
    await service.update(USER_ID, MONITOR_ID, {
      checkInterval: 30,
    })

    expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
      checkInterval: 30,
      immediate: false,
      monitorId: MONITOR_ID,
    })
  })

  it('does not reschedule check when checkInterval is unchanged', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(existingHttpMonitor as any)
    vi.mocked(mockTx.monitor.update).mockResolvedValue(existingHttpMonitor)
    vi.mocked(mockTx.httpMonitor.upsert).mockResolvedValue(httpMonitorRelation)
    vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(existingHttpMonitor as any)

    const service = makeService()
    await service.update(USER_ID, MONITOR_ID, {
      name: 'New name',
    })

    expect(mockMonitorCheckService.scheduleCheck).not.toHaveBeenCalled()
  })

  it('throws BadRequestException when HTTP monitor has no URL', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue({
      ...existingHttpMonitor,
      httpMonitor: null,
    } as any)

    const service = makeService()
    await expect(service.update(USER_ID, MONITOR_ID, {})).rejects.toThrow(BadRequestException)
  })

  describe('ICMP', () => {
    it('updates and returns the ICMP monitor', async () => {
      const updated = { ...existingIcmpMonitor, name: 'Updated' }
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(existingIcmpMonitor as any)
      vi.mocked(mockTx.monitor.update).mockResolvedValue(updated)
      vi.mocked(mockTx.icmpMonitor.upsert).mockResolvedValue(icmpMonitorRelation)
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(updated as any)

      const service = makeService()
      const result = await service.update(USER_ID, MONITOR_ID, {
        name: 'Updated',
      })

      expect(mockTx.monitor.update).toHaveBeenCalledWith({
        where: { id: MONITOR_ID },
        data: { name: 'Updated' },
      })
      expect(mockTx.icmpMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { host: '127.0.0.1' },
        create: { monitorId: MONITOR_ID, host: '127.0.0.1' },
      })
      expect(result).toEqual(updated)
    })

    it('uses host from dto when provided', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(existingIcmpMonitor as any)
      vi.mocked(mockTx.monitor.update).mockResolvedValue(existingIcmpMonitor)
      vi.mocked(mockTx.icmpMonitor.upsert).mockResolvedValue(icmpMonitorRelation)
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(existingIcmpMonitor as any)

      const service = makeService()
      await service.update(USER_ID, MONITOR_ID, {
        host: '10.0.0.1',
      })

      expect(mockTx.icmpMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { host: '10.0.0.1' },
        create: { monitorId: MONITOR_ID, host: '10.0.0.1' },
      })
    })

    it('reschedules check when checkInterval changes', async () => {
      const updated = { ...existingIcmpMonitor, checkInterval: 30 }
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(existingIcmpMonitor as any)
      vi.mocked(mockTx.monitor.update).mockResolvedValue(updated)
      vi.mocked(mockTx.icmpMonitor.upsert).mockResolvedValue(icmpMonitorRelation)
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(updated as any)

      const service = makeService()
      await service.update(USER_ID, MONITOR_ID, {
        checkInterval: 30,
      })

      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
        checkInterval: 30,
        immediate: false,
        monitorId: MONITOR_ID,
      })
    })

    it('throws BadRequestException when ICMP monitor has no host', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue({
        ...existingIcmpMonitor,
        icmpMonitor: null,
      } as any)

      const service = makeService()
      await expect(service.update(USER_ID, MONITOR_ID, {})).rejects.toThrow(BadRequestException)
    })
  })

  describe('TCP', () => {
    it('updates and returns the TCP monitor', async () => {
      const updated = { ...existingTcpMonitor, name: 'Updated' }
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(existingTcpMonitor as any)
      vi.mocked(mockTx.monitor.update).mockResolvedValue(updated)
      vi.mocked(mockTx.tcpMonitor.upsert).mockResolvedValue(tcpMonitorRelation)
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(updated as any)

      const service = makeService()
      const result = await service.update(USER_ID, MONITOR_ID, {
        name: 'Updated',
      })

      expect(mockTx.monitor.update).toHaveBeenCalledWith({
        where: { id: MONITOR_ID },
        data: { name: 'Updated' },
      })
      expect(mockTx.tcpMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { host: '127.0.0.1', port: 8080 },
        create: { monitorId: MONITOR_ID, host: '127.0.0.1', port: 8080 },
      })
      expect(result).toEqual(updated)
    })

    it('uses host and port from dto when provided', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(existingTcpMonitor as any)
      vi.mocked(mockTx.monitor.update).mockResolvedValue(existingTcpMonitor)
      vi.mocked(mockTx.tcpMonitor.upsert).mockResolvedValue(tcpMonitorRelation)
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(existingTcpMonitor as any)

      const service = makeService()
      await service.update(USER_ID, MONITOR_ID, {
        host: '10.0.0.1',
        port: 9000,
      })

      expect(mockTx.tcpMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { host: '10.0.0.1', port: 9000 },
        create: { monitorId: MONITOR_ID, host: '10.0.0.1', port: 9000 },
      })
    })

    it('reschedules check when checkInterval changes', async () => {
      const updated = { ...existingTcpMonitor, checkInterval: 30 }
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(existingTcpMonitor as any)
      vi.mocked(mockTx.monitor.update).mockResolvedValue(updated)
      vi.mocked(mockTx.tcpMonitor.upsert).mockResolvedValue(tcpMonitorRelation)
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(updated as any)

      const service = makeService()
      await service.update(USER_ID, MONITOR_ID, {
        checkInterval: 30,
      })

      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
        checkInterval: 30,
        immediate: false,
        monitorId: MONITOR_ID,
      })
    })

    it('throws BadRequestException when TCP monitor has no host', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue({
        ...existingTcpMonitor,
        tcpMonitor: null,
      } as any)

      const service = makeService()
      await expect(service.update(USER_ID, MONITOR_ID, {})).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when TCP monitor has no port', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue({
        ...existingTcpMonitor,
        tcpMonitor: { monitorId: MONITOR_ID, host: '127.0.0.1', port: null },
      } as any)

      const service = makeService()
      await expect(service.update(USER_ID, MONITOR_ID, {})).rejects.toThrow(BadRequestException)
    })
  })

  describe('DNS', () => {
    it('updates and returns the DNS monitor', async () => {
      const updated = { ...existingDnsMonitor, name: 'Updated DNS' }
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(existingDnsMonitor as any)
      vi.mocked(mockTx.monitor.update).mockResolvedValue(updated)
      vi.mocked(mockTx.dnsMonitor.upsert).mockResolvedValue(dnsMonitorRelation)
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(updated as any)

      const service = makeService()
      const result = await service.update(USER_ID, MONITOR_ID, {
        name: 'Updated DNS',
      })

      expect(mockTx.monitor.update).toHaveBeenCalledWith({
        where: { id: MONITOR_ID },
        data: { name: 'Updated DNS' },
      })
      expect(mockTx.dnsMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { host: 'example.com', recordType: RecordType.A },
        create: { monitorId: MONITOR_ID, host: 'example.com', recordType: RecordType.A },
      })
      expect(result).toEqual(updated)
    })

    it('uses host and recordType from dto when provided', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(existingDnsMonitor as any)
      vi.mocked(mockTx.monitor.update).mockResolvedValue(existingDnsMonitor)
      vi.mocked(mockTx.dnsMonitor.upsert).mockResolvedValue({
        monitorId: MONITOR_ID,
        host: 'new.example.com',
        recordType: RecordType.AAAA,
      })
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(existingDnsMonitor as any)

      const service = makeService()
      await service.update(USER_ID, MONITOR_ID, {
        host: 'new.example.com',
        recordType: RecordType.AAAA,
      })

      expect(mockTx.dnsMonitor.upsert).toHaveBeenCalledWith({
        where: { monitorId: MONITOR_ID },
        update: { host: 'new.example.com', recordType: RecordType.AAAA },
        create: { monitorId: MONITOR_ID, host: 'new.example.com', recordType: RecordType.AAAA },
      })
    })

    it('reschedules check when checkInterval changes', async () => {
      const updated = { ...existingDnsMonitor, checkInterval: 30 }
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(existingDnsMonitor as any)
      vi.mocked(mockTx.monitor.update).mockResolvedValue(updated)
      vi.mocked(mockTx.dnsMonitor.upsert).mockResolvedValue(dnsMonitorRelation)
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(updated as any)

      const service = makeService()
      await service.update(USER_ID, MONITOR_ID, {
        checkInterval: 30,
      })

      expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith({
        checkInterval: 30,
        immediate: false,
        monitorId: MONITOR_ID,
      })
    })

    it('does not reschedule check when checkInterval is unchanged', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(existingDnsMonitor as any)
      vi.mocked(mockTx.monitor.update).mockResolvedValue(existingDnsMonitor)
      vi.mocked(mockTx.dnsMonitor.upsert).mockResolvedValue(dnsMonitorRelation)
      vi.mocked(mockTx.monitor.findUnique).mockResolvedValue(existingDnsMonitor as any)

      const service = makeService()
      await service.update(USER_ID, MONITOR_ID, {
        name: 'New name',
      })

      expect(mockMonitorCheckService.scheduleCheck).not.toHaveBeenCalled()
    })

    it('throws BadRequestException when DNS monitor data is missing', async () => {
      vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue({
        ...existingDnsMonitor,
        dnsMonitor: null,
      } as any)

      const service = makeService()
      await expect(service.update(USER_ID, MONITOR_ID, {})).rejects.toThrow(BadRequestException)
    })
  })

  it('throws BadRequestException for an unknown monitor type', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue({
      ...existingHttpMonitor,
      type: 'UNKNOWN',
    } as any)

    const service = makeService()
    await expect(service.update(USER_ID, MONITOR_ID, {})).rejects.toThrow(BadRequestException)
  })
})

// --- DELETE /api/v1/monitor/{id} ---
describe('delete', () => {
  it('deletes the monitor and removes queued jobs', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(baseMonitor)
    vi.mocked(mockPrisma.monitor.delete).mockResolvedValue(baseMonitor)

    const service = makeService()
    await service.delete(USER_ID, MONITOR_ID)

    expect(mockPrisma.monitor.delete).toHaveBeenCalledWith({
      where: { id: MONITOR_ID },
    })
    expect(mockMonitorCheckService.clearScheduledJobs).toHaveBeenCalledWith(MONITOR_ID)
  })

  it('throws NotFoundException when monitor belongs to another user', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue({
      ...baseMonitor,
      userId: OTHER_USER_ID,
    })

    const service = makeService()
    await expect(service.delete(USER_ID, MONITOR_ID)).rejects.toThrow(NotFoundException)
  })

  it('throws NotFoundException when monitor is not found (findUnique returns null)', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(null)

    const service = makeService()
    await expect(service.delete(USER_ID, MONITOR_ID)).rejects.toThrow(NotFoundException)
  })

  it('wraps prisma delete errors in NotFoundException', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(baseMonitor)
    vi.mocked(mockPrisma.monitor.delete).mockRejectedValue(new Error('DB error'))

    const service = makeService()
    await expect(service.delete(USER_ID, MONITOR_ID)).rejects.toThrow(
      'Uptime monitoring service not found: DB error',
    )
  })

  it('handles non-Error delete rejections gracefully', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(baseMonitor)
    vi.mocked(mockPrisma.monitor.delete).mockRejectedValue(42)

    const service = makeService()
    await expect(service.delete(USER_ID, MONITOR_ID)).rejects.toThrow(
      /Uptime monitoring service not found: unknown error/i,
    )
  })
})
