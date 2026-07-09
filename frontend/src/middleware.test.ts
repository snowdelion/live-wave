import { NextRequest } from 'next/server'

import { middleware } from './middleware'

function buildRequest(path: string, cookies?: Record<string, string>): NextRequest {
  const url = `https://example.com${path}`
  const request = new NextRequest(url)

  if (cookies) for (const [key, value] of Object.entries(cookies)) request.cookies.set(key, value)

  return request
}

describe('middleware', () => {
  describe('public paths', () => {
    it('should allow access to the root path without a refresh token', () => {
      const request = buildRequest('/')

      const response = middleware(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow access to /auth without a refresh token', () => {
      const request = buildRequest('/auth')

      const response = middleware(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow access to nested /auth paths without a refresh token', () => {
      const request = buildRequest('/auth/sign-in')

      const response = middleware(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow access to /api/auth without a refresh token', () => {
      const request = buildRequest('/api/auth')

      const response = middleware(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow access to nested /api/auth paths without a refresh token', () => {
      const request = buildRequest('/api/auth/refresh-token')

      const response = middleware(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })
  })

  describe('protected paths', () => {
    it('should redirect to /auth when refreshToken cookie is missing', () => {
      const request = buildRequest('/dashboard')

      const response = middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/auth')
    })

    it('should allow access when refreshToken cookie is present', () => {
      const request = buildRequest('/dashboard', { refreshToken: 'valid-token' })

      const response = middleware(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should redirect nested protected paths when refreshToken cookie is missing', () => {
      const request = buildRequest('/settings/profile')

      const response = middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/auth')
    })
  })

  describe('edge cases', () => {
    it('should not treat a path merely starting with a public prefix as public (e.g. /authenticate)', () => {
      const request = buildRequest('/authenticate')

      const response = middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/auth')
    })

    it('should treat an empty refreshToken cookie value as missing and redirect', () => {
      const request = buildRequest('/dashboard', { refreshToken: '' })

      const response = middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/auth')
    })
  })

  describe('public paths with refreshToken', () => {
    it('should redirect from /auth to /dashboard when refreshToken cookie is present', () => {
      const request = buildRequest('/auth', { refreshToken: 'valid-token' })

      const response = middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/dashboard')
    })

    it('should redirect from nested /auth paths to /dashboard when refreshToken is present', () => {
      const request = buildRequest('/auth/sign-in', { refreshToken: 'valid-token' })

      const response = middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/dashboard')
    })
  })
})
