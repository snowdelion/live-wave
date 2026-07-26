import { act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useLogout } from '@/entities/auth'
import {
  useLinkTelegram,
  useNotificationSettings,
  useToggleAlert,
  useUnlinkTelegram,
} from '@/entities/notification'
import { useDeleteUser, useUser } from '@/entities/users'
import { renderHookWithClient } from '@/shared/test-utils'

import { useUserPopover } from '../useUserPopover'

vi.mock('@/entities/auth', () => ({
  useLogout: vi.fn(),
}))

vi.mock('@/entities/notification', () => ({
  useLinkTelegram: vi.fn(),
  useNotificationSettings: vi.fn(),
  useToggleAlert: vi.fn(),
  useUnlinkTelegram: vi.fn(),
}))

vi.mock('@/entities/users', () => ({
  useDeleteUser: vi.fn(),
  useUser: vi.fn(),
}))

describe('useUserPopover', () => {
  const mockMutate = vi.fn()
  const mockUser = { email: 'test@example.com', username: 'testuser' }
  const mockSettings = { hasChat: true, enabled: true }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useUser).mockReturnValue({ data: mockUser } as any)
    vi.mocked(useNotificationSettings).mockReturnValue({ data: mockSettings } as any)
    vi.mocked(useDeleteUser).mockReturnValue({ mutate: mockMutate } as any)
    vi.mocked(useLogout).mockReturnValue({ mutate: mockMutate } as any)
    vi.mocked(useToggleAlert).mockReturnValue({ mutate: mockMutate } as any)
    vi.mocked(useLinkTelegram).mockReturnValue({ mutate: mockMutate, error: null } as any)
    vi.mocked(useUnlinkTelegram).mockReturnValue({ mutate: mockMutate } as any)
  })

  describe('initial state and panel buttons', () => {
    it('returns correct state and buttons when telegram is linked and notifications are enabled', () => {
      const { result } = renderHookWithClient(() => useUserPopover())

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.showConfirm).toBe(false)
      expect(result.current.accountName).toBe('')
      expect(result.current.error).toBeNull()

      const buttons = result.current.PANEL_BUTTONS
      expect(buttons).toHaveLength(4)

      expect(buttons[0]!.label).toBe('Unlink Telegram')
      expect(buttons[0]!.shouldShow).toBe(true)
      expect(buttons[0]!.shouldShowConfirm).toBe(false)

      expect(buttons[1]!.label).toBe('Disable Notifications')
      expect(buttons[1]!.shouldShow).toBe(true)

      expect(buttons[2]!.label).toBe('Delete Account')
      expect(buttons[2]!.isDanger).toBe(true)
      expect(buttons[2]!.shouldShowConfirm).toBe(true)

      expect(buttons[3]!.label).toBe('Log Out')
      expect(buttons[3]!.isDanger).toBe(true)
      expect(buttons[3]!.shouldShowConfirm).toBe(false)
    })

    it('shows "Link Telegram" and hides notifications button when telegram is not linked', () => {
      vi.mocked(useNotificationSettings).mockReturnValue({
        data: { hasChat: false, enabled: false },
      } as any)

      const { result } = renderHookWithClient(() => useUserPopover())
      const buttons = result.current.PANEL_BUTTONS

      expect(buttons[0]!.label).toBe('Link Telegram')
      expect(buttons[1]!.label).toBe('Enable Notifications')
      expect(buttons[1]!.shouldShow).toBe(false)
    })

    it('handles undefined settings gracefully with fallbacks', () => {
      vi.mocked(useNotificationSettings).mockReturnValue({ data: undefined } as any)

      const { result } = renderHookWithClient(() => useUserPopover())
      const buttons = result.current.PANEL_BUTTONS

      expect(buttons[0]!.label).toBe('Link Telegram')
      expect(buttons[1]!.shouldShow).toBe(false)
    })
  })

  describe('handleDeleteClick', () => {
    it('sets accountName to user email and showConfirm to true', () => {
      const { result } = renderHookWithClient(() => useUserPopover())

      act(() => {
        result.current.handleDeleteClick()
      })

      expect(result.current.showConfirm).toBe(true)
      expect(result.current.accountName).toBe('test@example.com')
    })

    it('falls back to username if email is missing', () => {
      vi.mocked(useUser).mockReturnValue({ data: { username: 'testuser' } } as any)
      const { result } = renderHookWithClient(() => useUserPopover())

      act(() => {
        result.current.handleDeleteClick()
      })

      expect(result.current.accountName).toBe('testuser')
    })

    it('falls back to "Account" if both email and username are missing', () => {
      vi.mocked(useUser).mockReturnValue({ data: {} } as any)
      const { result } = renderHookWithClient(() => useUserPopover())

      act(() => {
        result.current.handleDeleteClick()
      })

      expect(result.current.accountName).toBe('Account')
    })
  })

  describe('error handling', () => {
    it('exposes error from useLinkTelegram', () => {
      const mockError = new Error('Link failed')
      vi.mocked(useLinkTelegram).mockReturnValue({
        mutate: mockMutate,
        error: mockError,
      } as any)

      const { result } = renderHookWithClient(() => useUserPopover())

      expect(result.current.error).toBe(mockError)
    })
  })

  describe('button actions', () => {
    it('actions in PANEL_BUTTONS point to the correct mutate functions', () => {
      const { result } = renderHookWithClient(() => useUserPopover())
      const buttons = result.current.PANEL_BUTTONS

      buttons[0]!.action()
      expect(mockMutate).toHaveBeenCalledTimes(1)

      buttons[1]!.action()
      expect(mockMutate).toHaveBeenCalledTimes(2)

      buttons[2]!.action()
      expect(mockMutate).toHaveBeenCalledTimes(3)

      buttons[3]!.action()
      expect(mockMutate).toHaveBeenCalledTimes(4)
    })
  })
})
