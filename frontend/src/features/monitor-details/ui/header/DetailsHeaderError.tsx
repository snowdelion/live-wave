import { Activity, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function DetailsHeaderError() {
  return (
    <header className="bg-[#0d120d] border-b border-b-[rgba(244,67,54,0.3)] px-6 sm:px-8 lg:pl-12 lg:pr-8 h-15 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 hover:opacity-90 active:opacity-80 transition-opacity duration-150"
        >
          <span className="w-7 h-7 rounded-md bg-[#00e676] flex items-center justify-center shrink-0">
            <Activity size={15} color="#080a08" strokeWidth={2.5} />
          </span>
          <span className="font-barlow font-extrabold text-base sm:text-[1.3rem] tracking-wider text-[#e8f5e8]">
            LIVEWAVE
          </span>
        </Link>

        <div className="hidden sm:block w-px h-5 bg-[rgba(0,230,118,0.1)]" />

        <Link
          href="/dashboard"
          className="hidden sm:flex items-center gap-1.5 font-inter text-[0.82rem] text-[#4caf50] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-[#5eca62] active:text-[#4fb452]"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <AlertCircle size={13} className="text-[#f44336]" />
        <span className="font-jet-brains text-[0.6rem] sm:text-xs text-[#f44336]">
          Failed to load monitor
        </span>
      </div>
    </header>
  )
}
