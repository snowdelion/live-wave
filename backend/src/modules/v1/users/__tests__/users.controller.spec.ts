import { UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'

import { UsersController } from '../users.controller'

describe('UsersController', () => {
  let controller: UsersController
  let usersService: any

  beforeEach(() => {
    usersService = {
      signUpEmail: vi.fn(),
      signInEmail: vi.fn(),
      refreshAccessToken: vi.fn(),
      invalidateRefreshToken: vi.fn(),
      delete: vi.fn(),
    }

    controller = new UsersController(usersService)
  })

  describe('delete', () => {
    function createRequest(userId?: string): Request {
      return { user: userId ? { userId } : undefined } as unknown as Request
    }

    it('throws UnauthorizedException if req.user is missing', async () => {
      const req = createRequest(undefined)

      await expect(controller.delete(req)).rejects.toThrow(UnauthorizedException)
      expect(usersService.delete).not.toHaveBeenCalled()
    })

    it('throws UnauthorizedException if req.user.userId is missing', async () => {
      const req = { user: {} } as unknown as Request

      await expect(controller.delete(req)).rejects.toThrow(UnauthorizedException)
      expect(usersService.delete).not.toHaveBeenCalled()
    })

    it('calls usersService.delete with the userId when present', async () => {
      const req = createRequest('user-1')

      await controller.delete(req)

      expect(usersService.delete).toHaveBeenCalledWith('user-1')
    })

    it('propagates errors from usersService.delete', async () => {
      const req = createRequest('user-1')
      usersService.delete.mockRejectedValue(new Error('delete failed'))

      await expect(controller.delete(req)).rejects.toThrow('delete failed')
    })
  })
})
