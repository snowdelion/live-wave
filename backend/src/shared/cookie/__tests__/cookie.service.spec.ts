import type { Response } from 'express'

import { CookieService } from '../cookie.service'

describe('CookieService', () => {
  let configService: any
  let res: Partial<Response> & { cookie: any; clearCookie: any }

  beforeEach(() => {
    res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    }
  })

  function createService(nodeEnv: string | undefined) {
    configService = {
      get: vi.fn((key: string) => {
        if (key === 'NODE_ENV') return nodeEnv
        return undefined
      }),
    }
    return new CookieService(configService)
  }

  describe('constructor', () => {
    it('sets isProduction to true when NODE_ENV is "production"', () => {
      const service = createService('production')

      service.setRefreshToken(res as Response, 'token')

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'token',
        expect.objectContaining({ secure: true }),
      )
    })

    it('sets isProduction to false when NODE_ENV is not "production"', () => {
      const service = createService('development')

      service.setRefreshToken(res as Response, 'token')

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'token',
        expect.objectContaining({ secure: false }),
      )
    })

    it('sets isProduction to false when NODE_ENV is undefined', () => {
      const service = createService(undefined)

      service.setRefreshToken(res as Response, 'token')

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'token',
        expect.objectContaining({ secure: false }),
      )
    })
  })

  describe('setRefreshToken', () => {
    it('sets a cookie named "refreshToken" with the provided value', () => {
      const service = createService('development')

      service.setRefreshToken(res as Response, 'my-refresh-token')

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'my-refresh-token',
        expect.any(Object),
      )
    })

    it('sets httpOnly to true', () => {
      const service = createService('development')

      service.setRefreshToken(res as Response, 'token')

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'token',
        expect.objectContaining({ httpOnly: true }),
      )
    })

    it('sets sameSite to "lax"', () => {
      const service = createService('development')

      service.setRefreshToken(res as Response, 'token')

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'token',
        expect.objectContaining({ sameSite: 'lax' }),
      )
    })

    it('sets maxAge to 7 days in milliseconds', () => {
      const service = createService('development')

      service.setRefreshToken(res as Response, 'token')

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'token',
        expect.objectContaining({ maxAge: 7 * 24 * 60 * 60 * 1000 }),
      )
    })

    it('calls res.cookie exactly once', () => {
      const service = createService('production')

      service.setRefreshToken(res as Response, 'token')

      expect(res.cookie).toHaveBeenCalledTimes(1)
    })
  })

  describe('clearRefreshToken', () => {
    it('clears the cookie named "refreshToken" with path "/"', () => {
      const service = createService('development')

      service.clearRefreshToken(res as Response)

      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/' })
    })

    it('calls res.clearCookie exactly once', () => {
      const service = createService('production')

      service.clearRefreshToken(res as Response)

      expect(res.clearCookie).toHaveBeenCalledTimes(1)
    })

    it('does not call res.cookie when clearing', () => {
      const service = createService('development')

      service.clearRefreshToken(res as Response)

      expect(res.cookie).not.toHaveBeenCalled()
    })
  })
})
