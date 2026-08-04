import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchSettings, type Settings } from '../api/fetch-settings'
import { linkTelegram } from '../api/link-telegram'
import { toggleAlert } from '../api/toggle-alert'
import { unlinkTelegram } from '../api/unlink-telegram'

export const NOTIFICATIONS_QUERY_KEYS = {
  all: ['notifications'] as const,
  settings: () => [...NOTIFICATIONS_QUERY_KEYS.all, 'settings'] as const,
}

export function useNotificationsSettings() {
  return useQuery<Settings>({
    queryKey: NOTIFICATIONS_QUERY_KEYS.settings(),
    queryFn: fetchSettings,
    refetchOnWindowFocus: 'always',
  })
}

export function useLinkTelegram() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: linkTelegram,
    onSuccess: ({ link }) => {
      void client.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.settings() })
      window.open(link, '_blank')
    },
  })
}

export function useUnlinkTelegram() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: unlinkTelegram,
    onSuccess: () => client.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.settings() }),
  })
}

export function useToggleAlert() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: toggleAlert,
    onSuccess: () => client.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.settings() }),
    onMutate: async () => {
      await client.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.settings() })
      const prev = client.getQueryData<Settings>(NOTIFICATIONS_QUERY_KEYS.settings())

      if (prev)
        client.setQueryData(NOTIFICATIONS_QUERY_KEYS.settings(), {
          ...prev,
          enabled: !prev.enabled,
        })
      return { prev }
    },
    onError: (_, __, ctx) =>
      ctx?.prev && client.setQueryData(NOTIFICATIONS_QUERY_KEYS.settings(), ctx.prev),
  })
}
