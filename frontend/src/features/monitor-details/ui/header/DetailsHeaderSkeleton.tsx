import { Activity, ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'

export function DetailsHeaderSkeleton() {
  return (
    <header className="bg-[#0d120d] border-b border-b-[rgb(0,230,118)]/10 px-6 sm:px-8 lg:pl-12 lg:pr-8 h-15 flex items-center justify-between sticky top-0 z-50">
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

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-5 w-15 lg:w-25 bg-[rgba(0,230,118,0.1)] rounded animate-pulse" />

          <div className="hidden sm:flex items-center gap-[0.35rem] font-jet-brains text-[0.7rem] border bg-[rgba(0,230,118,0.08)] border-[rgba(0,230,118,0.2)] rounded-full h-6 px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgba(0,230,118,0.2)] shrink-0 animate-pulse" />
            <div className="h-3 w-4 bg-[rgba(0,230,118,0.1)] rounded animate-pulse" />
          </div>
        </div>

        <div className="flex gap-[0.4rem] lg:mr-3">
          <button
            className="inline-flex items-center gap-[0.4rem] font-inter text-[0.8rem] text-[#a5d6a7] bg-transparent border border-[rgba(0,230,118,0.15)] rounded-md
              py-[0.4rem] px-2 sm:px-[0.85rem]"
          >
            <Pencil size={13} />
            <span className="hidden sm:block">Edit</span>
          </button>
          <button
            className="inline-flex items-center gap-[0.4rem] font-inter text-[0.8rem] text-[#f44336] bg-transparent border border-[rgba(244,67,54,0.2)] rounded-md
              py-[0.4rem] px-2 sm:px-[0.85rem]"
          >
            <Trash2 size={13} />
            <span className="hidden sm:block">Delete</span>
          </button>
        </div>
      </div>
    </header>
  )
}
