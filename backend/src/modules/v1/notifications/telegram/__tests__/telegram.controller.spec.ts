import type { TelegramWebhookDto } from '../dto/telegram-webhook.dto'
import { TelegramController } from '../telegram.controller'
import type { TelegramService } from '../telegram.service'

const mockTelegramService = {
  linkChatId: vi.fn(),
  handleWebhook: vi.fn(),
  unlinkChatId: vi.fn(),
  toggleAlert: vi.fn(),
  getAlertStatus: vi.fn(),
}

describe('TelegramController', () => {
  let controller: TelegramController

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new TelegramController(mockTelegramService as unknown as TelegramService)
  })

  describe('linkChatId', () => {
    it('should call service with userId', async () => {
      mockTelegramService.linkChatId.mockResolvedValue('https://t.me/bot?start=token')

      await controller.linkChatId('user-123')

      expect(mockTelegramService.linkChatId).toHaveBeenCalledWith('user-123')
    })

    it('should return the deep link', async () => {
      mockTelegramService.linkChatId.mockResolvedValue('https://t.me/bot?start=token')

      const result = await controller.linkChatId('user-123')

      expect(result).toEqual({ link: 'https://t.me/bot?start=token' })
    })

    it('should propagate service errors', async () => {
      mockTelegramService.linkChatId.mockRejectedValue(new Error('Service error'))

      await expect(controller.linkChatId('user-123')).rejects.toThrow('Service error')
    })
  })

  describe('handleWebhook', () => {
    it('should call service with the webhook update', async () => {
      const mockUpdate = { message: { text: '/start token', chat: { id: 123 } } }
      mockTelegramService.handleWebhook.mockResolvedValue(undefined)

      await controller.handleWebhook(mockUpdate as TelegramWebhookDto)

      expect(mockTelegramService.handleWebhook).toHaveBeenCalledWith(mockUpdate)
    })

    it('should propagate service errors', async () => {
      const mockUpdate = { message: { text: '/start token', chat: { id: 123 } } }
      mockTelegramService.handleWebhook.mockRejectedValue(new Error('Webhook error'))

      await expect(controller.handleWebhook(mockUpdate as TelegramWebhookDto)).rejects.toThrow(
        'Webhook error',
      )
    })
  })

  describe('unlinkChatId', () => {
    it('should call service with userId', async () => {
      mockTelegramService.unlinkChatId.mockResolvedValue(undefined)

      await controller.unlinkChatId('user-123')

      expect(mockTelegramService.unlinkChatId).toHaveBeenCalledWith('user-123')
    })

    it('should return success message', async () => {
      mockTelegramService.unlinkChatId.mockResolvedValue(undefined)

      const result = await controller.unlinkChatId('user-123')

      expect(result).toEqual({ message: 'You have unsubscribed from Telegram notifications' })
    })

    it('should propagate service errors', async () => {
      mockTelegramService.unlinkChatId.mockRejectedValue(new Error('Service error'))

      await expect(controller.unlinkChatId('user-123')).rejects.toThrow('Service error')
    })
  })

  describe('toggleAlert', () => {
    it('should call service with userId', async () => {
      mockTelegramService.toggleAlert.mockResolvedValue(true)

      await controller.toggleAlert('user-123')

      expect(mockTelegramService.toggleAlert).toHaveBeenCalledWith('user-123')
    })

    it('should return enabled true with correct message', async () => {
      mockTelegramService.toggleAlert.mockResolvedValue(true)

      const result = await controller.toggleAlert('user-123')

      expect(result).toEqual({
        enabled: true,
        message: 'You have enabled Telegram notifications',
      })
    })

    it('should return enabled false with correct message', async () => {
      mockTelegramService.toggleAlert.mockResolvedValue(false)

      const result = await controller.toggleAlert('user-123')

      expect(result).toEqual({
        enabled: false,
        message: 'You have disabled Telegram notifications',
      })
    })

    it('should propagate service errors', async () => {
      mockTelegramService.toggleAlert.mockRejectedValue(new Error('Service error'))

      await expect(controller.toggleAlert('user-123')).rejects.toThrow('Service error')
    })
  })

  describe('getSettings', () => {
    it('should call service with userId', async () => {
      mockTelegramService.getAlertStatus.mockResolvedValue({ enabled: true, hasChat: true })

      await controller.getSettings('user-123')

      expect(mockTelegramService.getAlertStatus).toHaveBeenCalledWith('user-123')
    })

    it('should return enabled and hasChat status', async () => {
      mockTelegramService.getAlertStatus.mockResolvedValue({ enabled: false, hasChat: true })

      const result = await controller.getSettings('user-123')

      expect(result).toEqual({ enabled: false, hasChat: true })
    })

    it('should propagate service errors', async () => {
      mockTelegramService.getAlertStatus.mockRejectedValue(new Error('Service error'))

      await expect(controller.getSettings('user-123')).rejects.toThrow('Service error')
    })
  })
})
