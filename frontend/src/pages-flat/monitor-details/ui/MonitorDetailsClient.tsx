'use client'

import { MonitorModal } from '@/features/dashboard'
import {
  DetailsHeader,
  IncidentModal,
  Incidents,
  LatencyChart,
  OverviewCards,
  PeriodSwitcher,
  UptimeChart,
  MonitorNotFound,
} from '@/features/monitor-details'
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
    selectedIncident,
    setSelectedIncident,
    isMonitorNotFound,
  } = useMonitorDetails(monitorId)

  return (
    <div className="bg-[#080a08] min-h-screen flex flex-col overflow-x-hidden">
      <DetailsHeader
        monitorId={monitorId}
        setShowEdit={setShowEdit}
        setShowDeleteConfirm={setShowDeleteConfirm}
        isMonitorNotFound={isMonitorNotFound}
      />

      <main className="flex-1 py-7 px-7.75 max-w-350 mx-auto w-full box-border">
        {isMonitorNotFound && <MonitorNotFound monitorId={monitorId} />}
        {!isMonitorNotFound && (
          <>
            <PeriodSwitcher
              monitorId={monitorId}
              periodDays={periodDays}
              setPeriodDays={setPeriodDays}
            />

            <OverviewCards monitorId={monitorId} periodDays={periodDays} />

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <UptimeChart monitorId={monitorId} periodDays={periodDays} />
              <LatencyChart monitorId={monitorId} periodDays={periodDays} />
            </div>

            <Incidents
              monitorId={monitorId}
              onIncidentChange={setSelectedIncident}
              periodDays={periodDays}
            />
          </>
        )}
      </main>

      {selectedIncident && monitor && (
        <IncidentModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}

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

      {showEdit && monitor && (
        <MonitorModal mode="update" onClose={() => setShowEdit(false)} initial={initialMonitor} />
      )}
    </div>
  )
}
