import { Activity, Plus } from 'lucide-react'

import { UserPopover } from './UserPopover'

export function DashHeader({ onMonitorChange }: DashHeaderProps) {
  return (
    <header className="bg-[#0d120d] border-b border-b-[rgb(0,230,118)]/10 px-6 sm:px-8 lg:px-12 h-15 flex items-center justify-between sticky top-0 z-50">
      <a href="/dashboard" className="flex items-center gap-2 hover:opacity-90 active:opacity-80">
        <span className="w-7 h-7 rounded-md bg-[#00e676] flex items-center justify-center shrink-0">
          <Activity size={15} color="#080a08" strokeWidth={2.5} />
        </span>
        <span className="font-barlow font-extrabold text-base sm:text-[1.3rem] tracking-wider text-[#e8f5e8]">
          LIVEWAVE
        </span>
      </a>

      <div className="flex items-center gap-3">
        <button
          aria-label="Add monitor"
          onClick={onMonitorChange}
          className="inline-flex items-center gap-[0.4rem] font-inter font-semibold text-[0.7rem] sm:text-[0.85rem] text-[#080a08] bg-[#00e676] border-none py-2 px-4 rounded-sm transition-opacity duration-200 hover:opacity-90 active:opacity-80"
        >
          <Plus size={15} strokeWidth={2} />
          <span className="inline-block sm:hidden">Add</span>
          <span className="hidden sm:inline-block">Add Monitor</span>
        </button>

        <UserPopover />
      </div>
    </header>
  )
}

interface DashHeaderProps {
  onMonitorChange: () => void
}
