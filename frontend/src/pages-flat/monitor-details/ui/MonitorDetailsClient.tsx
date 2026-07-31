'use client'

import { MonitorModal } from '@/features/dashboard'
import { DetailsHeader } from '@/features/monitor-details'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'

import { useMonitorDetails } from '../model/useMonitorDetails'

export function MonitorDetailsClient({ monitorId }: { monitorId: string }) {
  const {
    setShowEdit,
    setShowDeleteConfirm,
    monitor,
    showDeleteConfirm,
    deleteMonitor,
    showEdit,
    initialMonitor,
  } = useMonitorDetails(monitorId)

  return (
    <div className="bg-[#080a08] min-h-screen flex flex-col">
      <DetailsHeader
        monitorId={monitorId}
        setShowEdit={setShowEdit}
        setShowDeleteConfirm={setShowDeleteConfirm}
      />

      {showDeleteConfirm && monitor && (
        <ConfirmModal
          title="DELETE MONITOR"
          description="This will permanently delete the monitor and all its historical data"
          danger
          open={showDeleteConfirm}
          onConfirm={() => deleteMonitor(monitorId)}
          onCancel={() => setShowDeleteConfirm(false)}
          itemName={monitor.name}
        />
      )}

      {showEdit && (
        <MonitorModal mode="update" onClose={() => setShowEdit(false)} initial={initialMonitor} />
      )}
    </div>
  )
}
