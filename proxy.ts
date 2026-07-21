import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ACCESS_KEY = 'billiondollarcompany'
const COOKIE_NAME = 'ck_access'
const SITE_LIVE = false

export function proxy(request: NextRequest) {
  if (SITE_LIVE) return NextResponse.next()

  const { pathname, searchParams } = request.nextUrl

  // Always allow these paths
  if (
    pathname.startsWith('/under-construction') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/affiliate-policy') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/pending') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('favicon')
  ) {
    return NextResponse.next()
  }

  const cookieOk = request.cookies.get(COOKIE_NAME)?.value === ACCESS_KEY
  const urlKey = searchParams.get('key')

  if (urlKey === ACCESS_KEY) {
    const response = NextResponse.next()
    // Session cookie — expires when browser closes, no maxAge
    response.cookies.set(COOKIE_NAME, ACCESS_KEY, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    })
    return response
  }

  if (cookieOk) return NextResponse.next()

  return NextResponse.redirect(new URL('/under-construction', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}