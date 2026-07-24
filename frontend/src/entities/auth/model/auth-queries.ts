import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { useAuthStore } from '@/shared/api'

import type { AuthViaEmailRequest } from '../api/dto/auth-via-email.dto'
import type { AuthViaTelegramRequest } from '../api/dto/auth-via-telegram.dto'
import { logout } from '../api/log-out'
import { refreshToken } from '../api/refresh-token'
import { signInViaEmail } from '../api/sign-in-via-email'
import { signInViaTelegram } from '../api/sign-in-via-telegram'
import { signUpViaEmail } from '../api/sign-up-via-email'

export function useSignUpEmail() {
  const setAccessToken = useAuthStore(s => s.setAccessToken)

  return useMutation({
    mutationFn: (body: AuthViaEmailRequest) => signUpViaEmail(body),
    onSuccess: ({ accessToken }) => setAccessToken(accessToken),
  })
}

export function useSignInEmail() {
  const setAccessToken = useAuthStore(s => s.setAccessToken)

  return useMutation({
    mutationFn: (body: AuthViaEmailRequest) => signInViaEmail(body),
    onSuccess: ({ accessToken }) => setAccessToken(accessToken),
  })
}

export function useSignInTelegram() {
  const setAccessToken = useAuthStore(s => s.setAccessToken)

  return useMutation({
    mutationFn: (body: AuthViaTelegramRequest) => signInViaTelegram(body),
    onSuccess: ({ accessToken }) => setAccessToken(accessToken),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const clearAccessToken = useAuthStore(s => s.clearAccessToken)
  const router = useRouter()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAccessToken()
      queryClient.clear()
      router.push('/auth')
    },
  })
}

export function useRefreshToken() {
  const setAccessToken = useAuthStore(s => s.setAccessToken)

  return useMutation({
    mutationFn: refreshToken,
    onSuccess: ({ accessToken }) => setAccessToken(accessToken),
  })
}
