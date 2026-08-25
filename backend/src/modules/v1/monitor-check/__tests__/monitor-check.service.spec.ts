import { StatusEnum } from '@prisma/client'

import type { Logger } from '@/shared/logger/logger.service'

import type { TelegramService } from '../../notifications/telegram/telegram.service'
import { MonitorCheckService } from '../monitor-check.service'

vi.mock('@/shared/utils/error.utils', () => ({
  getErrorMessage: vi.fn((e: any, fallback?: string) =>
    e instanceof Error ? e.message : fallback || String(e),
  ),
}))

describe('MonitorCheckService', () => {
  let service: MonitorCheckService
  let mockTelegramService: any
  let mockLogger: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockTelegramService = {
      sendMessage: vi.fn().mockResolvedValue(true),
    }

    mockLogger = {
      child: vi.fn().mockReturnThis(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      log: vi.fn(),
    }

    service = new MonitorCheckService(
      mockTelegramService as unknown as TelegramService,
      mockLogger as unknown as Logger,
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('scheduleNotification', () => {
    const basePayload = {
      chatId: 'chat-1',
      monitorId: 'monitor-1',
      message: 'Monitor is down',
      statusType: StatusEnum.down,
    }

    it('should send notification on first call', async () => {
      await service.scheduleNotification(basePayload)

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith('chat-1', 'Monitor is down')
      expect(mockLogger.debug).toHaveBeenCalledWith('Notification sent', {
        monitorId: 'monitor-1',
        chatId: 'chat-1',
      })
    })

    it('should deduplicate notifications within TTL (5 minutes)', async () => {
      await service.scheduleNotification(basePayload)
      mockTelegramService.sendMessage.mockClear()

      await service.scheduleNotification(basePayload)

      expect(mockTelegramService.sendMessage).not.toHaveBeenCalled()
      expect(mockLogger.debug).toHaveBeenCalledWith('Notification deduplicated, skipping', {
        monitorId: 'monitor-1',
        chatId: 'chat-1',
        statusType: StatusEnum.down,
        lastSent: expect.any(String),
      })
    })

    it('should allow notification after TTL expires', async () => {
      await service.scheduleNotification(basePayload)
      mockTelegramService.sendMessage.mockClear()

      vi.advanceTimersByTime(5 * 60 * 1000 + 1)

      await service.scheduleNotification(basePayload)

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith('chat-1', 'Monitor is down')
    })

    it('should allow different status types for same monitor/chat', async () => {
      await service.scheduleNotification(basePayload)
      mockTelegramService.sendMessage.mockClear()

      await service.scheduleNotification({
        ...basePayload,
        statusType: StatusEnum.up,
      })

      expect(mockTelegramService.sendMessage).toHaveBeenCalled()
    })

    it('should allow different monitors for same chat/status', async () => {
      await service.scheduleNotification(basePayload)
      mockTelegramService.sendMessage.mockClear()

      await service.scheduleNotification({
        ...basePayload,
        monitorId: 'monitor-2',
      })

      expect(mockTelegramService.sendMessage).toHaveBeenCalled()
    })

    it('should retry up to 3 times on failure', async () => {
      mockTelegramService.sendMessage
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(true)

      const promise = service.scheduleNotification(basePayload)

      await vi.advanceTimersByTimeAsync(2000)
      await vi.advanceTimersByTimeAsync(4000)

      await promise

      expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(3)
      expect(mockLogger.warn).toHaveBeenCalledTimes(2)
      expect(mockLogger.debug).toHaveBeenCalledWith('Notification sent', expect.any(Object))
    })

    it('should log error after all retries fail', async () => {
      mockTelegramService.sendMessage.mockRejectedValue(new Error('Permanent failure'))

      const promise = service.scheduleNotification(basePayload)

      await vi.advanceTimersByTimeAsync(2000)
      await vi.advanceTimersByTimeAsync(4000)

      await promise

      expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(3)
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to send notification after retries', {
        monitorId: 'monitor-1',
        error: 'Permanent failure',
      })
    })

    it('should not cache timestamp when all retries fail', async () => {
      mockTelegramService.sendMessage.mockRejectedValue(new Error('Permanent failure'))

      const promise1 = service.scheduleNotification(basePayload)
      await vi.advanceTimersByTimeAsync(2000)
      await vi.advanceTimersByTimeAsync(4000)
      await promise1

      mockTelegramService.sendMessage.mockClear()

      const promise2 = service.scheduleNotification(basePayload)
      await vi.advanceTimersByTimeAsync(2000)
      await vi.advanceTimersByTimeAsync(4000)
      await promise2

      expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(3)
    })
  })

  describe('cleanupCache', () => {
    it('should cleanup expired entries when cache exceeds 100 items', async () => {
      for (let i = 0; i < 101; i++) {
        await service.scheduleNotification({
          chatId: `chat-${i}`,
          monitorId: `monitor-${i}`,
          message: `Message ${i}`,
          statusType: StatusEnum.down,
        })
      }

      vi.advanceTimersByTime(5 * 60 * 1000 + 1)

      await service.scheduleNotification({
        chatId: 'chat-new',
        monitorId: 'monitor-new',
        message: 'New message',
        statusType: StatusEnum.down,
      })

      mockTelegramService.sendMessage.mockClear()
      await service.scheduleNotification({
        chatId: 'chat-0',
        monitorId: 'monitor-0',
        message: 'Message 0',
        statusType: StatusEnum.down,
      })

      expect(mockTelegramService.sendMessage).toHaveBeenCalled()
    })

    it('should keep cache entries when under 100 items even after TTL', async () => {
      for (let i = 0; i < 50; i++) {
        await service.scheduleNotification({
          chatId: `chat-${i}`,
          monitorId: `monitor-${i}`,
          message: `Message ${i}`,
          statusType: StatusEnum.down,
        })
      }

      vi.advanceTimersByTime(5 * 60 * 1000 + 1)

      const cacheSizeBefore = (service as any).sentNotificationsMap.size

      await service.scheduleNotification({
        chatId: 'chat-new',
        monitorId: 'monitor-new',
        message: 'New message',
        statusType: StatusEnum.down,
      })

      const cacheSizeAfter = (service as any).sentNotificationsMap.size

      expect(cacheSizeAfter).toBe(cacheSizeBefore + 1)
    })
  })

  describe('sendWithRetry', () => {
    it('should wait with exponential backoff between retries', async () => {
      mockTelegramService.sendMessage
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce(true)

      const promise = service.scheduleNotification({
        chatId: 'chat-1',
        monitorId: 'monitor-1',
        message: 'Test',
        statusType: StatusEnum.down,
      })

      await vi.advanceTimersByTimeAsync(1999)
      expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(1)
      expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(2)

      await promise
    })
  })
})
