import { type Monitor, StatusEnum } from '@prisma/client'
import type { Queue, Job } from 'bull'

import { BULL_KEYS, BULL_NAMES } from '@/backend/shared/bull/bull.constants'
import type { PrismaService } from '@/backend/shared/prisma/prisma.service'

import { MonitorCheckProcessor } from '../monitor-check.processor'

// --- helpers ---
function makeMonitor(overrides: Partial<Monitor> = {}): Monitor {
  return {
    id: 'monitor-1',
    url: 'https://example.com',
    method: 'HEAD',
    checkInterval: 5,
    timeout: 5000,
    lastStatus: StatusEnum.up,
    lastCheckedAt: null,
    nextCheckAt: null,
    ...overrides,
  } as Monitor
}

function makeJob(monitor: Monitor): Job<Monitor> {
  return { data: monitor } as Job<Monitor>
}

// --- mocks ---
const mockPrisma = {
  monitor: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  check: {
    create: vi.fn(),
  },
} as unknown as PrismaService

const mockQueue = {
  add: vi.fn(),
} satisfies Partial<Queue<Monitor>> as unknown as Queue<Monitor>

// --- tests ---
describe('MonitorCheckProcessor', () => {
  let processor: MonitorCheckProcessor

  beforeEach(() => {
    vi.clearAllMocks()
    processor = new MonitorCheckProcessor(mockPrisma, mockQueue)
  })

  describe('handleCheck', () => {
    it('skips when monitor is not found in DB', async () => {
      mockPrisma.monitor.findUnique = vi.fn().mockResolvedValue(null)

      await processor.handleCheck(makeJob(makeMonitor()))

      expect(mockPrisma.check.create).not.toHaveBeenCalled()
      expect(mockQueue.add).not.toHaveBeenCalled()
    })

    it('performs check and re-queues when monitor exists', async () => {
      const monitor = makeMonitor()
      mockPrisma.monitor.findUnique = vi.fn().mockResolvedValue(monitor)
      mockPrisma.check.create = vi.fn().mockResolvedValue({})
      mockPrisma.monitor.update = vi.fn().mockResolvedValue(monitor)
      mockQueue.add = vi.fn().mockResolvedValue({})

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as Response)

      await processor.handleCheck(makeJob(monitor))

      expect(mockPrisma.check.create).toHaveBeenCalledOnce()
      expect(mockQueue.add).toHaveBeenCalledWith(
        BULL_NAMES.CHECK,
        monitor,
        expect.objectContaining({
          jobId: expect.stringContaining(BULL_KEYS.RAW_CHECK(monitor.id)),
          delay: monitor.checkInterval * 60 * 1000,
        }),
      )
    })

    it('does not throw when an unexpected error occurs', async () => {
      mockPrisma.monitor.findUnique = vi.fn().mockRejectedValue(new Error('DB exploded'))

      await expect(processor.handleCheck(makeJob(makeMonitor()))).resolves.toBeUndefined()
    })

    it('does not throw when a non-Error value is thrown (covers isError=false branch)', async () => {
      mockPrisma.monitor.findUnique = vi.fn().mockRejectedValue('plain string rejection')

      await expect(processor.handleCheck(makeJob(makeMonitor()))).resolves.toBeUndefined()
    })
  })

  describe('performCheck - successful HTTP response', () => {
    const monitor = makeMonitor()

    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response)
      mockPrisma.check.create = vi.fn().mockResolvedValue({})
      mockPrisma.monitor.update = vi.fn().mockResolvedValue(monitor)
    })

    it('creates a check record with status up and correct statusCode', async () => {
      await (processor as any).performCheck(monitor)

      expect(mockPrisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            monitorId: monitor.id,
            status: StatusEnum.up,
            statusCode: 200,
            error: null,
          }),
        }),
      )
    })

    it('records a non-null responseTime', async () => {
      await (processor as any).performCheck(monitor)

      const { data } = (mockPrisma.check.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(data.responseTime).toBeGreaterThanOrEqual(0)
    })

    it('updates lastCheckedAt on the monitor', async () => {
      await (processor as any).performCheck(monitor)

      expect(mockPrisma.monitor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lastCheckedAt: expect.any(Date) }),
        }),
      )
    })

    it('updates nextCheckAt based on checkInterval', async () => {
      const before = Date.now()
      await (processor as any).performCheck(monitor)
      const after = Date.now()

      const calls = (mockPrisma.monitor.update as ReturnType<typeof vi.fn>).mock.calls
      const nextCheckCall = calls.find((c: any) => c[0].data.nextCheckAt)
      expect(nextCheckCall).toBeDefined()
      if (!nextCheckCall) return

      const { nextCheckAt } = nextCheckCall[0].data
      const expectedMin = before + monitor.checkInterval * 60 * 1000
      const expectedMax = after + monitor.checkInterval * 60 * 1000
      expect(nextCheckAt.getTime()).toBeGreaterThanOrEqual(expectedMin)
      expect(nextCheckAt.getTime()).toBeLessThanOrEqual(expectedMax)
    })

    it('updates lastStatus when it has changed', async () => {
      const downMonitor = makeMonitor({ lastStatus: StatusEnum.down })
      await (processor as any).performCheck(downMonitor)

      expect(mockPrisma.monitor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lastStatus: StatusEnum.up }),
        }),
      )
    })

    it('does NOT update lastStatus when it has not changed', async () => {
      const upMonitor = makeMonitor({ lastStatus: StatusEnum.up })
      await (processor as any).performCheck(upMonitor)

      const calls = (mockPrisma.monitor.update as ReturnType<typeof vi.fn>).mock.calls
      const statusUpdateCall = calls.find((c: any) => 'lastStatus' in (c[0].data ?? {}))
      expect(statusUpdateCall).toBeUndefined()
    })
  })

  describe('performCheck - non-ok HTTP response', () => {
    it('records status down for a 500 response', async () => {
      const monitor = makeMonitor()
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response)
      mockPrisma.check.create = vi.fn().mockResolvedValue({})
      mockPrisma.monitor.update = vi.fn().mockResolvedValue(monitor)

      await (processor as any).performCheck(monitor)

      expect(mockPrisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: StatusEnum.down,
            statusCode: 500,
          }),
        }),
      )
    })
  })

  describe('performCheck - fetch throws', () => {
    it('records status down and sets error message', async () => {
      const monitor = makeMonitor()
      global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'))
      mockPrisma.check.create = vi.fn().mockResolvedValue({})
      mockPrisma.monitor.update = vi.fn().mockResolvedValue(monitor)

      await (processor as any).performCheck(monitor)

      expect(mockPrisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: StatusEnum.down,
            error: 'Network failure',
            statusCode: null,
          }),
        }),
      )
    })

    it('uses fallback message when thrown value is not an Error', async () => {
      const monitor = makeMonitor()
      global.fetch = vi.fn().mockRejectedValue('plain string error')
      mockPrisma.check.create = vi.fn().mockResolvedValue({})
      mockPrisma.monitor.update = vi.fn().mockResolvedValue(monitor)

      await (processor as any).performCheck(monitor)

      expect(mockPrisma.check.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ error: 'Timeout or network error' }),
        }),
      )
    })
  })

  describe('performCheck - prisma errors', () => {
    it('silently skips when check.create throws P2003 (foreign key miss)', async () => {
      const monitor = makeMonitor()
      global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response)

      const p2003 = Object.assign(new Error('Foreign key constraint'), { code: 'P2003' })
      mockPrisma.check.create = vi.fn().mockRejectedValue(p2003)

      await expect((processor as any).performCheck(monitor)).resolves.toBeUndefined()
      expect(mockPrisma.monitor.update).not.toHaveBeenCalled()
    })

    it('logs but does not throw for other prisma errors', async () => {
      const monitor = makeMonitor()
      global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response)
      mockPrisma.check.create = vi.fn().mockRejectedValue(new Error('Connection lost'))

      await expect((processor as any).performCheck(monitor)).resolves.toBeUndefined()
    })

    it('does not throw when a non-Error value is thrown from prisma (covers isError=false branch)', async () => {
      const monitor = makeMonitor()
      global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response)
      mockPrisma.check.create = vi.fn().mockRejectedValue({ weird: 'object' })

      await expect((processor as any).performCheck(monitor)).resolves.toBeUndefined()
    })
  })
})
