import { HttpException, HttpStatus } from '@nestjs/common'
import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionController } from '../session.controller'
import type { SessionService } from '../session.service'

const mockSessionService = {
  getSession: vi.fn(),
  extendSession: vi.fn(),
  deleteSession: vi.fn(),
  updateNotificationSettings: vi.fn(),
} satisfies Partial<Record<keyof SessionService, ReturnType<typeof vi.fn>>>

function makeReq(cookies: Record<string, string> = {}): Request {
  return { cookies } as unknown as Request
}

type ExtendResponse = Response & {
  clearCookie: ReturnType<typeof vi.fn>
  send: ReturnType<typeof vi.fn>
}
function makeRes(): ExtendResponse {
  return {
    clearCookie: vi.fn(),
    send: vi.fn(),
  } as unknown as ExtendResponse
}

describe('SessionController', () => {
  let controller: SessionController

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new SessionController(mockSessionService as unknown as SessionService)
  })

  // GET /v1/session/me
  describe('getSession', () => {
    it('returns { exists: false } when clientId cookie is missing', async () => {
      const result = await controller.getSession(makeReq())
      expect(result).toEqual({ exists: false })
      expect(mockSessionService.getSession).not.toHaveBeenCalled()
    })

    it('returns { exists: false } when session is not found', async () => {
      mockSessionService.getSession.mockResolvedValue(null)
      const result = await controller.getSession(makeReq({ clientId: 'client' }))
      expect(result).toEqual({ exists: false })
    })

    it('returns session data when session exists', async () => {
      mockSessionService.getSession.mockResolvedValue({
        servicesCount: 3,
        telegramChatId: 1,
      })
      const result = await controller.getSession(makeReq({ clientId: 'client' }))
      expect(result).toEqual({ exists: true, servicesCount: 3, telegramLinked: true })
    })

    it('defaults servicesCount to 0 when null', async () => {
      mockSessionService.getSession.mockResolvedValue({
        servicesCount: null,
        telegramChatId: null,
      })
      const result = await controller.getSession(makeReq({ clientId: 'client' }))
      expect(result).toEqual({ exists: true, servicesCount: 0, telegramLinked: false })
    })

    it('sets telegramLinked to false when telegramChatId is absent', async () => {
      mockSessionService.getSession.mockResolvedValue({
        servicesCount: 1,
        telegramChatId: undefined,
      })
      const result = await controller.getSession(makeReq({ clientId: 'client' }))
      expect(result).toMatchObject({ telegramLinked: false })
    })
  })

  // POST /v1/session/extend
  describe('extendSession', () => {
    it('returns { extended: false } when clientId cookie is missing', async () => {
      const result = await controller.extendSession(makeReq())
      expect(result).toEqual({ extended: false })
      expect(mockSessionService.extendSession).not.toHaveBeenCalled()
    })

    it('calls extendSession and returns { extended: true }', async () => {
      mockSessionService.extendSession.mockResolvedValue(undefined)
      const result = await controller.extendSession(makeReq({ clientId: 'client' }))
      expect(mockSessionService.extendSession).toHaveBeenCalledWith('client')
      expect(result).toEqual({ extended: true })
    })
  })

  // DELETE /v1/session/me
  describe('deleteSession', () => {
    it('clears cookie and sends response even without clientId', async () => {
      const res = makeRes()
      await controller.deleteSession(makeReq(), res)
      expect(mockSessionService.deleteSession).not.toHaveBeenCalled()
      expect(res.clearCookie).toHaveBeenCalledWith('clientId', { path: '/' })
      expect(res.send).toHaveBeenCalled()
    })

    it('deletes session, clears cookie and sends response when clientId present', async () => {
      mockSessionService.deleteSession.mockResolvedValue(undefined)
      const res = makeRes()
      await controller.deleteSession(makeReq({ clientId: 'client' }), res)
      expect(mockSessionService.deleteSession).toHaveBeenCalledWith('client')
      expect(res.clearCookie).toHaveBeenCalledWith('clientId', { path: '/' })
      expect(res.send).toHaveBeenCalled()
    })
  })

  // PATCH /v1/session/notifications
  describe('updateNotifications', () => {
    it('throws BAD_REQUEST when clientId cookie is missing', async () => {
      await expect(
        controller.updateNotifications(makeReq(), { notifyTelegram: true }),
      ).rejects.toThrow(new HttpException('No active session', HttpStatus.BAD_REQUEST))
    })

    it('updates notification settings and returns result', async () => {
      mockSessionService.updateNotificationSettings.mockResolvedValue({ notifyTelegram: true })
      const result = await controller.updateNotifications(makeReq({ clientId: 'client' }), {
        notifyTelegram: true,
      })
      expect(mockSessionService.updateNotificationSettings).toHaveBeenCalledWith('client', true)
      expect(result).toEqual({ notifyTelegram: true })
    })

    it('passes notifyTelegram: false correctly', async () => {
      mockSessionService.updateNotificationSettings.mockResolvedValue({ notifyTelegram: false })
      const result = await controller.updateNotifications(makeReq({ clientId: 'client' }), {
        notifyTelegram: false,
      })
      expect(mockSessionService.updateNotificationSettings).toHaveBeenCalledWith('client', false)
      expect(result).toEqual({ notifyTelegram: false })
    })
  })
})
