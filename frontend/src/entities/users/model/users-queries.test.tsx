import { waitFor } from '@testing-library/react'

import { renderHookWithClient } from '@/shared/test-utils'

import { deleteMe } from '../api/delete-me'
import type { CurrentUser } from '../api/dto/current-user.dto'
import { fetchMe } from '../api/fetch-me'

import { useUser, useDeleteUser, USERS_QUERY_KEYS } from './users-queries'

vi.mock('../api/fetch-me')
vi.mock('../api/delete-me')

const mockUseAuthStore = vi.fn()
vi.mock('@/shared/api', () => ({
  useAuthStore: (...args: any[]) => mockUseAuthStore(...args),
}))

const mockRouter = {
  push: vi.fn(),
}
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

describe('users-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({
        accessToken: 'mock-token',
        clearAccessToken: vi.fn(),
      }),
    )
  })

  describe('useUser', () => {
    it('fetches user data successfully', async () => {
      const mockUser = { id: '1', email: 'john@example.com' } as unknown as CurrentUser
      vi.mocked(fetchMe).mockResolvedValue(mockUser)

      const { result } = renderHookWithClient(() => useUser())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.data).toEqual(mockUser)
        expect(result.current.isLoading).toBe(false)
      })

      expect(fetchMe).toHaveBeenCalledTimes(1)
    })

    it('handles fetch errors gracefully', async () => {
      vi.mocked(fetchMe).mockRejectedValue(new Error('Failed to fetch'))

      const { result } = renderHookWithClient(() => useUser())

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.error).toEqual(new Error('Failed to fetch'))
      })

      expect(fetchMe).toHaveBeenCalledTimes(1)
    })
  })

  describe('useDeleteUser', () => {
    it('calls deleteMe, clears auth, clears query client, and redirects on success', async () => {
      vi.mocked(deleteMe).mockResolvedValue({ success: true })

      const mockClearAccessToken = vi.fn()
      mockUseAuthStore.mockImplementation((selector: any) =>
        selector({
          accessToken: 'mock-token',
          clearAccessToken: mockClearAccessToken,
        }),
      )

      const { result, queryClient } = renderHookWithClient(() => useDeleteUser())
      const clearSpy = vi.spyOn(queryClient, 'clear')

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(deleteMe).toHaveBeenCalledTimes(1)
      expect(clearSpy).toHaveBeenCalledTimes(1)
      expect(mockClearAccessToken).toHaveBeenCalledTimes(1)
      expect(mockRouter.push).toHaveBeenCalledWith('/auth')
    })

    it('handles mutation errors without clearing the client, auth, or redirecting', async () => {
      vi.mocked(deleteMe).mockRejectedValue(new Error('Deletion failed'))

      const mockClearAccessToken = vi.fn()
      mockUseAuthStore.mockImplementation((selector: any) =>
        selector({
          accessToken: 'mock-token',
          clearAccessToken: mockClearAccessToken,
        }),
      )

      const { result, queryClient } = renderHookWithClient(() => useDeleteUser())
      const clearSpy = vi.spyOn(queryClient, 'clear')

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.error).toEqual(new Error('Deletion failed'))
      })

      expect(deleteMe).toHaveBeenCalledTimes(1)

      expect(clearSpy).not.toHaveBeenCalled()
      expect(mockClearAccessToken).not.toHaveBeenCalled()
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })

  describe('USERS_QUERY_KEYS', () => {
    it('generates the correct query keys', () => {
      expect(USERS_QUERY_KEYS.all).toEqual(['users'])
      expect(USERS_QUERY_KEYS.me()).toEqual(['users', 'me'])
    })
  })
})
