import { Logger, NotFoundException } from '@nestjs/common'

import { IncidentsService } from './incidents.service'

vi.mock('../analytics.sql', () => ({
  getDailyStatsSql: vi.fn(),
  getIncidentsCountSql: vi.fn(),
  getIncidentsSql: vi.fn(),
  getTimelineSql: vi.fn(),
  getUptimeItemSql: vi.fn(),
}))

const makeIncidentRaw = (overrides = {}) => [
  {
    startAt: new Date('2024-01-02T10:00:00Z'),
    endAt: new Date('2024-01-02T10:05:00Z'),
    durationMs: 300_000,
    cause: 'Connection refused',
    ...overrides,
  },
]

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    monitor: {
      findUnique: vi.fn(),
    },
    check: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
    ...overrides,
  }
}

describe('IncidentsService', () => {
  let service: IncidentsService
  let prisma: ReturnType<typeof makePrisma>

  let loggerErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    prisma = makePrisma()
    service = new IncidentsService(prisma as never)
    loggerErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    loggerErrorSpy.mockRestore()
  })

  describe('getIncidents', () => {
    const startDate = new Date('2024-01-01T00:00:00Z')

    it('throws NotFoundException when monitor does not exist', async () => {
      prisma.monitor.findUnique.mockResolvedValue(null)

      await expect(service.getIncidents('user-1', 'monitor-1', startDate)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('throws NotFoundException when monitor belongs to a different user', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'other-user' })

      await expect(service.getIncidents('user-1', 'monitor-1', startDate)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('returns incidents list and total count', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw
        .mockResolvedValueOnce(makeIncidentRaw())
        .mockResolvedValueOnce([{ count: 1 }])

      const { incidents, total } = await service.getIncidents('user-1', 'monitor-1', startDate)

      expect(total).toBe(1)
      expect(incidents).toHaveLength(1)
      expect(incidents[0]).toMatchObject({
        durationMs: 300_000,
        cause: 'Connection refused',
      })
      expect(incidents[0].startAt).toBeInstanceOf(Date)
    })

    it('maps null durationMs to null and formats as Active', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw
        .mockResolvedValueOnce(makeIncidentRaw({ durationMs: null, endAt: null }))
        .mockResolvedValueOnce([{ count: 1 }])

      const { incidents } = await service.getIncidents('user-1', 'monitor-1', startDate)

      expect(incidents[0].durationMs).toBeNull()
      expect(incidents[0].formattedDuration).toBe('Active')
    })

    it('formats duration as "Xm Ys" when minutes and seconds are > 0', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw
        .mockResolvedValueOnce(makeIncidentRaw({ durationMs: 305_000 }))
        .mockResolvedValueOnce([{ count: 1 }])

      const { incidents } = await service.getIncidents('user-1', 'monitor-1', startDate)
      expect(incidents[0].formattedDuration).toBe('5m 5s')
    })

    it('formats duration as "Xs" when minutes are 0', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw
        .mockResolvedValueOnce(makeIncidentRaw({ durationMs: 45_000 }))
        .mockResolvedValueOnce([{ count: 1 }])

      const { incidents } = await service.getIncidents('user-1', 'monitor-1', startDate)
      expect(incidents[0].formattedDuration).toBe('45s')
    })

    it('maps null cause to null', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw
        .mockResolvedValueOnce(makeIncidentRaw({ cause: null }))
        .mockResolvedValueOnce([{ count: 1 }])

      const { incidents } = await service.getIncidents('user-1', 'monitor-1', startDate)

      expect(incidents[0].cause).toBeNull()
    })

    it('returns 0 total when count row is missing', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{}])

      const { total } = await service.getIncidents('user-1', 'monitor-1', startDate)

      expect(total).toBe(0)
    })

    it('re-throws database errors from getIncidentsCount', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw
        .mockResolvedValueOnce(makeIncidentRaw())
        .mockRejectedValueOnce(new Error('Incidents count DB exploded'))

      await expect(service.getIncidents('user-1', 'monitor-1', new Date())).rejects.toThrow(
        'Incidents count DB exploded',
      )
    })
  })

  describe('error propagation', () => {
    it('re-throws database errors from getIncidents (getIncidentsList)', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw.mockRejectedValue(new Error('DB exploded'))

      await expect(service.getIncidents('user-1', 'monitor-1', new Date())).rejects.toThrow(
        'DB exploded',
      )
    })

    it('handles non-Error throws from getIncidentsList', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.$queryRaw.mockRejectedValue(42)

      await expect(service.getIncidents('user-1', 'monitor-1', new Date())).rejects.toBe(42)

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error'),
        undefined,
      )
    })
  })
})
