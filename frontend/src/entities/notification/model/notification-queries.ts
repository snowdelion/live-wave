import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/shared/api'

import { fetchSettings, type Settings } from '../api/fetch-settings'
import { linkTelegram } from '../api/link-telegram'
import { toggleAlert } from '../api/toggle-alert'
import { unlinkTelegram } from '../api/unlink-telegram'

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  settings: () => [...NOTIFICATION_QUERY_KEYS.all, 'settings'] as const,
}

export function useNotificationSettings() {
  const accessToken = useAuthStore(s => s.accessToken)

  return useQuery<Settings>({
    queryKey: NOTIFICATION_QUERY_KEYS.settings(),
    queryFn: fetchSettings,
    enabled: !!accessToken,
  })
}

export function useLinkTelegram() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ chatId }: { chatId: string }) => linkTelegram({ chatId }),
    onSuccess: () => client.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.settings() }),
  })
}

export function useUnlinkTelegram() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: unlinkTelegram,
    onSuccess: () => client.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.settings() }),
  })
}

export function useToggleAlert() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: toggleAlert,
    onSuccess: () => client.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.settings() }),
  })
}
