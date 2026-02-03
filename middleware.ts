import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'session'
const publicPaths = ['/login', '/api/auth/login', '/api/auth/session', '/api/auth/logout', '/api/auth/setup']

function hasValidSessionCookie(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  return !!cookie && cookie.includes('.') && cookie.length > 20
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (pathname === '/login') {
      if (hasValidSessionCookie(request)) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
    return NextResponse.next()
  }

  if (!hasValidSessionCookie(request)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|logo.jpg|logo.svg).*)',
  ],
}
