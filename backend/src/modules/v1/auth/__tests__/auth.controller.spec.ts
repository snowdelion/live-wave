import { UnauthorizedException } from '@nestjs/common'
import type { Request, Response } from 'express'

import type { CookieService } from '@/backend/shared/cookie/cookie.service'

import { AuthController } from '../auth.controller'
import type { AuthService } from '../auth.service'

describe('AuthController', () => {
  let controller: AuthController
  let authService: any
  let cookieService: any
  let res: Partial<Response>

  beforeEach(() => {
    authService = {
      signUpEmail: vi.fn(),
      signInEmail: vi.fn(),
      refreshAccessToken: vi.fn(),
      invalidateRefreshToken: vi.fn(),
      delete: vi.fn(),
    }

    cookieService = {
      setRefreshToken: vi.fn(),
      clearRefreshToken: vi.fn(),
    }

    res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    }

    controller = new AuthController(authService as AuthService, cookieService as CookieService)
  })

  describe('signUpEmail', () => {
    const dto = { email: 'test@example.com', password: 'password123' }

    it('sets the refresh token cookie and returns the access token', async () => {
      authService.signUpEmail.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })

      const result = await controller.signUpEmail(dto as any, res as Response)

      expect(authService.signUpEmail).toHaveBeenCalledWith(dto)
      expect(cookieService.setRefreshToken).toHaveBeenCalledWith(res, 'refresh-token')
      expect(result).toEqual({ accessToken: 'access-token' })
    })

    it('propagates errors from authService.signUpEmail', async () => {
      authService.signUpEmail.mockRejectedValue(new Error('signup failed'))

      await expect(controller.signUpEmail(dto as any, res as Response)).rejects.toThrow(
        'signup failed',
      )
      expect(cookieService.setRefreshToken).not.toHaveBeenCalled()
    })
  })

  describe('signInEmail', () => {
    const dto = { email: 'test@example.com', password: 'password123' }

    it('sets the refresh token cookie and returns the access token', async () => {
      authService.signInEmail.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })

      const result = await controller.signInEmail(dto as any, res as Response)

      expect(authService.signInEmail).toHaveBeenCalledWith(dto)
      expect(cookieService.setRefreshToken).toHaveBeenCalledWith(res, 'refresh-token')
      expect(result).toEqual({ accessToken: 'access-token' })
    })

    it('propagates errors from authService.signInEmail', async () => {
      authService.signInEmail.mockRejectedValue(new Error('bad credentials'))

      await expect(controller.signInEmail(dto as any, res as Response)).rejects.toThrow(
        'bad credentials',
      )
      expect(cookieService.setRefreshToken).not.toHaveBeenCalled()
    })
  })

  describe('refreshToken', () => {
    it('throws UnauthorizedException if refreshToken cookie is missing', async () => {
      await expect(controller.refreshToken(undefined as any)).rejects.toThrow(UnauthorizedException)
      expect(authService.refreshAccessToken).not.toHaveBeenCalled()
    })

    it('throws UnauthorizedException if refreshToken cookie is an empty string', async () => {
      await expect(controller.refreshToken('')).rejects.toThrow(UnauthorizedException)
      expect(authService.refreshAccessToken).not.toHaveBeenCalled()
    })

    it('returns a new access token when refresh token is present', async () => {
      authService.refreshAccessToken.mockResolvedValue({ accessToken: 'new-access-token' })

      const result = await controller.refreshToken('refresh-token')

      expect(authService.refreshAccessToken).toHaveBeenCalledWith('refresh-token')
      expect(result).toEqual({ accessToken: 'new-access-token' })
    })

    it('propagates errors from authService.refreshAccessToken', async () => {
      authService.refreshAccessToken.mockRejectedValue(new UnauthorizedException('invalid'))

      await expect(controller.refreshToken('bad-token')).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('logOut', () => {
    it('invalidates the refresh token and clears the cookie when token is present', async () => {
      await controller.logOut('refresh-token', res as Response)

      expect(authService.invalidateRefreshToken).toHaveBeenCalledWith('refresh-token')
      expect(cookieService.clearRefreshToken).toHaveBeenCalledWith(res)
    })

    it('clears the cookie but does not invalidate when no refresh token is present', async () => {
      await controller.logOut(undefined as any, res as Response)

      expect(authService.invalidateRefreshToken).not.toHaveBeenCalled()
      expect(cookieService.clearRefreshToken).toHaveBeenCalledWith(res)
    })

    it('clears the cookie even when refresh token is an empty string', async () => {
      await controller.logOut('', res as Response)

      expect(authService.invalidateRefreshToken).not.toHaveBeenCalled()
      expect(cookieService.clearRefreshToken).toHaveBeenCalledWith(res)
    })

    it('propagates errors from authService.invalidateRefreshToken and skips clearing cookie', async () => {
      authService.invalidateRefreshToken.mockRejectedValue(new Error('redis down'))

      await expect(controller.logOut('refresh-token', res as Response)).rejects.toThrow(
        'redis down',
      )
      expect(cookieService.clearRefreshToken).not.toHaveBeenCalled()
    })
  })
})
