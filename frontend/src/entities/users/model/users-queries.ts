import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { deleteMe } from '../api/delete-me'
import { fetchMe } from '../api/fetch-me'

export const USERS_QUERY_KEYS = {
  all: ['users'] as const,
  me: () => [...USERS_QUERY_KEYS.all, 'me'] as const,
}

export function useUser() {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.me(),
    queryFn: fetchMe,
  })
}

export function useDeleteUser() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: deleteMe,
    onSuccess: () => void client.clear(),
  })
}
