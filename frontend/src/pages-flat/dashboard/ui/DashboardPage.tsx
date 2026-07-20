'use client'

import { MonitorModal, DashHeader } from '@/features/dashboard'

import { useDashboardPage } from '../model/useDashboardPage'

export function DashboardPage() {
  const { getInitial, showModal, openModal, closeModal, setEditId, detailedMonitor, editId } =
    useDashboardPage()

  return (
    <div className="bg-[#080a08] min-h-screen flex flex-col">
      <DashHeader onMonitorChange={openModal} />
      <main className="flex-1 py-7 px-6 max-w-350 my-0 mx-auto w-full">
        <div className="mb-6">
          <h1 className="font-barlow font-extrabold text-[1.75rem] text-[#e8f5e8] tracking-wide mb-1">
            MY MONITORS
          </h1>
          <span className="font-jet-brains text-[0.7rem] text-[#2e7d32] tracking-[0.08em]">
            Real-time monitoring for your servers, APIs, websites
          </span>
        </div>
      </main>

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
