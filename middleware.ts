import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── SET THIS TO YOUR OWN SECRET ──────────────────────────────────
// Keep this out of any client-visible code. It only lives here, on the server.
const ACCESS_KEY = 'billiondollarcompany'
const COOKIE_NAME = 'ck_access'
const SITE_LIVE = false // flip to true when you're ready to launch publicly

export function middleware(request: NextRequest) {
  // Once live, skip all checks entirely
  if (SITE_LIVE) return NextResponse.next()

  const { pathname, searchParams } = request.nextUrl

  // Always allow the under-construction page itself (avoid redirect loop)
  if (pathname.startsWith('/under-construction')) {
    return NextResponse.next()
  }

  const cookieOk = request.cookies.get(COOKIE_NAME)?.value === ACCESS_KEY
  const urlKey = searchParams.get('key')

  // Owner just used the secret link — grant access via cookie
  if (urlKey === ACCESS_KEY) {
    const response = NextResponse.next()
    response.cookies.set(COOKIE_NAME, ACCESS_KEY, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    })
    return response
  }

  // Owner already has the cookie from a previous visit
  if (cookieOk) {
    return NextResponse.next()
  }

  // Everyone else gets redirected to the under-construction page
  return NextResponse.redirect(new URL('/under-construction', request.url))
}

// Apply this check to every route except static assets and the API
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}