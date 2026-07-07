import { UnauthorizedException } from '@nestjs/common'

import { UsersController } from '../users.controller'

const USER_ID = 'user-1'

describe('UsersController', () => {
  let controller: UsersController
  let usersService: any

  beforeEach(() => {
    usersService = {
      signUpEmail: vi.fn(),
      signInEmail: vi.fn(),
      refreshAccessToken: vi.fn(),
      invalidateRefreshToken: vi.fn(),
      getMe: vi.fn(),
      delete: vi.fn(),
    }

    controller = new UsersController(usersService)
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
      await expect(controller.delete(undefined as unknown as string)).rejects.toThrow(
        UnauthorizedException,
      )
      expect(usersService.delete).not.toHaveBeenCalled()
    })

    it('calls usersService.delete with the userId when present', async () => {
      await controller.delete(USER_ID)

      expect(usersService.delete).toHaveBeenCalledWith(USER_ID)
    })

    it('propagates errors from usersService.delete', async () => {
      usersService.delete.mockRejectedValue(new Error('delete failed'))

      await expect(controller.delete(USER_ID)).rejects.toThrow('delete failed')
    })
  })
})
