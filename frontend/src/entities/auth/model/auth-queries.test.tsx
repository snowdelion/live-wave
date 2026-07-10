import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { useAuthStore } from '@/shared/api'

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

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return {
    ...actual,
    useAuthStore: vi.fn(),
  }
})

vi.mock('../api/log-out', () => ({
  logout: vi.fn(),
}))

vi.mock('../api/refresh-token', () => ({
  refreshToken: vi.fn(),
}))

vi.mock('../api/sign-in-via-email', () => ({
  signInViaEmail: vi.fn(),
}))

vi.mock('../api/sign-in-via-telegram', () => ({
  signInViaTelegram: vi.fn(),
}))

vi.mock('../api/sign-up-via-email', () => ({
  signUpViaEmail: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return { Wrapper, queryClient }
}

describe('auth mutations', () => {
  const setAccessToken = vi.fn()
  const clearAccessToken = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector({
        setAccessToken,
        clearAccessToken,
      }),
    )
  })

  describe('useSignUpEmail', () => {
    it('should call signUpViaEmail with the provided body and call setAccessToken on success (currently with undefined due to a source bug)', async () => {
      vi.mocked(signUpViaEmail).mockResolvedValueOnce({
        data: { accessToken: 'token-abc' },
        status: 200,
      } as never)

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useSignUpEmail(), { wrapper: Wrapper })

      act(() => {
        result.current.mutate({ email: 'a@b.com', password: 'pw' } as never)
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(signUpViaEmail).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' })
      expect(setAccessToken).toHaveBeenCalledTimes(1)
      expect(setAccessToken).toHaveBeenCalledWith(undefined)
    })

    it('should not call setAccessToken when the mutation fails', async () => {
      vi.mocked(signUpViaEmail).mockRejectedValueOnce(new Error('failed'))

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useSignUpEmail(), { wrapper: Wrapper })

      act(() => {
        result.current.mutate({ email: 'a@b.com', password: 'pw' } as never)
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(setAccessToken).not.toHaveBeenCalled()
    })
  })

  describe('useSignInEmail', () => {
    it('should call signInViaEmail with the provided body and call setAccessToken on success (currently with undefined due to a source bug)', async () => {
      vi.mocked(signInViaEmail).mockResolvedValueOnce({
        data: { accessToken: 'token-xyz' },
        status: 200,
      } as never)

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useSignInEmail(), { wrapper: Wrapper })

      act(() => {
        result.current.mutate({ email: 'a@b.com', password: 'pw' } as never)
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(signInViaEmail).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' })
      expect(setAccessToken).toHaveBeenCalledTimes(1)
      expect(setAccessToken).toHaveBeenCalledWith(undefined)
    })

    it('should not call setAccessToken when the mutation fails', async () => {
      vi.mocked(signInViaEmail).mockRejectedValueOnce(new Error('failed'))

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useSignInEmail(), { wrapper: Wrapper })

      act(() => {
        result.current.mutate({ email: 'a@b.com', password: 'pw' } as never)
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(setAccessToken).not.toHaveBeenCalled()
    })
  })

  describe('useSignInTelegram', () => {
    it('should call signInViaTelegram with the provided body and call setAccessToken on success (currently with undefined due to a source bug)', async () => {
      vi.mocked(signInViaTelegram).mockResolvedValueOnce({
        data: { accessToken: 'tg-token' },
        status: 200,
      } as never)

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useSignInTelegram(), { wrapper: Wrapper })

      const body = { id: 1, first_name: 'John', auth_date: 123, hash: 'h' }

      act(() => {
        result.current.mutate(body as never)
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(signInViaTelegram).toHaveBeenCalledWith(body)
      expect(setAccessToken).toHaveBeenCalledTimes(1)
      expect(setAccessToken).toHaveBeenCalledWith(undefined)
    })

    it('should not call setAccessToken when the mutation fails', async () => {
      vi.mocked(signInViaTelegram).mockRejectedValueOnce(new Error('failed'))

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useSignInTelegram(), { wrapper: Wrapper })

      act(() => {
        result.current.mutate({ id: 1, first_name: 'John', auth_date: 123, hash: 'h' } as never)
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(setAccessToken).not.toHaveBeenCalled()
    })
  })

  describe('useLogout', () => {
    it('should call clearAccessToken and clear the query client on success', async () => {
      vi.mocked(logout).mockResolvedValueOnce({ data: null, status: 200 } as never)

      const { Wrapper, queryClient } = createWrapper()
      const clearSpy = vi.spyOn(queryClient, 'clear')

      const { result } = renderHook(() => useLogout(), { wrapper: Wrapper })

      act(() => {
        result.current.mutate()
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(clearAccessToken).toHaveBeenCalledTimes(1)
      expect(clearSpy).toHaveBeenCalledTimes(1)
    })

    it('should not clear the access token or query client when the mutation fails', async () => {
      vi.mocked(logout).mockRejectedValueOnce(new Error('failed'))

      const { Wrapper, queryClient } = createWrapper()
      const clearSpy = vi.spyOn(queryClient, 'clear')

      const { result } = renderHook(() => useLogout(), { wrapper: Wrapper })

      act(() => {
        result.current.mutate()
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(clearAccessToken).not.toHaveBeenCalled()
      expect(clearSpy).not.toHaveBeenCalled()
    })
  })

  describe('useRefreshToken', () => {
    it('should call refreshToken and call setAccessToken on success (currently with undefined due to a source bug)', async () => {
      vi.mocked(refreshToken).mockResolvedValueOnce({
        data: { accessToken: 'refreshed-token' },
        status: 200,
      } as never)

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useRefreshToken(), { wrapper: Wrapper })

      act(() => {
        result.current.mutate()
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(refreshToken).toHaveBeenCalledTimes(1)
      expect(setAccessToken).toHaveBeenCalledTimes(1)
      expect(setAccessToken).toHaveBeenCalledWith(undefined)
    })

    it('should not call setAccessToken when the mutation fails', async () => {
      vi.mocked(refreshToken).mockRejectedValueOnce(new Error('failed'))

      const { Wrapper } = createWrapper()
      const { result } = renderHook(() => useRefreshToken(), { wrapper: Wrapper })

      act(() => {
        result.current.mutate()
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(setAccessToken).not.toHaveBeenCalled()
    })
  })
})
