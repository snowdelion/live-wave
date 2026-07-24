import { UnauthorizedException } from '@nestjs/common'
import type { Response } from 'express'

import { UsersController } from '../users.controller'

const USER_ID = 'user-1'

describe('UsersController', () => {
  let controller: UsersController
  let usersService: any
  let cookieService: any

  beforeEach(() => {
    usersService = {
      getMe: vi.fn(),
      delete: vi.fn(),
    }

    cookieService = {
      clearRefreshToken: vi.fn(),
    }

    controller = new UsersController(usersService, cookieService)
  })

  describe('getMe', () => {
    it('calls usersService.getMe with the userId and returns its result', async () => {
      const formattedUser = {
        email: 'a@b.com',
        telegramId: '123',
        username: 'user',
        createdAt: new Date('2024-01-01'),
        isNotificationEnabled: true,
        monitorsCount: 2,
        checksCount: 5,
      }
      usersService.getMe.mockResolvedValue(formattedUser)

      const result = await controller.getMe(USER_ID)

      expect(usersService.getMe).toHaveBeenCalledWith(USER_ID)
      expect(result).toBe(formattedUser)
    })

    it('propagates errors from usersService.getMe', async () => {
      usersService.getMe.mockRejectedValue(new UnauthorizedException('User not found'))

      await expect(controller.getMe(USER_ID)).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('delete', () => {
    it('throws UnauthorizedException if userId is missing', async () => {
      const mockRes = {} as Response

      await expect(controller.delete(undefined as unknown as string, mockRes)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      )

      expect(usersService.delete).not.toHaveBeenCalled()
      expect(cookieService.clearRefreshToken).not.toHaveBeenCalled()
    })

    it('calls usersService.delete and clears refresh token when userId is present', async () => {
      const mockRes = {} as Response
      usersService.delete.mockResolvedValue(undefined)

      await controller.delete(USER_ID, mockRes)

      expect(usersService.delete).toHaveBeenCalledWith(USER_ID)
      expect(cookieService.clearRefreshToken).toHaveBeenCalledWith(mockRes)
    })

    it('propagates errors from usersService.delete and does not clear refresh token', async () => {
      const mockRes = {} as Response
      usersService.delete.mockRejectedValue(new Error('delete failed'))

      await expect(controller.delete(USER_ID, mockRes)).rejects.toThrow('delete failed')

      expect(usersService.delete).toHaveBeenCalledWith(USER_ID)
      expect(cookieService.clearRefreshToken).not.toHaveBeenCalled()
    })
  })
})
