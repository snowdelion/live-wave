'use client'
import { AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function Error({ error, reset }: ErrorProps) {
  const errorDetails = {
    name: error.name,
    message: error.message,
    code: 'code' in error ? error.code : undefined,
    statusCode: 'statusCode' in error ? error.statusCode : undefined,
    digest: error.digest,
    stack: error.stack,
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="rounded-full bg-red-500/10 p-3 ring-1 ring-red-500/20">
        <AlertCircle size={34} className="text-red-400" />
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          An error occurred
        </h1>
        <p className="mx-auto max-w-md text-sm text-zinc-400 sm:text-base">
          This page couldn't load. Try refreshing the page.
        </p>
      </div>

      {process.env.NODE_ENV === 'development' && error && (
        <details className="w-full max-w-md rounded-lg bg-zinc-900/50 p-4 text-left">
          <summary className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-400">
            Show error details
          </summary>
          <pre className="mt-3 overflow-x-auto text-xs font-mono text-red-400">
            {JSON.stringify(errorDetails, null, 2)}
          </pre>
        </details>
      )}

      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00e676] px-5 py-2.5 text-sm font-medium text-black transition-all hover:brightness-110 active:brightness-90"
        >
          <RefreshCw size={16} />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
        >
          Back to the dashboard
        </Link>
      </div>
    </div>
  )
}

interface ErrorProps {
  error: Error & { digest?: string; code?: string; statusCode?: number }
  reset: () => void
}
