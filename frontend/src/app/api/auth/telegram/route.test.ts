import type { NextRequest } from 'next/server'

import { GET } from './route'

describe('Telegram Auth Route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:8000')
    vi.stubEnv('NEXT_PUBLIC_API_VERSION', 'v1')
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  const createMockFetch = (ok: boolean, jsonData?: unknown, status = 200) => {
    return vi.fn().mockResolvedValue({
      ok,
      status,
      json: vi.fn().mockResolvedValue(jsonData),
      text: vi.fn().mockResolvedValue('Error'),
    })
  }

  const createRequest = (params: Record<string, string>) => {
    const url = new URL('http://localhost:3000/api/auth/telegram')
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
    return {
      nextUrl: url,
      url: url.toString(),
    } as NextRequest
  }

  it('should redirect to dashboard and set cookies on successful auth', async () => {
    const mockFetch = createMockFetch(true, {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    })
    vi.stubGlobal('fetch', mockFetch)

    const req = createRequest({
      id: '123',
      first_name: 'John',
      username: 'johndoe',
      photo_url: 'http://photo.com',
      auth_date: '1600000000',
      hash: 'abc123',
    })

    const response = await GET(req)

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/auth/telegram',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 123,
          first_name: 'John',
          username: 'johndoe',
          photo_url: 'http://photo.com',
          auth_date: 1600000000,
          hash: 'abc123',
        }),
      }),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')

    const accessTokenCookie = response.cookies.get('accessToken')
    const refreshTokenCookie = response.cookies.get('refreshToken')

    expect(accessTokenCookie?.value).toBe('access-123')
    expect(refreshTokenCookie?.value).toBe('refresh-456')

    expect(accessTokenCookie?.maxAge).toBe(15 * 60)
    expect(refreshTokenCookie?.maxAge).toBe(7 * 24 * 60 * 60)
    expect(accessTokenCookie?.secure).toBe(false)
    expect(refreshTokenCookie?.secure).toBe(false)
    expect(accessTokenCookie?.httpOnly).toBe(false)
    expect(refreshTokenCookie?.httpOnly).toBe(true)
  })

  it('should redirect to /auth?error=telegram_failed on API error', async () => {
    const mockFetch = createMockFetch(false, null, 400)
    vi.stubGlobal('fetch', mockFetch)

    const req = createRequest({
      id: '123',
      first_name: 'John',
      username: 'johndoe',
      photo_url: 'http://photo.com',
      auth_date: '1600000000',
      hash: 'abc123',
    })

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await GET(req)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'TELEGRAM AUTH ERROR:',
      expect.stringContaining('Status 400'),
    )
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/auth?error=telegram_failed',
    )

    consoleErrorSpy.mockRestore()
  })

  it('should redirect to /auth?error=telegram_failed on invalid token response (Zod error)', async () => {
    const mockFetch = createMockFetch(true, { accessToken: 'access-123' })
    vi.stubGlobal('fetch', mockFetch)

    const req = createRequest({
      id: '123',
      first_name: 'John',
      username: 'johndoe',
      photo_url: 'http://photo.com',
      auth_date: '1600000000',
      hash: 'abc123',
    })

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await GET(req)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'TELEGRAM AUTH ERROR:',
      expect.stringContaining('refreshToken'),
    )
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/auth?error=telegram_failed',
    )

    consoleErrorSpy.mockRestore()
  })

  it('should redirect to /auth?error=telegram_failed on unexpected network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const req = createRequest({
      id: '123',
      first_name: 'John',
      username: 'johndoe',
      photo_url: 'http://photo.com',
      auth_date: '1600000000',
      hash: 'abc123',
    })

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await GET(req)

    expect(consoleErrorSpy).toHaveBeenCalledWith('TELEGRAM AUTH ERROR:', 'Network error')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/auth?error=telegram_failed',
    )

    consoleErrorSpy.mockRestore()
  })

  it('should handle missing search params gracefully with defaults', async () => {
    const mockFetch = createMockFetch(true, {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    })
    vi.stubGlobal('fetch', mockFetch)

    const req = createRequest({})

    await GET(req)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          id: 0,
          first_name: '',
          username: '',
          photo_url: '',
          auth_date: 0,
          hash: '',
        }),
      }),
    )
  })

  it('should set secure cookies when NODE_ENV is production', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const mockFetch = createMockFetch(true, {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    })
    vi.stubGlobal('fetch', mockFetch)

    const req = createRequest({
      id: '123',
      first_name: 'John',
      username: 'johndoe',
      photo_url: 'http://photo.com',
      auth_date: '1600000000',
      hash: 'abc123',
    })

    const response = await GET(req)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')

    const accessTokenCookie = response.cookies.get('accessToken')
    const refreshTokenCookie = response.cookies.get('refreshToken')

    expect(accessTokenCookie?.secure).toBe(true)
    expect(refreshTokenCookie?.secure).toBe(true)
  })
})
