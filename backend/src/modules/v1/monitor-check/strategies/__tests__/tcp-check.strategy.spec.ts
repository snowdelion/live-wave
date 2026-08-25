import net from 'net'

import { StatusEnum } from '@prisma/client'

import type { Logger } from '@/shared/logger/logger.service'

import type { StrategyContext } from '../strategy-result.types'
import { TcpStrategy } from '../tcp-check.strategy'

vi.mock('net', () => {
  const Socket = vi.fn()
  Socket.prototype.setTimeout = vi.fn()
  Socket.prototype.once = vi.fn()
  Socket.prototype.connect = vi.fn()
  Socket.prototype.destroy = vi.fn()
  return { default: { Socket } }
})

const mockTransaction = vi.fn()
const mockFindUnique = vi.fn()

const mockCheckCreate = vi.fn((args: unknown) => args)
const mockCheckDelete = vi.fn((args: unknown) => args)
const mockMonitorUpdate = vi.fn((args: unknown) => args)

const mockPrisma = {
  monitor: { findUnique: mockFindUnique, update: mockMonitorUpdate },
  check: { create: mockCheckCreate, deleteMany: mockCheckDelete },
  $transaction: mockTransaction,
}

const makeMonitorContext = (overrides = {}): StrategyContext =>
  ({
    id: 'monitor-1',
    type: 'TCP',
    timeout: 5000,
    checkInterval: 5,
    tcpMonitor: { host: 'example.com', port: 80 },
    ...overrides,
  }) as unknown as StrategyContext

function setupSocket(triggerEvent: 'connect' | 'error' | 'timeout', errorArg?: Error) {
  const NetSocket = net.Socket as unknown as ReturnType<typeof vi.fn>
  NetSocket.mockImplementation(() => {
    const handlers: Record<string, (...a: unknown[]) => void> = {}

    const socket = {
      setTimeout: vi.fn(),
      destroy: vi.fn(),
      once(event: string, cb: (...a: unknown[]) => void) {
        handlers[event] = cb
      },
      connect(_port: number, _host: string, cb: () => void) {
        if (triggerEvent === 'connect') return cb()
        if (triggerEvent === 'timeout') return handlers['timeout']?.()
        if (triggerEvent === 'error')
          return handlers['error']?.(errorArg ?? new Error('ECONNREFUSED'))
      },
    }
    return socket
  })
}

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger),
} as unknown as Logger

describe('TcpStrategy', () => {
  let strategy: TcpStrategy

  beforeEach(() => {
    vi.clearAllMocks()
    strategy = new TcpStrategy(mockPrisma as never, mockLogger)
    mockTransaction.mockResolvedValue([])
  })

  describe('check()', () => {
    it('warns and returns down when monitor context is missing tcpMonitor', async () => {
      const result = await strategy.check({ id: 'monitor-1', type: 'TCP' } as StrategyContext)

      expect(result.status).toBe(StatusEnum.down)
      expect(result.error).toBe('Monitor or TcpMonitor not found')
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('performs check with correct context', async () => {
      setupSocket('connect')
      const monitorCtx = makeMonitorContext()

      await strategy.check(monitorCtx)

      expect(mockTransaction).toHaveBeenCalled()
    })
  })

  describe('performCheck() - successful connection', () => {
    beforeEach(() => setupSocket('connect'))

    it('records status=up in the transaction', async () => {
      await strategy.check(makeMonitorContext())

      const [ops] = mockTransaction.mock.calls[0]
      expect(ops[0]).toMatchObject({ data: { status: StatusEnum.up } })
    })

    it('records a non-null responseTime', async () => {
      await strategy.check(makeMonitorContext())

      const [ops] = mockTransaction.mock.calls[0]
      expect(ops[0].data.responseTime).toBeGreaterThanOrEqual(0)
    })

    it('records null error on success', async () => {
      await strategy.check(makeMonitorContext())

      const [ops] = mockTransaction.mock.calls[0]
      expect(ops[0].data.error).toBeNull()
    })
  })

  describe('performCheck() - connection error', () => {
    it('records status=down on socket error', async () => {
      setupSocket('error', new Error('ECONNREFUSED'))

      await strategy.check(makeMonitorContext())

      const [ops] = mockTransaction.mock.calls[0]
      expect(ops[0].data.status).toBe(StatusEnum.down)
    })

    it('captures the error message', async () => {
      setupSocket('error', new Error('ECONNREFUSED'))

      await strategy.check(makeMonitorContext())

      const [ops] = mockTransaction.mock.calls[0]
      expect(ops[0].data.error).toMatch(/connection refused by/i)
    })

    it('handles non-Error throws gracefully', async () => {
      const NetSocket = net.Socket as unknown as ReturnType<typeof vi.fn>
      NetSocket.mockImplementation(() => ({
        setTimeout: vi.fn(),
        destroy: vi.fn(),
        once(event: string, cb: (...a: unknown[]) => void) {
          if (event === 'error') cb('string-error')
        },
        connect() {},
      }))

      await strategy.check(makeMonitorContext())

      const [ops] = mockTransaction.mock.calls[0]
      expect(ops[0].data.error).toMatch(/failed to connect/i)
    })
  })

  describe('performCheck() - timeout', () => {
    it('records status=down on timeout', async () => {
      setupSocket('timeout')

      await strategy.check(makeMonitorContext())

      const [ops] = mockTransaction.mock.calls[0]
      expect(ops[0].data.status).toBe(StatusEnum.down)
    })

    it('includes timeout duration in the error message', async () => {
      setupSocket('timeout')

      await strategy.check(makeMonitorContext({ timeout: 3000 }))

      const [ops] = mockTransaction.mock.calls[0]
      expect(ops[0].data.error).toContain('3000ms')
    })
  })

  describe('confirmCheckResult()', () => {
    it('runs prisma.$transaction with check.create and check.deleteMany', async () => {
      setupSocket('connect')

      await strategy.check(makeMonitorContext())

      expect(mockTransaction).toHaveBeenCalledOnce()
      const [ops] = mockTransaction.mock.calls[0]

      expect(ops).toHaveLength(2)
      expect(ops[0]).toHaveProperty('data')
      expect(ops[1]).toHaveProperty('where')
    })

    it('passes the correct monitorId to check.create', async () => {
      setupSocket('connect')

      await strategy.check(makeMonitorContext())

      const [ops] = mockTransaction.mock.calls[0]
      expect(ops[0].data.monitorId).toBe('monitor-1')
    })

    it('passes the correct monitorId to check.deleteMany', async () => {
      setupSocket('connect')

      await strategy.check(makeMonitorContext())

      const [ops] = mockTransaction.mock.calls[0]
      expect(ops[1].where.monitorId).toBe('monitor-1')
    })
  })
})
