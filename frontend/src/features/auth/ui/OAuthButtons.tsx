import { LoginButton } from '@telegram-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useSignInTelegram, type AuthViaTelegramRequest } from '@/entities/auth'

export function OAuthButtons() {
  const { mutateAsync: authTelegram } = useSignInTelegram()
  const router = useRouter()

  const handleTelegramAuth = async (body: AuthViaTelegramRequest) => {
    console.log('onAuthCallback started. Body::', body)
    try {
      console.log('Request to the backend')
      await authTelegram(body)
      console.log('The backend responded successfully')
      router.replace('/dashboard')
    } catch (e) {
      console.error('Authorization error:', e)
    }
  }

  const [domainOk, setDomainOk] = useState(true)

  useEffect(() => {
    const currentOrigin = window.location.origin
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const isHttps = currentOrigin.startsWith('https:')
    const isMatch = currentOrigin === appUrl

    console.group('TELEGRAM AUTH DEBUG')
    console.log('Domain:', currentOrigin)
    console.log('NEXT_PUBLIC_APP_URL:', appUrl)
    console.log('HTTPS:', isHttps)
    console.log('Domains match:', isMatch ? true : false)
    console.groupEnd()

    setDomainOk(isHttps && isMatch)
  }, [])

  if (!domainOk)
    return (
      <div className="w-full mb-6 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
        Login via Telegram is unavailable: domain is invalid
      </div>
    )

  return (
    <div className="flex flex-col gap-2.5 mb-6">
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
