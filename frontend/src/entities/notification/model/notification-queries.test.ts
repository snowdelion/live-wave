import { waitFor } from '@testing-library/react'

import { renderHookWithClient } from '@/shared/test-utils'

import { fetchSettings } from '../api/fetch-settings'
import { linkTelegram } from '../api/link-telegram'
import { toggleAlert } from '../api/toggle-alert'
import { unlinkTelegram } from '../api/unlink-telegram'

import {
  NOTIFICATION_QUERY_KEYS,
  useNotificationSettings,
  useLinkTelegram,
  useUnlinkTelegram,
  useToggleAlert,
} from './notification-queries'

vi.mock('../api/fetch-settings')
vi.mock('../api/link-telegram')
vi.mock('../api/unlink-telegram')
vi.mock('../api/toggle-alert')
vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual('@/shared/api')
  return { ...actual, useAuthStore: vi.fn().mockReturnValue('token') }
})

describe('Notification Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('NOTIFICATION_QUERY_KEYS', () => {
    it('generates the correct query keys', () => {
      expect(NOTIFICATION_QUERY_KEYS.all).toEqual(['notifications'])
      expect(NOTIFICATION_QUERY_KEYS.settings()).toEqual(['notifications', 'settings'])
    })
  })

  describe('useNotificationSettings', () => {
    it('fetches settings successfully', async () => {
      const mockSettings = { hasChat: true, enabled: false }
      vi.mocked(fetchSettings).mockResolvedValue(mockSettings)

      const { result } = renderHookWithClient(() => useNotificationSettings())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.data).toEqual(mockSettings)
        expect(result.current.isLoading).toBe(false)
      })

      expect(fetchSettings).toHaveBeenCalledTimes(1)
    })

    it('handles fetch errors gracefully', async () => {
      vi.mocked(fetchSettings).mockRejectedValue(new Error('Failed to fetch settings'))

      const { result } = renderHookWithClient(() => useNotificationSettings())

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.error).toEqual(new Error('Failed to fetch settings'))
      })

      expect(fetchSettings).toHaveBeenCalledTimes(1)
    })
  })

  describe('useLinkTelegram', () => {
    it('calls linkTelegram and invalidates settings query on success', async () => {
      vi.mocked(linkTelegram).mockResolvedValue({ message: 'success' })

      const { result, queryClient } = renderHookWithClient(() => useLinkTelegram())
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      result.current.mutate({ chatId: '12345' })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(linkTelegram).toHaveBeenCalledWith({ chatId: '12345' })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: NOTIFICATION_QUERY_KEYS.settings(),
      })
    })

    it('handles mutation errors without invalidating the cache', async () => {
      vi.mocked(linkTelegram).mockRejectedValue(new Error('Link failed'))

      const { result, queryClient } = renderHookWithClient(() => useLinkTelegram())
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      result.current.mutate({ chatId: '12345' })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.error).toEqual(new Error('Link failed'))
      })

      expect(linkTelegram).toHaveBeenCalledTimes(1)
      expect(invalidateSpy).not.toHaveBeenCalled()
    })
  })

  describe('useUnlinkTelegram', () => {
    it('calls unlinkTelegram and invalidates settings query on success', async () => {
      vi.mocked(unlinkTelegram).mockResolvedValue({ message: 'success' })

      const { result, queryClient } = renderHookWithClient(() => useUnlinkTelegram())
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(unlinkTelegram).toHaveBeenCalledTimes(1)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: NOTIFICATION_QUERY_KEYS.settings(),
      })
    })

    it('handles mutation errors without invalidating the cache', async () => {
      vi.mocked(unlinkTelegram).mockRejectedValue(new Error('Unlink failed'))

      const { result, queryClient } = renderHookWithClient(() => useUnlinkTelegram())
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.error).toEqual(new Error('Unlink failed'))
      })

      expect(unlinkTelegram).toHaveBeenCalledTimes(1)
      expect(invalidateSpy).not.toHaveBeenCalled()
    })
  })

  describe('useToggleAlert', () => {
    it('calls toggleAlert and invalidates settings query on success', async () => {
      vi.mocked(toggleAlert).mockResolvedValue({ message: 'success', enabled: true })

      const { result, queryClient } = renderHookWithClient(() => useToggleAlert())
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: NOTIFICATION_QUERY_KEYS.settings(),
      })
    })

    it('handles mutation errors without invalidating the cache', async () => {
      vi.mocked(toggleAlert).mockRejectedValue(new Error('Toggle failed'))

      const { result, queryClient } = renderHookWithClient(() => useToggleAlert())
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.error).toEqual(new Error('Toggle failed'))
      })

      expect(toggleAlert).toHaveBeenCalledTimes(1)
      expect(invalidateSpy).not.toHaveBeenCalled()
    })
  })
})
