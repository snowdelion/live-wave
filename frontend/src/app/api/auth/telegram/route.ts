import { NextResponse, type NextRequest } from 'next/server'
import z from 'zod'

import { AppError, ERROR_CODES } from '@/shared/api'

const tokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
})

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const authData = {
      id: Number(searchParams.get('id')) || 0,
      first_name: searchParams.get('first_name') || '',
      username: searchParams.get('username') || '',
      photo_url: searchParams.get('photo_url') || '',
      auth_date: Number(searchParams.get('auth_date')) || 0,
      hash: searchParams.get('hash') || '',
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'
    const { accessToken, refreshToken } = await processTelegramAuth(authData)
    return createRedirectResponse(appUrl, accessToken, refreshToken)
  } catch (e) {
    const isError = e instanceof AppError || e instanceof Error
    console.error('TELEGRAM AUTH ERROR:', isError ? e.message : String(e))
    return NextResponse.redirect(new URL('/auth?error=telegram_failed', req.url))
  }
}

async function processTelegramAuth(authData: Record<string, string | number>) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
  const apiVersion = process.env.NEXT_PUBLIC_API_VERSION || 'v1'

  const res = await fetch(`${backendUrl}/api/${apiVersion}/auth/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(authData),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new AppError({
      code: ERROR_CODES.SIGN_IN_TELEGRAM,
      message: `Status ${res.status}: ${errorText}`,
      statusCode: res.status,
    })
  }

  const rawData: unknown = await res.json()
  return tokensSchema.parse(rawData)
}

function createRedirectResponse(url: string, accessToken: string, refreshToken: string) {
  const redirectUrl = new URL('/dashboard', url)
  const nextRes = NextResponse.redirect(redirectUrl)

  nextRes.cookies.set('accessToken', accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  })

  nextRes.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })
  return nextRes
}
