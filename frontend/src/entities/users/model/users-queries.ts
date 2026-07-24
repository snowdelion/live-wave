import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { useAuthStore } from '@/shared/api'

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
  const clearAccessToken = useAuthStore(s => s.clearAccessToken)
  const client = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: deleteMe,
    onSuccess: () => {
      clearAccessToken()
      client.clear()
      router.push('/auth')
    },
  })
}
