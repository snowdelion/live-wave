import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createMonitor } from '../api/create-monitor'
import { deleteMonitor } from '../api/delete-monitor'
import type { UpdateMonitorRequest } from '../api/dto/update-monitor-request.dto'
import type { UserMonitor, UserMonitors } from '../api/dto/user-monitors.dto'
import { fetchDetailedMonitor } from '../api/fetch-detailed-monitor'
import { fetchMonitors } from '../api/fetch-monitors'
import { updateMonitor } from '../api/update-monitor'

export const MONITOR_QUERY_KEYS = {
  all: ['monitors'] as const,
  list: () => [...MONITOR_QUERY_KEYS.all, 'list'] as const,
  details: () => [...MONITOR_QUERY_KEYS.all, 'detail'] as const,
  detail: (monitorId: string) => [...MONITOR_QUERY_KEYS.details(), monitorId] as const,
}

export function useMonitors() {
  return useQuery({
    queryKey: MONITOR_QUERY_KEYS.list(),
    queryFn: fetchMonitors,
  })
}

export function useDetailedMonitor(monitorId: string) {
  return useQuery({
    queryKey: MONITOR_QUERY_KEYS.detail(monitorId),
    queryFn: () => fetchDetailedMonitor(monitorId),
    enabled: !!monitorId,
  })
}

export function useCreateMonitor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMonitor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MONITOR_QUERY_KEYS.list() }),
  })
}

export function useUpdateMonitor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ monitorId, body }: { monitorId: string; body: UpdateMonitorRequest }) =>
      updateMonitor(monitorId, body),

    onMutate: async ({ monitorId, body }) => {
      await queryClient.cancelQueries({ queryKey: MONITOR_QUERY_KEYS.list() })
      await queryClient.cancelQueries({ queryKey: MONITOR_QUERY_KEYS.detail(monitorId) })

      const prevMonitors = queryClient.getQueryData<UserMonitors>(MONITOR_QUERY_KEYS.list())
      const prevMonitor = queryClient.getQueryData(MONITOR_QUERY_KEYS.detail(monitorId))

      queryClient.setQueryData<UserMonitors>(MONITOR_QUERY_KEYS.list(), prev => {
        if (!prev?.monitors) return { monitors: [], incidentsCount: 0 }
        return {
          incidentsCount: prev.incidentsCount ?? 0,
          monitors: prev.monitors.map(m =>
            m.id === monitorId ? ({ ...m, ...body } as UserMonitor) : m,
          ),
        }
      })
      queryClient.setQueryData(
        MONITOR_QUERY_KEYS.detail(monitorId),
        (prev: UserMonitor | undefined) => (prev ? { ...prev, ...body } : prev),
      )

      return { prevMonitor, prevMonitors }
    },

    onError: (_, { monitorId }, context) => {
      queryClient.setQueryData(MONITOR_QUERY_KEYS.list(), context?.prevMonitors)
      queryClient.setQueryData(MONITOR_QUERY_KEYS.detail(monitorId), context?.prevMonitor)
    },
    onSettled: (_, __, { monitorId }) => {
      void queryClient.invalidateQueries({ queryKey: MONITOR_QUERY_KEYS.list() })
      void queryClient.invalidateQueries({ queryKey: MONITOR_QUERY_KEYS.detail(monitorId) })
    },
  })
}

export function useDeleteMonitor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (monitorId: string) => deleteMonitor(monitorId),
    onMutate: async monitorId => {
      await queryClient.cancelQueries({ queryKey: MONITOR_QUERY_KEYS.list() })
      const prevMonitors = queryClient.getQueryData<UserMonitors>(MONITOR_QUERY_KEYS.list())

      queryClient.setQueryData<UserMonitors>(MONITOR_QUERY_KEYS.list(), prev => {
        if (!prev?.monitors) return { monitors: [], incidentsCount: 0 }
        return {
          incidentsCount: prev.incidentsCount ?? 0,
          monitors: prev.monitors.filter(m => m.id !== monitorId) ?? [],
        }
      })

      return { prevMonitors }
    },

    onError: (_, __, context) =>
      queryClient.setQueryData(MONITOR_QUERY_KEYS.list(), context?.prevMonitors),

    onSettled: (_, __, monitorId) => {
      void queryClient.invalidateQueries({ queryKey: MONITOR_QUERY_KEYS.detail(monitorId) })
      void queryClient.invalidateQueries({ queryKey: MONITOR_QUERY_KEYS.list() })
    },
  })
}
