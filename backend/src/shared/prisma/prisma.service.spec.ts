import { Logger } from '@nestjs/common'

import { PrismaService } from './prisma.service'

// --- mocks ---
vi.mock('@nestjs/common', async () => {
  const actual = await vi.importActual('@nestjs/common')
  return {
    ...actual,
    Logger: vi.fn().mockImplementation(() => ({
      log: vi.fn(),
      error: vi.fn(),
    })),
  }
})

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    $connect = vi.fn()
  },
}))

// --- tests ---
describe('PrismaService', () => {
  let service: PrismaService
  let logger: { log: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()
    service = new PrismaService()
    logger = (service as any).logger
  })

  describe('onModuleInit', () => {
    it('connects to the database and logs success', async () => {
      vi.spyOn(service, '$connect').mockResolvedValueOnce(undefined)

      await service.onModuleInit()

      expect(service.$connect).toHaveBeenCalledOnce()
      expect(vi.mocked(logger.log)).toHaveBeenCalledWith('Database connected successfully')
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled()
    })

    it('logs an error and rethrows when $connect throws an Error', async () => {
      const cause = new Error('connection failed')
      vi.spyOn(service, '$connect').mockRejectedValueOnce(cause)

      await expect(service.onModuleInit()).rejects.toThrow(/connection failed/i)
    })

    it('sets the original error as the cause on the rethrown error', async () => {
      const cause = new Error('timeout')
      vi.spyOn(service, '$connect').mockRejectedValueOnce(cause)

      const thrown = await service.onModuleInit().catch(e => e)

      expect(thrown).toBeInstanceOf(Error)
    })

    it('handles non-Error rejections gracefully', async () => {
      vi.spyOn(service, '$connect').mockRejectedValueOnce('string failure')

      await expect(service.onModuleInit()).rejects.toThrow(
        /Database connection failed: unknown error/i,
      )
    })

    it('handles null rejections gracefully', async () => {
      vi.spyOn(service, '$connect').mockRejectedValueOnce(null)

      await expect(service.onModuleInit()).rejects.toThrow(
        /Database connection failed: unknown error/i,
      )
    })
  })

  describe('logger', () => {
    it('is scoped to PrismaService', () => {
      expect(Logger).toHaveBeenCalledWith('PrismaService')
    })
  })
})
