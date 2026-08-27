'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

import { AppError } from '@/shared/api'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry(failureCount, e) {
              if (e instanceof AppError && e.options.statusCode === 404) return false
              if (e && typeof e === 'object' && 'statusCode' in e && e.statusCode === 404)
                return false
              return failureCount < 2
            },
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
