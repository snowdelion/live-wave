import { useMemo, useState } from 'react'

import {
  type MonitorType,
  useDeleteMonitor,
  useMonitors,
  type UserMonitor,
} from '@/entities/monitor'

export function useMonitorTable({ search, typeFilter }: UseMonitorTableOptions) {
  const { data: { monitors } = { monitors: [] } } = useMonitors()
  const { mutate: deleteMonitor } = useDeleteMonitor()

  const [deleteTarget, setDeleteTarget] = useState<UserMonitor | null>(null)

  const filtered = useMemo(() => {
    if (!monitors || monitors.length === 0) return []
    return monitors.filter(m => {
      const matchName = m.name.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === 'ALL' || m.type === typeFilter.toUpperCase()
      return matchName && matchType
    })
  }, [monitors, search, typeFilter])

  let noResultsTitle = `No monitors found for "${typeFilter}"`
  let noResultsDescription = 'No monitors match your current filters'
  const hasSearch = search.trim().length > 0
  const hasFilter = typeFilter !== 'ALL'

  if (hasSearch && hasFilter) {
    noResultsTitle = `No monitors found for "${search}" with "${typeFilter}" type`
    noResultsDescription = 'Try adjusting your search or filter to see more results'
  } else if (hasSearch) {
    noResultsTitle = `No monitors found for "${search}"`
    noResultsDescription = 'Try adjusting your search term'
  } else if (hasFilter) {
    noResultsTitle = `No ${typeFilter} monitors found`
    noResultsDescription = 'Try selecting a different type or clearing the filter'
  }

  return {
    deleteMonitor,
    deleteTarget,
    setDeleteTarget,
    filtered,
    isEmpty: !monitors || monitors.length === 0,
    hasNoResults: filtered.length === 0,
    noResultsTitle,
    noResultsDescription,
  }
}

interface UseMonitorTableOptions {
  search: string
  typeFilter: MonitorType | 'ALL'
}
