import { FilePlus, SearchX } from 'lucide-react'
import React from 'react'

import { EmptyState } from '@/shared/ui'

import type { MonitorTableProps } from '../../../model/dashboard.types'
import { useMonitorTable } from '../../../model/useMonitorTable'
import { DeleteConfirmModal } from '../../modals/DeleteConfirmModal'

import { MonitorRow } from './MonitorRow'

export function MonitorTableDesktop({
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

  if (isEmpty)
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
      <div className="bg-[#0d120d] border border-[rgba(0,230,118,0.1)] rounded-lg overflow-hidden">
        <div
          className="grid py-3 px-5 border-b border-b-[rgba(0,230,118,0.08)] bg-[#080a08]"
          style={{
            gridTemplateColumns: '2fr 90px 90px 110px 100px 100px 90px 90px',
          }}
        >
          {[
            'Monitor',
            'Type',
            'Status',
            'Last Check',
            'Response',
            'Uptime 7d',
            'Trend',
            'Actions',
          ].map(col => (
            <span
              key={col}
              className="font-jet-brains text-[0.65rem] text-[#2e7d32] tracking-widest uppercase"
            >
              {col}
            </span>
          ))}
        </div>

        {filtered?.map(m => (
          <MonitorRow key={m.id} monitor={m} onEdit={onEdit} setDeleteTarget={setDeleteTarget} />
        ))}
      </div>

      {deleteTarget && (
        <DeleteConfirmModal
          monitor={deleteTarget}
          onConfirm={() => {
            deleteMonitor(deleteTarget.id)

            setDeleteTarget(null)
          }}
          onCancel={() => setDeleteTarget(null)}
          open={!!deleteTarget}
        />
      )}
    </>
  )
}
