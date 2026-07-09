import type { NextResponse } from 'next/server'
import z from 'zod'

import { AppError } from '../../config/app-error'
import { ERROR_CODES } from '../../config/error-codes'
import { useAuthStore } from '../auth.store'
import { request } from '../request'

const SCHEMA = z.any()

vi.mock('../../config/api-url', () => ({
  API_URL: {
    AUTH: {
      REFRESH_TOKEN: '/api/auth/refresh-token',
    },
  },
}))

vi.mock('../auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}))

vi.mock('../../dto/access-token-response.dto', () => ({
  AccessTokenResponseSchema: {
    parse: vi.fn((data: unknown) => data),
  },
}))

describe('request', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('successful responses', () => {
    it('should parse response data through schema when schema is provided', async () => {
      const schema = z.object({ id: z.number() })

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 42 }),
      } as NextResponse)

      const result = await request({ url: '/fetch', schema })

      expect(result.data).toEqual({ id: 42 })
      expect(result.status).toBe(200)
    })

    it('should return null data and skip parsing on 204 No Content', async () => {
      const jsonSpy = vi.fn()

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: jsonSpy,
      } as unknown as NextResponse)

      const result = await request({ url: '/fetch', schema: SCHEMA })

      expect(result.data).toBeNull()
      expect(result.status).toBe(204)
      expect(jsonSpy).not.toHaveBeenCalled()
    })
  })

  describe('zod validation', () => {
    it('should throw when schema validation fails', async () => {
      const schema = z.object({ id: z.number() })

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'not-a-number' }),
      } as NextResponse)

      await expect(request({ url: '/fetch', schema })).rejects.toThrow()
    })
  })

  describe('error handling: API', () => {
    it('should throw when response is not ok and status is not 499', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as NextResponse)

      await expect(request({ url: '/fetch', schema: SCHEMA })).rejects.toThrow()
    })

    it('should throw AppError with errorCode when response fails with known status', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as NextResponse)

      await expect(
        request({ url: '/fetch', errorCode: ERROR_CODES.UNKNOWN, schema: SCHEMA }),
      ).rejects.toBeInstanceOf(AppError)
    })
  })

  describe('protected requests', () => {
    it('should attach Authorization header using accessToken from the store', async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        accessToken: 'abc123',
        setAccessToken: vi.fn(),
        clearAccessToken: vi.fn(),
      } as unknown as ReturnType<typeof useAuthStore.getState>)

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as NextResponse)

      await request({ url: '/fetch', schema: SCHEMA, isProtected: true })

      const init = (fetchSpy as any).mock.calls[0][1]
      const headers = init.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer abc123')
    })
  })

  describe('token refresh on 401', () => {
    it('should refresh the token and retry the request on success', async () => {
      const state = {
        accessToken: 'old-token',
        setAccessToken: vi.fn((token: string) => {
          state.accessToken = token
        }),
        clearAccessToken: vi.fn(),
      }
      vi.mocked(useAuthStore.getState).mockImplementation(
        () => state as unknown as ReturnType<typeof useAuthStore.getState>,
      )

      const fetchSpy = vi.spyOn(global, 'fetch')
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as NextResponse)

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'new-token' }),
      } as NextResponse)

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      } as NextResponse)

      const result = await request({ url: '/fetch', schema: SCHEMA, isProtected: true, retries: 1 })

      expect(result.data).toEqual({ ok: true })
      expect(state.setAccessToken).toHaveBeenCalledWith('new-token')

      const refreshCall = (fetchSpy as any).mock.calls[1]
      expect(refreshCall[0]).toBe('/api/auth/refresh-token')

      const retriedInit = (fetchSpy as any).mock.calls[2][1] as RequestInit
      const headers = retriedInit.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer new-token')
    })

    it('should clear the access token and throw AppError when refresh fails', async () => {
      const clearAccessToken = vi.fn()
      vi.mocked(useAuthStore.getState).mockReturnValue({
        accessToken: 'old-token',
        setAccessToken: vi.fn(),
        clearAccessToken,
      } as unknown as ReturnType<typeof useAuthStore.getState>)

      const fetchSpy = vi.spyOn(global, 'fetch')
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as NextResponse)
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as NextResponse)

      await expect(
        request({ url: '/fetch', schema: SCHEMA, isProtected: true, retries: 1 }),
      ).rejects.toBeInstanceOf(AppError)

      expect(clearAccessToken).toHaveBeenCalled()
    })

    it('should clear the access token and throw AppError when refresh response fails schema validation', async () => {
      const clearAccessToken = vi.fn()
      vi.mocked(useAuthStore.getState).mockReturnValue({
        accessToken: 'old-token',
        setAccessToken: vi.fn(),
        clearAccessToken,
      } as unknown as ReturnType<typeof useAuthStore.getState>)

      const { AccessTokenResponseSchema } = await import('../../dto/access-token-response.dto')
      vi.mocked(AccessTokenResponseSchema.parse).mockImplementationOnce(() => {
        throw new Error('Invalid shape')
      })

      const fetchSpy = vi.spyOn(global, 'fetch')
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as NextResponse)
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'malformed' }),
      } as NextResponse)

      await expect(
        request({ url: '/fetch', schema: SCHEMA, isProtected: true, retries: 1 }),
      ).rejects.toBeInstanceOf(AppError)

      expect(clearAccessToken).toHaveBeenCalled()
    })

    it('should not attempt refresh when retries is exhausted', async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        accessToken: 'old-token',
        setAccessToken: vi.fn(),
        clearAccessToken: vi.fn(),
      } as unknown as ReturnType<typeof useAuthStore.getState>)

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as NextResponse)

      await expect(
        request({ url: '/fetch', schema: SCHEMA, isProtected: true, retries: 0 }),
      ).rejects.toThrow()

      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('aborts and timeouts', () => {
    it('should show original AbortError when response is 499 and signal is aborted', async () => {
      const controller = new AbortController()
      controller.abort()

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 499,
      } as NextResponse)

      await expect(
        request({ url: '/fetch', signal: controller.signal, schema: SCHEMA }),
      ).rejects.toThrow(DOMException)
    })

    it('should throw AppError timeout when fetch times out and no external signal', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(
        Object.assign(new Error('Timeout'), { name: 'TimeoutError' }),
      )

      await expect(request({ url: '/fetch', schema: SCHEMA })).rejects.toBeInstanceOf(AppError)

      vi.spyOn(global, 'fetch').mockRejectedValueOnce(
        Object.assign(new Error('Timeout'), { name: 'TimeoutError' }),
      )

      await expect(request({ url: '/fetch', timeout: 8000, schema: SCHEMA })).rejects.toMatchObject(
        {
          code: ERROR_CODES.TIMEOUT,
        },
      )
    })

    it('should throw AppError timeout when AbortError without external signal', async () => {
      vi.spyOn(AbortSignal, 'timeout').mockReturnValue({
        aborted: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as AbortSignal)

      const timeoutAbortError = new DOMException('Aborted', 'AbortError')
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(timeoutAbortError)
      await expect(request({ url: '/fetch', schema: SCHEMA })).rejects.toBeInstanceOf(AppError)

      vi.spyOn(global, 'fetch').mockRejectedValueOnce(timeoutAbortError)
      await expect(request({ url: '/fetch', schema: SCHEMA })).rejects.toMatchObject({
        code: ERROR_CODES.TIMEOUT,
      })
    })

    it('should throw TimeoutError when internal timeout aborts and no external signal', async () => {
      vi.useFakeTimers()

      vi.spyOn(global, 'fetch').mockImplementationOnce(
        (_url, init) =>
          new Promise((_, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'))
            })
          }),
      )

      const promise = request({ url: '/fetch', timeout: 100, schema: SCHEMA })
      const settled = promise.catch(e => e)

      await vi.advanceTimersByTimeAsync(200)

      const error = await settled
      expect(error).toMatchObject({ name: 'TimeoutError' })

      vi.useRealTimers()
    })

    it('should throw TimeoutError when internal timeout aborts but external signal is not aborted', async () => {
      vi.useFakeTimers()

      const controller = new AbortController()

      vi.spyOn(global, 'fetch').mockImplementationOnce(
        (_url, init) =>
          new Promise((_, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'))
            })
          }),
      )

      const promise = request({
        url: '/fetch',
        timeout: 100,
        signal: controller.signal,
        schema: SCHEMA,
      })
      const settled = promise.catch(e => e)

      await vi.advanceTimersByTimeAsync(200)

      const error = await settled
      expect(error).toMatchObject({ name: 'TimeoutError' })

      vi.useRealTimers()
    })
  })
})
