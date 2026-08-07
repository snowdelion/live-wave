import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchIncidents } from '../api/fetch-incidents'
import { fetchOverview } from '../api/fetch-overview'
import { fetchTimeline } from '../api/fetch-timeline'

export const ANALYTICS_QUERY_KEYS = {
  all: ['analytics'] as const,
  overview: (monitorId: string, days: number) =>
    [...ANALYTICS_QUERY_KEYS.all, 'overview', monitorId, days] as const,
  incidents: (monitorId: string, days: number) =>
    [...ANALYTICS_QUERY_KEYS.all, 'incidents', monitorId, days] as const,
  timeline: (monitorId: string, days: number) =>
    [...ANALYTICS_QUERY_KEYS.all, 'timeline', monitorId, days] as const,
}

export function useOverview(monitorId: string, days = 7) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.overview(monitorId, days),
    queryFn: () => fetchOverview(monitorId, days),
    enabled: !!monitorId,
    placeholderData: keepPreviousData,
  })
}

export function useIncidents(monitorId: string, days = 7) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.incidents(monitorId, days),
    queryFn: () => fetchIncidents(monitorId, days),
    enabled: !!monitorId,
    placeholderData: keepPreviousData,
  })
}

export function useTimeline(monitorId: string, days = 7) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.timeline(monitorId, days),
    queryFn: () => fetchTimeline(monitorId, days),
    enabled: !!monitorId,
    placeholderData: keepPreviousData,
  })
}
