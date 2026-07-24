import { waitFor } from '@testing-library/react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { useRouter } from 'next/navigation'

import { useAuthStore } from '@/shared/api'
import { renderHookWithClient } from '@/shared/test-utils'

import { logout } from '../api/log-out'
import { refreshToken } from '../api/refresh-token'
import { signInViaEmail } from '../api/sign-in-via-email'
import { signInViaTelegram } from '../api/sign-in-via-telegram'
import { signUpViaEmail } from '../api/sign-up-via-email'

import {
  useLogout,
  useRefreshToken,
  useSignInEmail,
  useSignInTelegram,
  useSignUpEmail,
} from './auth-queries'

vi.mock('../api/log-out')
vi.mock('../api/refresh-token')
vi.mock('../api/sign-in-via-email')
vi.mock('../api/sign-in-via-telegram')
vi.mock('../api/sign-up-via-email')

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    useAuthStore: vi.fn(),
  }
})

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

describe('auth mutations', () => {
  const mockSetAccessToken = vi.fn()
  const mockClearAccessToken = vi.fn()
  const mockRouter = { push: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({
        setAccessToken: mockSetAccessToken,
        clearAccessToken: mockClearAccessToken,
      }),
    )

    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as AppRouterInstance)
  })

  describe('useSignUpEmail', () => {
    it('should call signUpViaEmail with the provided body and call setAccessToken on success', async () => {
      vi.mocked(signUpViaEmail).mockResolvedValueOnce({ accessToken: 'token-abc' } as never)

      const { result } = renderHookWithClient(() => useSignUpEmail())

      result.current.mutate({ email: 'a@b.com', password: 'pw' } as never)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(signUpViaEmail).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' })
      expect(mockSetAccessToken).toHaveBeenCalledWith('token-abc')
    })

    it('should not call setAccessToken when the mutation fails', async () => {
      vi.mocked(signUpViaEmail).mockRejectedValueOnce(new Error('failed'))

      const { result } = renderHookWithClient(() => useSignUpEmail())

      result.current.mutate({ email: 'a@b.com', password: 'pw' } as never)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(mockSetAccessToken).not.toHaveBeenCalled()
    })
  })

  describe('useSignInEmail', () => {
    it('should call signInViaEmail with the provided body and call setAccessToken on success', async () => {
      vi.mocked(signInViaEmail).mockResolvedValueOnce({ accessToken: 'token-xyz' } as never)

      const { result } = renderHookWithClient(() => useSignInEmail())

      result.current.mutate({ email: 'a@b.com', password: 'pw' } as never)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(signInViaEmail).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' })
      expect(mockSetAccessToken).toHaveBeenCalledWith('token-xyz')
    })

    it('should not call setAccessToken when the mutation fails', async () => {
      vi.mocked(signInViaEmail).mockRejectedValueOnce(new Error('failed'))

      const { result } = renderHookWithClient(() => useSignInEmail())

      result.current.mutate({ email: 'a@b.com', password: 'pw' } as never)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(mockSetAccessToken).not.toHaveBeenCalled()
    })
  })

  describe('useSignInTelegram', () => {
    it('should call signInViaTelegram with the provided body and call setAccessToken on success', async () => {
      vi.mocked(signInViaTelegram).mockResolvedValueOnce({ accessToken: 'tg-token' } as never)

      const { result } = renderHookWithClient(() => useSignInTelegram())

      const body = { id: 1, first_name: 'John', auth_date: 123, hash: 'h' }

      result.current.mutate(body as never)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(signInViaTelegram).toHaveBeenCalledWith(body)
      expect(mockSetAccessToken).toHaveBeenCalledWith('tg-token')
    })

    it('should not call setAccessToken when the mutation fails', async () => {
      vi.mocked(signInViaTelegram).mockRejectedValueOnce(new Error('failed'))

      const { result } = renderHookWithClient(() => useSignInTelegram())

      result.current.mutate({ id: 1, first_name: 'John', auth_date: 123, hash: 'h' } as never)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(mockSetAccessToken).not.toHaveBeenCalled()
    })
  })

  describe('useLogout', () => {
    it('should call clearAccessToken, clear the query client, and redirect on success', async () => {
      vi.mocked(logout).mockResolvedValueOnce(undefined as never)

      const { result, queryClient } = renderHookWithClient(() => useLogout())
      const clearSpy = vi.spyOn(queryClient, 'clear')

      result.current.mutate()

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockClearAccessToken).toHaveBeenCalledTimes(1)
      expect(clearSpy).toHaveBeenCalledTimes(1)
      expect(mockRouter.push).toHaveBeenCalledWith('/auth')
    })

    it('should not clear the access token, query client, or redirect when the mutation fails', async () => {
      vi.mocked(logout).mockRejectedValueOnce(new Error('failed'))

      const { result, queryClient } = renderHookWithClient(() => useLogout())
      const clearSpy = vi.spyOn(queryClient, 'clear')

      result.current.mutate()

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(mockClearAccessToken).not.toHaveBeenCalled()
      expect(clearSpy).not.toHaveBeenCalled()
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })

  describe('useRefreshToken', () => {
    it('should call refreshToken and call setAccessToken on success', async () => {
      vi.mocked(refreshToken).mockResolvedValueOnce({ accessToken: 'refreshed-token' } as never)

      const { result } = renderHookWithClient(() => useRefreshToken())

      result.current.mutate()

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(refreshToken).toHaveBeenCalledTimes(1)
      expect(mockSetAccessToken).toHaveBeenCalledWith('refreshed-token')
    })

    it('should not call setAccessToken when the mutation fails', async () => {
      vi.mocked(refreshToken).mockRejectedValueOnce(new Error('failed'))

      const { result } = renderHookWithClient(() => useRefreshToken())

      result.current.mutate()

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(mockSetAccessToken).not.toHaveBeenCalled()
    })
  })
})
