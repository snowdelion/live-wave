'use client'

import { MonitorModal } from '@/features/dashboard'
import { DetailsHeader, PeriodSwitcher } from '@/features/monitor-details'
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
    periodDays,
    setPeriodDays,
  } = useMonitorDetails(monitorId)

  return (
    <div className="bg-[#080a08] min-h-screen flex flex-col">
      <DetailsHeader
        monitorId={monitorId}
        setShowEdit={setShowEdit}
        setShowDeleteConfirm={setShowDeleteConfirm}
      />

      <main className="flex-1 py-7 px-7.75 max-w-350 mx-auto w-full box-border">
        <PeriodSwitcher
          monitorId={monitorId}
          periodDays={periodDays}
          setPeriodDays={setPeriodDays}
        />
      </main>

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
