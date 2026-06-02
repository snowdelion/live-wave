import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { Method } from '@prisma/client'

import type { PrismaService } from '@/backend/shared/prisma/prisma.service'

import { MonitorService } from '../monitor.service'

// --- mocks ---
const mockPrisma = {
  monitor: {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as PrismaService

const mockMonitorCheckService = {
  scheduleCheck: vi.fn(),
}

const mockChecksQueue = {
  removeJobs: vi.fn(),
}

const makeService = () =>
  new MonitorService(mockPrisma, mockMonitorCheckService as any, mockChecksQueue as any)

// --- helpers ---
const CLIENT_ID = 'client-abc'
const OTHER_CLIENT_ID = 'client-xyz'
const MONITOR_ID = 'id'

const baseMonitor = {
  id: MONITOR_ID,
  clientId: CLIENT_ID,
  name: 'name',
  url: 'https://example.com',
  method: Method.HEAD,
  checkInterval: 10,
  timeout: 5000,
  lastStatus: null,
  lastCheckedAt: null,
  nextCheckAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(mockPrisma.monitor.count).mockResolvedValue(0)
})

// --- POST /api/v1/monitor ---
describe('create', () => {
  it('creates a monitor with defaults', async () => {
    vi.mocked(mockPrisma.monitor.create).mockResolvedValue(baseMonitor)

    const service = makeService()
    const result = await service.create(CLIENT_ID, {
      name: 'name',
      url: 'https://example.com',
    })

    expect(mockPrisma.monitor.create).toHaveBeenCalledWith({
      data: {
        name: 'name',
        url: 'https://example.com',
        method: 'HEAD',
        checkInterval: 10,
        timeout: 5000,
        clientId: CLIENT_ID,
      },
    })
    expect(result).toEqual(baseMonitor)
  })

  it('passes explicit method / interval / timeout through', async () => {
    vi.mocked(mockPrisma.monitor.create).mockResolvedValue(baseMonitor)

    const service = makeService()
    await service.create(CLIENT_ID, {
      name: 'name',
      url: 'https://example.com',
      method: 'GET',
      checkInterval: 30,
      timeout: 3000,
    })

    expect(mockPrisma.monitor.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ method: 'GET', checkInterval: 30, timeout: 3000 }),
    })
  })

  it('schedules a check after creation', async () => {
    vi.mocked(mockPrisma.monitor.create).mockResolvedValue(baseMonitor)

    const service = makeService()
    await service.create(CLIENT_ID, { name: 'name', url: 'https://example.com' })

    expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith(baseMonitor)
  })

  it('throws ForbiddenException when the client already has 5 monitors', async () => {
    vi.mocked(mockPrisma.monitor.count).mockResolvedValue(5)

    const service = makeService()
    await expect(
      service.create(CLIENT_ID, { name: 'name', url: 'https://example.com' }),
    ).rejects.toThrow(ForbiddenException)

    expect(mockPrisma.monitor.create).not.toHaveBeenCalled()
  })
})

// --- GET /api/v1/monitor ---
describe('findAllByClientId', () => {
  it('returns monitors ordered by createdAt desc', async () => {
    const monitors = [baseMonitor]
    vi.mocked(mockPrisma.monitor.findMany).mockResolvedValue(monitors)

    const service = makeService()
    const result = await service.findAllByClientId(CLIENT_ID)

    expect(mockPrisma.monitor.findMany).toHaveBeenCalledWith({
      where: { clientId: CLIENT_ID },
      orderBy: { createdAt: 'desc' },
    })
    expect(result).toEqual(monitors)
  })
})

// --- GET /api/v1/monitor/{id} ---
describe('findById', () => {
  it('returns the monitor when found and owned by clientId', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue({
      ...baseMonitor,
      checks: [],
    } as any)

    const service = makeService()
    const result = await service.findById(CLIENT_ID, MONITOR_ID)

    expect(mockPrisma.monitor.findUnique).toHaveBeenCalledWith({
      where: { id: MONITOR_ID },
      include: {
        checks: { orderBy: { checkedAt: 'desc' }, take: 10 },
      },
    })
    expect(result).toMatchObject({ id: MONITOR_ID })
  })

  it('throws NotFoundException when monitor does not exist', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(null)

    const service = makeService()
    await expect(service.findById(CLIENT_ID, MONITOR_ID)).rejects.toThrow(NotFoundException)
  })

  it('throws ForbiddenException when monitor belongs to another client', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue({
      ...baseMonitor,
      clientId: OTHER_CLIENT_ID,
      checks: [],
    } as any)

    const service = makeService()
    await expect(service.findById(CLIENT_ID, MONITOR_ID)).rejects.toThrow(ForbiddenException)
  })
})

// --- PATCH /api/v1/monitor/{id} ---
describe('update', () => {
  it('updates and returns the monitor', async () => {
    const updated = { ...baseMonitor, name: 'Updated' }
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(baseMonitor)
    vi.mocked(mockPrisma.monitor.update).mockResolvedValue(updated)

    const service = makeService()
    const result = await service.update(CLIENT_ID, MONITOR_ID, { name: 'Updated' })

    expect(mockPrisma.monitor.update).toHaveBeenCalledWith({
      where: { id: MONITOR_ID },
      data: { name: 'Updated' },
    })
    expect(result).toEqual(updated)
  })

  it('throws NotFoundException when updated monitor belongs to another client', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(baseMonitor)
    vi.mocked(mockPrisma.monitor.update).mockResolvedValue({
      ...baseMonitor,
      clientId: OTHER_CLIENT_ID,
    })

    const service = makeService()
    await expect(service.update(CLIENT_ID, MONITOR_ID, {})).rejects.toThrow(NotFoundException)
  })

  it('reschedules check when checkInterval changes', async () => {
    const updated = { ...baseMonitor, checkInterval: 30 }
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(baseMonitor)
    vi.mocked(mockPrisma.monitor.update).mockResolvedValue(updated)

    const service = makeService()
    await service.update(CLIENT_ID, MONITOR_ID, { checkInterval: 30 })

    expect(mockMonitorCheckService.scheduleCheck).toHaveBeenCalledWith(updated)
  })

  it('does not reschedule check when checkInterval is unchanged', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(baseMonitor)
    vi.mocked(mockPrisma.monitor.update).mockResolvedValue(baseMonitor)

    const service = makeService()
    await service.update(CLIENT_ID, MONITOR_ID, { name: 'New name' })

    expect(mockMonitorCheckService.scheduleCheck).not.toHaveBeenCalled()
  })

  it('wraps prisma errors in NotFoundException', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(baseMonitor)
    vi.mocked(mockPrisma.monitor.update).mockRejectedValue(new Error('Record not found'))

    const service = makeService()
    await expect(service.update(CLIENT_ID, MONITOR_ID, {})).rejects.toThrow(
      'Uptime monitoring service not found: Record not found',
    )
  })

  it('handles non-Error rejections gracefully', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(baseMonitor)
    vi.mocked(mockPrisma.monitor.update).mockRejectedValue('oops')

    const service = makeService()
    await expect(service.update(CLIENT_ID, MONITOR_ID, {})).rejects.toThrow(
      'Uptime monitoring service not found: unexpected error',
    )
  })
})

// --- DELETE /api/v1/monitor/{id} ---
describe('delete', () => {
  it('deletes the monitor and removes queued jobs', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(baseMonitor)
    vi.mocked(mockPrisma.monitor.delete).mockResolvedValue(baseMonitor)

    const service = makeService()
    await service.delete(CLIENT_ID, MONITOR_ID)

    expect(mockPrisma.monitor.delete).toHaveBeenCalledWith({
      where: { id: MONITOR_ID, clientId: CLIENT_ID },
    })
    expect(mockChecksQueue.removeJobs).toHaveBeenCalled()
  })

  it('throws NotFoundException when monitor belongs to another client', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue({
      ...baseMonitor,
      clientId: OTHER_CLIENT_ID,
    })

    const service = makeService()
    await expect(service.delete(CLIENT_ID, MONITOR_ID)).rejects.toThrow(NotFoundException)
  })

  it('throws NotFoundException when monitor is not found (findUnique returns null)', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(null)

    const service = makeService()
    await expect(service.delete(CLIENT_ID, MONITOR_ID)).rejects.toThrow(NotFoundException)
  })

  it('wraps prisma delete errors in NotFoundException', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(baseMonitor)
    vi.mocked(mockPrisma.monitor.delete).mockRejectedValue(new Error('DB error'))

    const service = makeService()
    await expect(service.delete(CLIENT_ID, MONITOR_ID)).rejects.toThrow(
      'Uptime monitoring service not found: DB error',
    )
  })

  it('handles non-Error delete rejections gracefully', async () => {
    vi.mocked(mockPrisma.monitor.findUnique).mockResolvedValue(baseMonitor)
    vi.mocked(mockPrisma.monitor.delete).mockRejectedValue(42)

    const service = makeService()
    await expect(service.delete(CLIENT_ID, MONITOR_ID)).rejects.toThrow(
      'Uptime monitoring service not found: unexpected error',
    )
  })
})
