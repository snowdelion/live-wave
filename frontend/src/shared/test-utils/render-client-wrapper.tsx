import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react'
import type { ReactElement } from 'react'

export function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return { Wrapper, queryClient }
}

export const renderWithClient = (ui: ReactElement, options?: RenderOptions): RenderResult => {
  const { Wrapper } = createWrapper()
  return render(ui, { wrapper: Wrapper, ...options })
}

export function renderHookWithClient<T>(
  hook: () => T,
  options?: Omit<RenderHookOptions<T>, 'wrapper'>,
) {
  const { Wrapper, queryClient } = createWrapper()
  const result = renderHook(hook, { wrapper: Wrapper, ...options })
  return { ...result, queryClient }
}

export { screen, fireEvent, waitFor } from '@testing-library/react'
