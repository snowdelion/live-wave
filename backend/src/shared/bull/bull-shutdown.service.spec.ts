import { Logger } from '@nestjs/common'
import type { Queue } from 'bull'

import { BullShutdownService } from './bull-shutdown.service'

const makeQueue = (closeImpl?: () => Promise<void>) =>
  ({
    close: vi.fn().mockImplementation(closeImpl ?? (() => Promise.resolve())),
  }) as unknown as Queue

describe('BullShutdownService', () => {
  let service: BullShutdownService
  let queue: Queue
  let logSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    queue = makeQueue()
    service = new BullShutdownService(queue)

    logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
  })

  describe('onApplicationShutdown', () => {
    it('closes the queue with force=true', async () => {
      await service.onApplicationShutdown()

      expect(queue.close).toHaveBeenCalledOnce()
      expect(queue.close).toHaveBeenCalledWith(true)
    })

    it('logs success when the queue closes cleanly', async () => {
      await service.onApplicationShutdown()

      expect(logSpy).toHaveBeenCalledWith('Bull queue closed successfully')
      expect(errorSpy).not.toHaveBeenCalled()
    })

    it('logs an error with message and stack when queue.close rejects with an Error', async () => {
      const err = new Error('connection lost')
      queue = makeQueue(() => Promise.reject(err))
      service = new BullShutdownService(queue)

      await service.onApplicationShutdown()

      expect(errorSpy).toHaveBeenCalledOnce()
      expect(errorSpy).toHaveBeenCalledWith(
        `Failed to close Bull queues on application shutdown: ${err.message}`,
        err.stack,
      )
      expect(logSpy).not.toHaveBeenCalled()
    })

    it('logs an error with "unknown error" and no stack when a non-Error is thrown', async () => {
      queue = makeQueue(() => Promise.reject('string rejection'))
      service = new BullShutdownService(queue)

      await service.onApplicationShutdown()

      expect(errorSpy).toHaveBeenCalledOnce()
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to close Bull queues on application shutdown: unknown error',
        undefined,
      )
    })

    it('does not throw even when queue.close rejects', async () => {
      queue = makeQueue(() => Promise.reject(new Error('boom')))
      service = new BullShutdownService(queue)

      await expect(service.onApplicationShutdown()).resolves.toBeUndefined()
    })
  })
})
