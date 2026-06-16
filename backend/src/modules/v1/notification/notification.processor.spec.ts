import { Logger } from '@nestjs/common'
import type { Job } from 'bullmq'

import { NotificationProcessor } from './notification.processor'
import type { TelegramService } from './telegram/telegram.service'

const CHAT_ID = 'chat-123'
const MESSAGE = 'Monitor "My Monitor" is DOWN'
const STATUS_TYPE = 'down'
const MONITOR_NAME = 'My Monitor'

type NotificationJobData = {
  chatId: string
  message: string
  statusType: string
  monitorName: string
}

function makeJob(overrides: Partial<NotificationJobData> = {}): Job<NotificationJobData> {
  return {
    data: {
      chatId: CHAT_ID,
      message: MESSAGE,
      statusType: STATUS_TYPE,
      monitorName: MONITOR_NAME,
      ...overrides,
    },
  } as Job<NotificationJobData>
}

const mockTelegramService = {
  sendMessage: vi.fn(),
} satisfies Partial<TelegramService> as unknown as TelegramService

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    vi.mocked(mockTelegramService.sendMessage).mockResolvedValue(true)

    processor = new NotificationProcessor(mockTelegramService)
  })

  describe('process', () => {
    it('delegates to TelegramService with chatId and message from job data', async () => {
      await processor.process(makeJob())

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(CHAT_ID, MESSAGE)
    })

    it('completes without error when sendMessage succeeds', async () => {
      await expect(processor.process(makeJob())).resolves.toBeUndefined()
    })

    it('logs an error and throws when sendMessage returns false', async () => {
      vi.mocked(mockTelegramService.sendMessage).mockResolvedValueOnce(false)

      await expect(processor.process(makeJob())).rejects.toThrow('Failed to send Telegram message')

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Failed to send Telegram message for monitor "${MONITOR_NAME}" (${STATUS_TYPE})`,
      )
    })

    it('propagates when sendMessage throws', async () => {
      const err = new Error('Telegram API unavailable')
      vi.mocked(mockTelegramService.sendMessage).mockRejectedValueOnce(err)

      await expect(processor.process(makeJob())).rejects.toThrow('Telegram API unavailable')
    })
  })
})
