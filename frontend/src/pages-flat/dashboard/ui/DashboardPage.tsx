'use client'

import { MonitorModal, DashHeader } from '@/features/dashboard'

import { useDashboardPage } from '../model/useDashboardPage'

export function DashboardPage() {
  const { getInitial, showModal, openModal, closeModal, setEditId, detailedMonitor, editId } =
    useDashboardPage()

  return (
    <div className="bg-[#080a08] min-h-screen flex flex-col">
      <DashHeader onMonitorChange={openModal} />

      {showModal && <MonitorModal mode="create" onClose={closeModal} />}

      {detailedMonitor && editId && (
        <MonitorModal
          mode="update"
          initial={getInitial(detailedMonitor)}
          onClose={() => setEditId(null)}
        />
      )}
    </div>
  )
}
