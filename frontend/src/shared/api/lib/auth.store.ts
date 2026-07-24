import { create } from 'zustand'

interface AuthStore {
  refreshPromise: Promise<boolean> | null
  accessToken: string | null
  setAccessToken: (token: string) => void
  clearAccessToken: () => void
}

export const useAuthStore = create<AuthStore>(set => ({
  refreshPromise: null,
  accessToken: null,

  setAccessToken: token => set({ accessToken: token, refreshPromise: null }),
  clearAccessToken: () => set({ accessToken: null, refreshPromise: null }),
}))
