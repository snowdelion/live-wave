import type { NextResponse } from 'next/server'
import z from 'zod'

import { AppError } from '../../../config/app-error'
import { useAuthStore } from '../../auth.store'
import { request } from '../request'

vi.mock('../../auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}))

vi.mock('../../../dto/access-token-response.dto', () => ({
  AccessTokenResponseSchema: {
    parse: vi.fn((data: unknown) => data),
  },
}))

const SCHEMA = z.any()

describe('tryRefreshToken', () => {
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
    expect(refreshCall[0]).toBe('/api/v1/auth/refresh-token')

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

    const { AccessTokenResponseSchema } = await import('../../../dto/access-token-response.dto')
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
