'use client'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function MonitorNotFound({ monitorId }: MonitorNotFoundProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="rounded-full bg-linear-to-br from-red-500/20 to-orange-500/20 p-2.5 ring-1 ring-red-500/30">
        <AlertCircle
          size={30}
          className="text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]"
        />
      </div>

      <div className="space-y-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Monitor not found
        </h1>
        <p className="mx-auto max-w-md text-sm text-zinc-400 sm:text-base">
          Monitor with{' '}
          <code className="rounded bg-zinc-800/80 p-0.5 font-mono text-xs text-[#00e676] ring-1 ring-zinc-700/50">
            {monitorId}
          </code>{' '}
          ID doesn't exist or has been deleted.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#00e676] px-5 py-2.5 text-sm font-medium text-black shadow-[0_0_15px_rgba(0,230,118,0.3)] transition-all hover:shadow-[0_0_25px_rgba(0,230,118,0.5)] hover:brightness-110 active:scale-98 active:brightness-95 active:shadow-[0_0_10px_rgba(0,230,118,0.2)] focus:outline-none"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>
    </div>
  )
}

interface MonitorNotFoundProps {
  monitorId: string
}
