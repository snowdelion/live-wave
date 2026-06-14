import net from 'net'

import { Logger } from '@nestjs/common'
import { StatusEnum } from '@prisma/client'

import { TcpStrategy } from '../tcp-check.strategy'

// --- mocks ---
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
const mockMonitorUpdate = vi.fn((args: unknown) => args)

const mockPrisma = {
  monitor: { findUnique: mockFindUnique, update: mockMonitorUpdate },
  check: { create: mockCheckCreate },
  $transaction: mockTransaction,
}

const makeMonitor = (overrides = {}) => ({
  id: 'monitor-1',
  timeout: 5000,
  checkInterval: 5,
  tcpMonitor: { host: 'example.com', port: 80 },
  ...overrides,
})

// --- helpers ---
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

// --- tests ---
describe('TcpStrategy', () => {
  let strategy: TcpStrategy

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})
    strategy = new TcpStrategy(mockPrisma as never)
    mockTransaction.mockResolvedValue([])
  })

  describe('check()', () => {
    it('warns and returns early when monitor is not found', async () => {
      mockFindUnique.mockResolvedValue(null)

      await strategy.check('missing-id')

      expect(Logger.prototype.warn).toHaveBeenCalledWith(expect.stringContaining('missing-id'))
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('warns and returns early when tcpMonitor relation is missing', async () => {
      mockFindUnique.mockResolvedValue({ id: 'monitor-1', tcpMonitor: null })

      await strategy.check('monitor-1')

      expect(Logger.prototype.warn).toHaveBeenCalledWith(expect.stringContaining('monitor-1'))
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('queries the DB with the correct monitorId and includes tcpMonitor', async () => {
      setupSocket('connect')
      mockFindUnique.mockResolvedValue(makeMonitor())

      await strategy.check('monitor-1')

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'monitor-1' },
        include: { tcpMonitor: true },
      })
    })
  })

  describe('performCheck() - successful connection', () => {
    beforeEach(() => setupSocket('connect'))

    it('records status=up in the transaction', async () => {
      mockFindUnique.mockResolvedValue(makeMonitor())

      await strategy.check('monitor-1')

      const [[[checkCreate, monitorUpdate]]] = mockTransaction.mock.calls
      expect(checkCreate).toMatchObject({ data: { status: StatusEnum.up } })
      expect(monitorUpdate).toMatchObject({ data: { lastStatus: StatusEnum.up } })
    })

    it('records a non-null responseTime', async () => {
      mockFindUnique.mockResolvedValue(makeMonitor())

      await strategy.check('monitor-1')

      const [[[checkCreate]]] = mockTransaction.mock.calls
      expect(checkCreate.data.responseTime).toBeGreaterThanOrEqual(0)
    })

    it('records null error on success', async () => {
      mockFindUnique.mockResolvedValue(makeMonitor())

      await strategy.check('monitor-1')

      const [[[checkCreate]]] = mockTransaction.mock.calls
      expect(checkCreate.data.error).toBeNull()
    })

    it('sets nextCheckAt based on checkInterval', async () => {
      mockFindUnique.mockResolvedValue(makeMonitor({ checkInterval: 10 }))
      const before = Date.now()

      await strategy.check('monitor-1')

      const [[[, monitorUpdate]]] = mockTransaction.mock.calls
      const next: Date = monitorUpdate.data.nextCheckAt
      expect(next.getTime()).toBeGreaterThanOrEqual(before + 10 * 60 * 1000)
    })
  })

  describe('performCheck() - connection error', () => {
    it('records status=down on socket error', async () => {
      setupSocket('error', new Error('ECONNREFUSED'))
      mockFindUnique.mockResolvedValue(makeMonitor())

      await strategy.check('monitor-1')

      const [[[checkCreate, monitorUpdate]]] = mockTransaction.mock.calls
      expect(checkCreate.data.status).toBe(StatusEnum.down)
      expect(monitorUpdate.data.lastStatus).toBe(StatusEnum.down)
    })

    it('captures the error message', async () => {
      setupSocket('error', new Error('ECONNREFUSED'))
      mockFindUnique.mockResolvedValue(makeMonitor())

      await strategy.check('monitor-1')

      const [[[checkCreate]]] = mockTransaction.mock.calls
      expect(checkCreate.data.error).toBe('ECONNREFUSED')
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
      mockFindUnique.mockResolvedValue(makeMonitor())

      await strategy.check('monitor-1')

      const [[[checkCreate]]] = mockTransaction.mock.calls
      expect(checkCreate.data.error).toMatch(/unknown error/i)
    })
  })

  describe('performCheck() - timeout', () => {
    it('records status=down on timeout', async () => {
      setupSocket('timeout')
      mockFindUnique.mockResolvedValue(makeMonitor())

      await strategy.check('monitor-1')

      const [[[checkCreate]]] = mockTransaction.mock.calls
      expect(checkCreate.data.status).toBe(StatusEnum.down)
    })

    it('includes timeout duration in the error message', async () => {
      setupSocket('timeout')
      mockFindUnique.mockResolvedValue(makeMonitor({ timeout: 3000 }))

      await strategy.check('monitor-1')

      const [[[checkCreate]]] = mockTransaction.mock.calls
      expect(checkCreate.data.error).toContain('3000ms')
    })
  })

  describe('confirmTransaction()', () => {
    it('runs prisma.$transaction with check.create and monitor.update', async () => {
      setupSocket('connect')
      mockFindUnique.mockResolvedValue(makeMonitor())

      await strategy.check('monitor-1')

      expect(mockTransaction).toHaveBeenCalledOnce()
      const [[[...ops]]] = mockTransaction.mock.calls
      expect(ops).toHaveLength(2)
    })

    it('passes the correct monitorId to check.create', async () => {
      setupSocket('connect')
      mockFindUnique.mockResolvedValue(makeMonitor())

      await strategy.check('monitor-1')

      const [[[checkCreate]]] = mockTransaction.mock.calls
      expect(checkCreate.data.monitorId).toBe('monitor-1')
    })

    it('updates the correct monitor record', async () => {
      setupSocket('connect')
      mockFindUnique.mockResolvedValue(makeMonitor())

      await strategy.check('monitor-1')

      const [[[, monitorUpdate]]] = mockTransaction.mock.calls
      expect(monitorUpdate.where).toEqual({ id: 'monitor-1' })
    })

    it('sets lastCheckedAt to approximately now', async () => {
      setupSocket('connect')
      mockFindUnique.mockResolvedValue(makeMonitor())
      const before = Date.now()

      await strategy.check('monitor-1')

      const [[[, monitorUpdate]]] = mockTransaction.mock.calls
      const checked: Date = monitorUpdate.data.lastCheckedAt
      expect(checked.getTime()).toBeGreaterThanOrEqual(before)
      expect(checked.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })
})
