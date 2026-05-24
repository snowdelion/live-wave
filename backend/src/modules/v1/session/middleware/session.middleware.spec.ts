import { randomUUID } from 'crypto'

import { SessionMiddleware } from './session.middleware'

vi.mock('crypto', () => ({
  randomUUID: vi.fn(),
}))

const MOCK_UUID = 'mock-uuid-1234'
const MOCK_IP = '127.0.0.1'

function createMockReq(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    cookies: {},
    ip: MOCK_IP,
    socket: { remoteAddress: undefined },
    clientId: undefined,
    ...overrides,
  }
}

function createMockRes(): Record<string, unknown> {
  return {
    cookie: vi.fn(),
  }
}

function createMockNext() {
  return vi.fn()
}

function createMockSessionService() {
  return {
    createSession: vi.fn().mockResolvedValue(undefined),
    getSession: vi.fn(),
    extendSession: vi.fn().mockResolvedValue(undefined),
  }
}

describe('SessionMiddleware', () => {
  let middleware: SessionMiddleware
  let sessionService: ReturnType<typeof createMockSessionService>

  beforeEach(() => {
    vi.clearAllMocks()
    sessionService = createMockSessionService()
    middleware = new SessionMiddleware(sessionService as never)
    vi.mocked(randomUUID).mockReturnValue(MOCK_UUID as never)
  })

  describe('when no clientId cookie is present', () => {
    it('should generate a new clientId', async () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(randomUUID).toHaveBeenCalledOnce()
      expect(req.clientId).toBe(MOCK_UUID)
    })

    it('should call createSession with the new clientId and IP', async () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(sessionService.createSession).toHaveBeenCalledWith(MOCK_UUID, MOCK_IP)
    })

    it('should set the clientId cookie with correct options in non-production', async () => {
      process.env.NODE_ENV = 'test'
      const req = createMockReq()
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(res.cookie).toHaveBeenCalledWith('clientId', MOCK_UUID, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      })
    })

    it('should set the cookie with secure: true in production', async () => {
      process.env.NODE_ENV = 'production'
      const req = createMockReq()
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(res.cookie).toHaveBeenCalledWith(
        'clientId',
        MOCK_UUID,
        expect.objectContaining({ secure: true }),
      )

      process.env.NODE_ENV = 'test'
    })

    it('should call next()', async () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(next).toHaveBeenCalledOnce()
    })

    it('should fall back to socket.remoteAddress when req.ip is undefined', async () => {
      const req = createMockReq({ ip: undefined, socket: { remoteAddress: '192.168.1.1' } })
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(sessionService.createSession).toHaveBeenCalledWith(MOCK_UUID, '192.168.1.1')
    })

    it('should fall back to "unknown" when both ip sources are unavailable', async () => {
      const req = createMockReq({ ip: undefined, socket: { remoteAddress: undefined } })
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(sessionService.createSession).toHaveBeenCalledWith(MOCK_UUID, 'unknown')
    })
  })

  describe('when a valid clientId cookie is present', () => {
    const EXISTING_CLIENT_ID = 'existing-client-id'

    it('should not generate a new clientId', async () => {
      sessionService.getSession.mockResolvedValue({ id: EXISTING_CLIENT_ID })
      const req = createMockReq({ cookies: { clientId: EXISTING_CLIENT_ID } })
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(randomUUID).not.toHaveBeenCalled()
    })

    it('should call extendSession with the existing clientId', async () => {
      sessionService.getSession.mockResolvedValue({ id: EXISTING_CLIENT_ID })
      const req = createMockReq({ cookies: { clientId: EXISTING_CLIENT_ID } })
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(sessionService.extendSession).toHaveBeenCalledWith(EXISTING_CLIENT_ID)
    })

    it('should set req.clientId to the existing clientId', async () => {
      sessionService.getSession.mockResolvedValue({ id: EXISTING_CLIENT_ID })
      const req = createMockReq({ cookies: { clientId: EXISTING_CLIENT_ID } })
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(req.clientId).toBe(EXISTING_CLIENT_ID)
    })

    it('should not call createSession', async () => {
      sessionService.getSession.mockResolvedValue({ id: EXISTING_CLIENT_ID })
      const req = createMockReq({ cookies: { clientId: EXISTING_CLIENT_ID } })
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(sessionService.createSession).not.toHaveBeenCalled()
    })

    it('should call next()', async () => {
      sessionService.getSession.mockResolvedValue({ id: EXISTING_CLIENT_ID })
      const req = createMockReq({ cookies: { clientId: EXISTING_CLIENT_ID } })
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(next).toHaveBeenCalledOnce()
    })
  })

  describe('when clientId cookie is present but session does not exist', () => {
    const STALE_CLIENT_ID = 'stale-client-id'

    it('should generate a new clientId', async () => {
      sessionService.getSession.mockResolvedValue(null)
      const req = createMockReq({ cookies: { clientId: STALE_CLIENT_ID } })
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(randomUUID).toHaveBeenCalledOnce()
      expect(req.clientId).toBe(MOCK_UUID)
    })

    it('should call createSession with the new clientId', async () => {
      sessionService.getSession.mockResolvedValue(null)
      const req = createMockReq({ cookies: { clientId: STALE_CLIENT_ID } })
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(sessionService.createSession).toHaveBeenCalledWith(MOCK_UUID, MOCK_IP)
    })

    it('should set a new clientId cookie', async () => {
      sessionService.getSession.mockResolvedValue(null)
      const req = createMockReq({ cookies: { clientId: STALE_CLIENT_ID } })
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(res.cookie).toHaveBeenCalledWith('clientId', MOCK_UUID, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
        sameSite: 'lax',
        secure: false,
      })
    })

    it('should not call extendSession', async () => {
      sessionService.getSession.mockResolvedValue(null)
      const req = createMockReq({ cookies: { clientId: STALE_CLIENT_ID } })
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(sessionService.extendSession).not.toHaveBeenCalled()
    })

    it('should call next()', async () => {
      sessionService.getSession.mockResolvedValue(null)
      const req = createMockReq({ cookies: { clientId: STALE_CLIENT_ID } })
      const res = createMockRes()
      const next = createMockNext()

      await middleware.use(req as never, res as never, next)

      expect(next).toHaveBeenCalledOnce()
    })
  })
})
