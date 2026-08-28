'use client'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const errorDetails = {
    name: error.name,
    message: error.message,
    code: 'code' in error ? error.code : undefined,
    statusCode: 'statusCode' in error ? error.statusCode : undefined,
    digest: error.digest,
    stack: error.stack,
  }

  return (
    <html lang="en">
      <body className="bg-[#080a08] min-h-screen flex items-center justify-center p-6 custom-scrollbar">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
            <AlertTriangle size={20} className="text-red-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Something went wrong
            </h1>
            <p className="text-sm text-zinc-400">
              A critical application error has occurred. Please try refreshing the page.
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

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00e676] px-5 py-2.5 text-sm font-medium text-black transition-all hover:brightness-110 active:brightness-90"
            >
              <RefreshCw size={16} />
              Try again
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
            >
              Back to the main page
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}

interface GlobalErrorProps {
  error: Error & { digest?: string; code?: string; statusCode?: number }
  reset: () => void
}
