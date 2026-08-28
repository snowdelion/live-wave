import { SearchX, Home } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="rounded-full bg-amber-500/20 p-3 ring-1 ring-amber-500/30">
        <SearchX size={34} className="text-amber-400" />
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Page not found
        </h1>
        <p className="mx-auto max-w-md text-sm text-zinc-400 sm:text-base">
          The requested page does not exist.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#00e676] px-5 py-2.5 text-sm font-medium text-black transition-all hover:brightness-110 active:brightness-90"
        >
          <Home size={16} />
          Back to main page
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
