import { LoginButton } from '@telegram-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useSignInTelegram, type AuthViaTelegramRequest } from '@/entities/auth'

export function OAuthButtons() {
  const { mutate: authTelegram } = useSignInTelegram()
  const router = useRouter()

  const handleTelegramAuth = async (body: AuthViaTelegramRequest) => {
    authTelegram(body)
    router.push('/dashboard')
  }

  const [domainOk, setDomainOk] = useState(true)

  useEffect(() => {
    const isHttps = window.location.protocol === 'https:'
    const isAllowedHost = window.location.origin.startsWith(process.env.NEXT_PUBLIC_APP_URL || '')
    setDomainOk(isHttps && isAllowedHost)
  }, [])

  if (!domainOk)
    return (
      <div className="w-full mb-6 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
        Login via Telegram is unavailable: domain is invalid
      </div>
    )

  return (
    <div className="flex flex-col items-ceter gap-2.5 mb-6">
      <LoginButton
        botUsername="live_wave_bot"
        buttonSize="large"
        cornerRadius={6}
        showAvatar={false}
        onAuthCallback={(body: AuthViaTelegramRequest) => void handleTelegramAuth(body)}
      />
    </div>
  )
}
