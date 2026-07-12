import { Activity } from 'lucide-react'
import Link from 'next/link'

export function AuthHeader({ isLogin }: { isLogin: boolean }) {
  return (
    <>
      <Link
        href="/"
        className="inline-flex items-center gap-[0.55rem] mb-7 hover:opacity-90 active:opacity-80 transition-opacity duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-[#00e676] flex items-center justify-center shrink-0">
          <Activity size={17} color="#080a08" strokeWidth={2.5} />
        </div>
        <span className="font-barlow font-extrabold text-2xl tracking-wider text-[#e8f5e8]">
          LIVEWAVE
        </span>
      </Link>

      <h1 className="font-barlow font-extrabold text-3xl text-[#e8f5e8] tracking-[0.01rem] mb-1">
        {isLogin ? 'Welcome back' : 'Create account'}
      </h1>

      <p className="font-inter text-sm text-[#4caf50] mb-7">
        {isLogin
          ? 'Monitor your services in real-time'
          : 'Start monitoring your services instantly'}
      </p>
    </>
  )
}
