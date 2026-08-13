import type { Queue } from 'bullmq'

import type { Logger } from '@/shared/logger/logger.service'

import { BullShutdownService } from './bull-shutdown.service'

const makeQueue = (closeImpl?: () => Promise<void>) =>
  ({
    close: vi.fn().mockImplementation(closeImpl ?? (() => Promise.resolve())),
  }) as unknown as Queue

const mockLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger),
} as unknown as Logger

describe('BullShutdownService', () => {
  let service: BullShutdownService
  let queue: Queue

  beforeEach(() => {
    queue = makeQueue()
    service = new BullShutdownService(queue, mockLogger)
  })

  describe('onApplicationShutdown', () => {
    it('closes the queue with force=true', async () => {
      await service.onApplicationShutdown()

      expect(queue.close).toHaveBeenCalledOnce()
    })

    it('does not throw even when queue.close rejects', async () => {
      queue = makeQueue(() => Promise.reject(new Error('boom')))
      service = new BullShutdownService(queue, mockLogger)

      await expect(service.onApplicationShutdown()).resolves.toBeUndefined()
    })
  })
})
