import type { Logger } from '@/shared/logger/logger.service'

import { DnsStrategy } from '../dns-check.strategy'

const mockResolve = vi.hoisted(() => vi.fn())
vi.mock('dns/promises', () => ({ default: { resolve: mockResolve } }))

vi.mock('@nestjs/common', () => ({
  Injectable: () => () => {},
  Logger: class {
    warn = vi.fn()
    log = vi.fn()
  },
}))

vi.mock('@/shared/prisma/prisma.service', () => ({ PrismaService: class {} }))
vi.mock('@prisma/client', () => ({
  RecordType: { A: 'A', MX: 'MX', TXT: 'TXT', CNAME: 'CNAME' },
  StatusEnum: { up: 'up', down: 'down' },
}))

function buildPrisma(overrides: Record<string, unknown> = {}) {
  return {
    monitor: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    check: {
      create: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({}),
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

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger),
} as unknown as Logger

describe('DnsStrategy', () => {
  let strategy: DnsStrategy
  let prisma: ReturnType<typeof buildPrisma>

  beforeEach(() => {
    vi.clearAllMocks()
    prisma = buildPrisma()
    strategy = new DnsStrategy(prisma as never, mockLogger)
  })

  describe('check()', () => {
    it('returns early when dnsMonitor is missing', async () => {
      const monitor = { id: 'monitor-1', timeout: 5000, checkInterval: 5 }

      const result = await strategy.check(monitor as any)

      expect(result).toEqual({
        status: 'down',
        error: 'Monitor or DnsMonitor not found',
        responseTime: null,
        checkedAt: expect.any(Date),
      })
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Monitor or its DnsMonitor not found, skipping check',
        { monitorId: 'monitor-1' },
      )
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('persists a successful check with status "up"', async () => {
      const monitor = buildMonitor()
      mockResolve.mockResolvedValue(['1.2.3.4'])

      await strategy.check(monitor as any)

      expect(prisma.$transaction).toHaveBeenCalledOnce()
      const ops = prisma.$transaction.mock.calls[0][0]
      expect(ops).toHaveLength(2)
    })

    it('persists a failed check with status "down" on DNS error', async () => {
      const monitor = buildMonitor()
      mockResolve.mockRejectedValue(new Error('ENOTFOUND'))

      await strategy.check(monitor as any)

      expect(prisma.$transaction).toHaveBeenCalledOnce()
    })
  })

  describe('DNS resolution', () => {
    it('resolves using the record type from the dnsMonitor', async () => {
      const monitor = buildMonitor({ recordType: 'AAAA' })
      mockResolve.mockResolvedValue(['::1'])

      await strategy.check(monitor as any)

      expect(mockResolve).toHaveBeenCalledWith('example.com', 'AAAA')
    })

    it('falls back to "A" when recordType is null', async () => {
      const monitor = buildMonitor({ recordType: null })
      mockResolve.mockResolvedValue(['1.2.3.4'])

      await strategy.check(monitor as any)

      expect(mockResolve).toHaveBeenCalledWith('example.com', 'A')
    })
  })

  describe('timeout', () => {
    it('treats a timeout as a down status', async () => {
      const monitor = buildMonitor({ timeout: 5000 })
      mockResolve.mockRejectedValue(new Error('DNS timeout after 5000ms'))

      await strategy.check(monitor as any)

      expect(prisma.$transaction).toHaveBeenCalledOnce()
      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.error).toBe('DNS timeout after 5000ms')
    })
  })

  describe('DNS record formatting (via integration)', () => {
    it('formats A records as a comma-separated string', async () => {
      const monitor = buildMonitor({ recordType: 'A' })
      mockResolve.mockResolvedValue(['1.1.1.1', '8.8.8.8'])

      await strategy.check(monitor as any)

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.details?.resolvedValue).toBe('1.1.1.1, 8.8.8.8')
    })

    it('formats MX records as exchange:priority pairs', async () => {
      const monitor = buildMonitor({ recordType: 'MX' })
      mockResolve.mockResolvedValue([
        { exchange: 'mail.example.com', priority: 10 },
        { exchange: 'mail2.example.com', priority: 20 },
      ])

      await strategy.check(monitor as any)

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.details?.resolvedValue).toBe(
        'mail.example.com:10, mail2.example.com:20',
      )
    })

    it('formats TXT records by joining array chunks', async () => {
      const monitor = buildMonitor({ recordType: 'TXT' })
      mockResolve.mockResolvedValue([['v=spf1', ' include:example.com', ' ~all']])

      await strategy.check(monitor as any)

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.details?.resolvedValue).toBe('v=spf1 include:example.com ~all')
    })

    it('formats CNAME records as plain strings', async () => {
      const monitor = buildMonitor({ recordType: 'CNAME' })
      mockResolve.mockResolvedValue(['alias.example.com'])

      await strategy.check(monitor as any)

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.details?.resolvedValue).toBe('alias.example.com')
    })

    it('sets resolvedValue to null when DNS query fails', async () => {
      const monitor = buildMonitor()
      mockResolve.mockRejectedValue(new Error('ENOTFOUND'))

      await strategy.check(monitor as any)

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.details?.resolvedValue).toBeNull()
    })
  })

  describe('error capture', () => {
    it('stores the error message on failure', async () => {
      const monitor = buildMonitor()
      mockResolve.mockRejectedValue(new Error('NXDOMAIN'))

      await strategy.check(monitor as any)

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.error).toMatch(/does not exist/i)
    })

    it('stores a generic message for non-Error throws', async () => {
      const monitor = buildMonitor()
      mockResolve.mockRejectedValue('some string error')

      await strategy.check(monitor as any)

      const checkCreate = prisma.check.create.mock.calls[0]?.[0]
      expect(checkCreate?.data?.error).toMatch(/DNS query failed/i)
    })
  })
})
