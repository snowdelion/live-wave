import { FilePlus, SearchX } from 'lucide-react'
import React from 'react'

import { EmptyState } from '@/shared/ui'

import type { MonitorTableProps } from '../../../model/dashboard.types'
import { useMonitorTable } from '../../../model/useMonitorTable'
import { ConfirmModal } from '../../modals/ConfirmModal'

import { MonitorCard } from './MonitorCard'

export function MonitorTableMobile({
  onEdit,
  search,
  typeFilter,
  onMonitorChange,
}: MonitorTableProps) {
  const {
    deleteMonitor,
    deleteTarget,
    setDeleteTarget,
    filtered,
    isEmpty,
    hasNoResults,
    noResultsTitle,
    noResultsDescription,
  } = useMonitorTable({ search, typeFilter })

  if (isEmpty) {
    return (
      <EmptyState
        icon={<FilePlus size={40} strokeWidth={1.5} />}
        title="No monitors yet"
        description="Create your first monitor to start tracking uptime and performance"
        action={
          <button
            onClick={onMonitorChange}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#00e676] text-[#080a08] font-inter text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <FilePlus size={16} />
            Add monitor
          </button>
        }
      />
    )
  }

  if (hasNoResults) {
    return (
      <EmptyState
        icon={<SearchX size={40} strokeWidth={1.5} />}
        title={noResultsTitle}
        description={noResultsDescription}
      />
    )
  }

  return (
    <>
      <div className="space-y-4">
        {filtered?.map(m => (
          <MonitorCard key={m.id} monitor={m} onEdit={onEdit} setDeleteTarget={setDeleteTarget} />
        ))}
      </div>

      {deleteTarget && (
        <ConfirmModal
          open={!!deleteTarget}
          onConfirm={() => {
            deleteMonitor(deleteTarget.id)
            setDeleteTarget(null)
          }}
          onCancel={() => setDeleteTarget(null)}
          title="DELETE MONITOR"
          description="This will permanently delete the monitor and all its historical data"
          itemName={deleteTarget?.name}
        />
      )}
    </>
  )
}
