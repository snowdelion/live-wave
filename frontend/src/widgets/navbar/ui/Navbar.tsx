import { Activity } from 'lucide-react'
import Link from 'next/link'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgb(8,10,8)]/92 backdrop-blur-sm border-b border-b-[rgb(0,230,118)]/8">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-90 active:opacity-80 transition-opacity duration-150"
        >
          <div className="w-7 h-7 rounded flex items-center justify-center bg-[#00e676]">
            <Activity size={16} color="#080a08" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-[1.4rem] tracking-wider text-[#e8f5e8] font-barlow">
            LIVEWAVE
          </span>
        </Link>

        <Link
          href="/dashboard"
          className="flex items-center gap-3 font-inter text-sm font-semibold text-[#080a08] bg-[#00e676] py-[0.45rem] px-[1.1rem] rounded-lg transition-opacity duration-150 hover:opacity-90 active:opacity-80"
        >
          Get started
        </Link>
      </div>
    </nav>
  )
}
