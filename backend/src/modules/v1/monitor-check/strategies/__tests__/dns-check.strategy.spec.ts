import { DnsStrategy } from '../dns-check.strategy'

// --- mocks ---
const mockResolve = vi.hoisted(() => vi.fn())
vi.mock('dns/promises', () => ({ default: { resolve: mockResolve } }))

vi.mock('@nestjs/common', () => ({
  Injectable: () => () => {},
  Logger: class {
    warn = vi.fn()
    log = vi.fn()
  },
}))

vi.mock('@/backend/shared/prisma/prisma.service', () => ({ PrismaService: class {} }))
vi.mock('@prisma/client', () => ({
  RecordType: {},
  StatusEnum: { up: 'up', down: 'down' },
}))

// --- helpers ---
function buildPrisma(overrides: Record<string, unknown> = {}) {
  return {
    monitor: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    check: {
      create: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

function buildMonitor(dnsOverrides: Record<string, unknown> = {}) {
  return {
    id: 'monitor-1',
    timeout: 5000,
    checkInterval: 5,
    dnsMonitor: {
      host: 'example.com',
      recordType: 'A',
      ...dnsOverrides,
    },
  }
}

// --- tests ---
describe('DnsStrategy', () => {
  let strategy: DnsStrategy
  let prisma: ReturnType<typeof buildPrisma>

  beforeEach(() => {
    vi.clearAllMocks()
    prisma = buildPrisma()
    strategy = new DnsStrategy(prisma as never)
  })

  describe('check()', () => {
    it('returns early when monitor is not found', async () => {
      prisma.monitor.findUnique.mockResolvedValue(null)

      await strategy.check('missing-id')

      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('returns early when dnsMonitor relation is missing', async () => {
      prisma.monitor.findUnique.mockResolvedValue({ id: 'monitor-1', dnsMonitor: null })

      await strategy.check('monitor-1')

      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('persists a successful check with status "up"', async () => {
      prisma.monitor.findUnique.mockResolvedValue(buildMonitor())
      mockResolve.mockResolvedValue(['1.2.3.4'])

      await strategy.check('monitor-1')

      const [[createCall, updateCall]] = prisma.$transaction.mock.calls
      expect(createCall).toMatchObject({})
      expect(updateCall).toMatchObject({})
      expect(prisma.$transaction).toHaveBeenCalledOnce()
      const ops = prisma.$transaction.mock.calls[0][0]
      expect(ops).toHaveLength(2)
    })

    it('persists a failed check with status "down" on DNS error', async () => {
      prisma.monitor.findUnique.mockResolvedValue(buildMonitor())
      mockResolve.mockRejectedValue(new Error('ENOTFOUND'))

      await strategy.check('monitor-1')

      expect(prisma.$transaction).toHaveBeenCalledOnce()
    })
  })

  describe('DNS resolution', () => {
    it('resolves using the record type from the dnsMonitor', async () => {
      prisma.monitor.findUnique.mockResolvedValue(buildMonitor({ recordType: 'AAAA' }))
      mockResolve.mockResolvedValue(['::1'])

      await strategy.check('monitor-1')

      expect(mockResolve).toHaveBeenCalledWith('example.com', 'AAAA')
    })

    it('falls back to "A" when recordType is null', async () => {
      prisma.monitor.findUnique.mockResolvedValue(buildMonitor({ recordType: null }))
      mockResolve.mockResolvedValue(['1.2.3.4'])

      await strategy.check('monitor-1')

      expect(mockResolve).toHaveBeenCalledWith('example.com', 'A')
    })
  })

  describe('timeout', () => {
    it('treats a timeout as a down status', async () => {
      prisma.monitor.findUnique.mockResolvedValue(buildMonitor({ timeout: 5000 }))

      mockResolve.mockRejectedValue(new Error('DNS timeout after 5000ms'))

      await strategy.check('monitor-1')

      expect(prisma.$transaction).toHaveBeenCalledOnce()
      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.error).toBe('DNS timeout after 5000ms')
    })
  })

  describe('DNS record formatting (via integration)', () => {
    it('formats A records as a comma-separated string', async () => {
      prisma.monitor.findUnique.mockResolvedValue(buildMonitor({ recordType: 'A' }))
      mockResolve.mockResolvedValue(['1.1.1.1', '8.8.8.8'])

      await strategy.check('monitor-1')

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.details?.resolvedValue).toBe('1.1.1.1, 8.8.8.8')
    })

    it('formats MX records as exchange:priority pairs', async () => {
      prisma.monitor.findUnique.mockResolvedValue(buildMonitor({ recordType: 'MX' }))
      mockResolve.mockResolvedValue([
        { exchange: 'mail.example.com', priority: 10 },
        { exchange: 'mail2.example.com', priority: 20 },
      ])

      await strategy.check('monitor-1')

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.details?.resolvedValue).toBe(
        'mail.example.com:10, mail2.example.com:20',
      )
    })

    it('formats TXT records by joining array chunks', async () => {
      prisma.monitor.findUnique.mockResolvedValue(buildMonitor({ recordType: 'TXT' }))
      mockResolve.mockResolvedValue([['v=spf1', ' include:example.com', ' ~all']])

      await strategy.check('monitor-1')

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.details?.resolvedValue).toBe('v=spf1 include:example.com ~all')
    })

    it('formats CNAME records as plain strings', async () => {
      prisma.monitor.findUnique.mockResolvedValue(buildMonitor({ recordType: 'CNAME' }))
      mockResolve.mockResolvedValue(['alias.example.com'])

      await strategy.check('monitor-1')

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.details?.resolvedValue).toBe('alias.example.com')
    })

    it('sets resolvedValue to null when DNS query fails', async () => {
      prisma.monitor.findUnique.mockResolvedValue(buildMonitor())
      mockResolve.mockRejectedValue(new Error('ENOTFOUND'))

      await strategy.check('monitor-1')

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.details?.resolvedValue).toBeNull()
    })
  })

  describe('nextCheckAt', () => {
    it('schedules next check at now + checkInterval minutes', async () => {
      const before = Date.now()
      prisma.monitor.findUnique.mockResolvedValue(buildMonitor())
      mockResolve.mockResolvedValue(['1.2.3.4'])

      await strategy.check('monitor-1')

      const monitorUpdate = prisma.monitor.update.mock.calls[0]?.[0]
      const nextCheckAt: Date = monitorUpdate?.data?.nextCheckAt
      const diff = nextCheckAt.getTime() - before
      const fiveMinutesMs = 5 * 60 * 1000

      expect(diff).toBeGreaterThanOrEqual(fiveMinutesMs - 500)
      expect(diff).toBeLessThan(fiveMinutesMs + 500)
    })
  })

  describe('error capture', () => {
    it('stores the error message on failure', async () => {
      prisma.monitor.findUnique.mockResolvedValue(buildMonitor())
      mockResolve.mockRejectedValue(new Error('SERVFAIL'))

      await strategy.check('monitor-1')

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.error).toBe('SERVFAIL')
    })

    it('stores a generic message for non-Error throws', async () => {
      prisma.monitor.findUnique.mockResolvedValue(buildMonitor())
      mockResolve.mockRejectedValue('some string error')

      await strategy.check('monitor-1')

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.error).toBe('DNS query failed')
    })
  })
})
