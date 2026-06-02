import { HttpException, HttpStatus } from '@nestjs/common'
import type { ExecutionContext } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RATE_LIMIT_RULES } from '../rate-limit.constants'
import type { RateLimitService } from '../rate-limit.service'

import { RateLimitGuard } from './rate-limit.guard'

const mockCheckRules = vi.fn()

const mockRateLimitService = {
  checkRules: mockCheckRules,
} as unknown as RateLimitService

function buildContext(ip?: string, remoteAddress?: string): ExecutionContext {
  const req = {
    ip,
    socket: { remoteAddress },
  }
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
  } as unknown as ExecutionContext
}

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard

  beforeEach(() => {
    vi.clearAllMocks()
    guard = new RateLimitGuard(mockRateLimitService)
  })

  describe('canActivate', () => {
    it('returns true when rate limit is not exceeded', async () => {
      mockCheckRules.mockResolvedValue(true)

      const result = await guard.canActivate(buildContext('1.2.3.4'))

      expect(result).toBe(true)
    })

    it('throws TOO_MANY_REQUESTS when limit is exceeded', async () => {
      mockCheckRules.mockResolvedValue(false)

      await expect(guard.canActivate(buildContext('1.2.3.4'))).rejects.toThrow(
        new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS),
      )
    })

    it('uses req.ip as the key source when available', async () => {
      mockCheckRules.mockResolvedValue(true)

      await guard.canActivate(buildContext('5.6.7.8', '9.9.9.9'))

      expect(mockCheckRules).toHaveBeenCalledWith(
        'live-wave:rate-limit:create-monitor:5.6.7.8',
        RATE_LIMIT_RULES.CREATE_MONITOR,
      )
    })

    it('falls back to socket.remoteAddress when req.ip is absent', async () => {
      mockCheckRules.mockResolvedValue(true)

      await guard.canActivate(buildContext(undefined, '9.9.9.9'))

      expect(mockCheckRules).toHaveBeenCalledWith(
        'live-wave:rate-limit:create-monitor:9.9.9.9',
        RATE_LIMIT_RULES.CREATE_MONITOR,
      )
    })

    it('falls back to "unknown" when both ip sources are absent', async () => {
      mockCheckRules.mockResolvedValue(true)

      await guard.canActivate(buildContext(undefined, undefined))

      expect(mockCheckRules).toHaveBeenCalledWith(
        'live-wave:rate-limit:create-monitor:unknown',
        RATE_LIMIT_RULES.CREATE_MONITOR,
      )
    })

    it('passes CREATE_MONITOR rules to checkRules', async () => {
      mockCheckRules.mockResolvedValue(true)

      await guard.canActivate(buildContext('1.1.1.1'))

      expect(mockCheckRules).toHaveBeenCalledWith(
        expect.any(String),
        RATE_LIMIT_RULES.CREATE_MONITOR,
      )
    })
  })
})
