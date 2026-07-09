import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  const publicPaths = ['/', '/auth', '/api/auth']
  const isPublic = publicPaths.some(p => path === p || path.startsWith(`${p}/`))
  const refreshToken = request.cookies.get('refreshToken')?.value

  if (!isPublic) {
    if (!refreshToken) return NextResponse.redirect(new URL('/auth', request.url))
  }

  if (path.startsWith('/auth') && refreshToken)
    return NextResponse.redirect(new URL('/dashboard', request.url))

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
