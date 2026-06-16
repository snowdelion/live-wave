import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TelegramController } from '../telegram.controller'
import type { TelegramService } from '../telegram.service'

const mockTelegramService = {
  linkChatId: vi.fn(),
  unlinkChatId: vi.fn(),
  toggleAlert: vi.fn(),
}

describe('TelegramController', () => {
  let controller: TelegramController

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new TelegramController(mockTelegramService as unknown as TelegramService)
  })

  describe('linkChatId', () => {
    it('should call service with clientId and chatId', async () => {
      mockTelegramService.linkChatId.mockResolvedValue(undefined)

      await controller.linkChatId('client-123', { chatId: 'chat-456' })

      expect(mockTelegramService.linkChatId).toHaveBeenCalledWith('client-123', 'chat-456')
    })

    it('should return success message', async () => {
      mockTelegramService.linkChatId.mockResolvedValue(undefined)

      const result = await controller.linkChatId('client-123', { chatId: 'chat-456' })

      expect(result).toEqual({ message: 'You have subscribed for Telegram notifications' })
    })

    it('should propagate service errors', async () => {
      mockTelegramService.linkChatId.mockRejectedValue(new Error('Service error'))

      await expect(controller.linkChatId('client-123', { chatId: 'chat-456' })).rejects.toThrow(
        'Service error',
      )
    })
  })

  describe('unlinkChatId', () => {
    it('should call service with clientId', async () => {
      mockTelegramService.unlinkChatId.mockResolvedValue(undefined)

      await controller.unlinkChatId('client-123')

      expect(mockTelegramService.unlinkChatId).toHaveBeenCalledWith('client-123')
    })

    it('should return success message', async () => {
      mockTelegramService.unlinkChatId.mockResolvedValue(undefined)

      const result = await controller.unlinkChatId('client-123')

      expect(result).toEqual({ message: 'You have unsubscribed from Telegram notifications' })
    })

    it('should propagate service errors', async () => {
      mockTelegramService.unlinkChatId.mockRejectedValue(new Error('Service error'))

      await expect(controller.unlinkChatId('client-123')).rejects.toThrow('Service error')
    })
  })

  describe('toggleAlert', () => {
    it('should call service with clientId', async () => {
      mockTelegramService.toggleAlert.mockResolvedValue(true)

      await controller.toggleAlert('client-123')

      expect(mockTelegramService.toggleAlert).toHaveBeenCalledWith('client-123')
    })

    it('should return enabled true with correct message', async () => {
      mockTelegramService.toggleAlert.mockResolvedValue(true)

      const result = await controller.toggleAlert('client-123')

      expect(result).toEqual({
        enabled: true,
        message: 'You have enabled Telegram notifications',
      })
    })

    it('should return enabled false with correct message', async () => {
      mockTelegramService.toggleAlert.mockResolvedValue(false)

      const result = await controller.toggleAlert('client-123')

      expect(result).toEqual({
        enabled: false,
        message: 'You have disabled Telegram notifications',
      })
    })

    it('should propagate service errors', async () => {
      mockTelegramService.toggleAlert.mockRejectedValue(new Error('Service error'))

      await expect(controller.toggleAlert('client-123')).rejects.toThrow('Service error')
    })
  })
})
