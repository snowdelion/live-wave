import { LoginButton } from '@telegram-auth/react'
import { useEffect, useState } from 'react'

import { API_URL } from '@/shared/api'

export function OAuthButtons() {
  const [domainOk, setDomainOk] = useState(true)

  useEffect(() => {
    const currentOrigin = window.location.origin
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const isHttps = currentOrigin.startsWith('https:')
    const isMatch = currentOrigin === appUrl

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
        authCallbackUrl={API_URL.AUTH.SIGN_IN_TELEGRAM}
      />
    </div>
  )
}
