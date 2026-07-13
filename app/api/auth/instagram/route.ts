import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Short-lived, single-use — long enough to complete Meta's consent screen,
// short enough that a leaked/replayed cookie is worthless soon after.
const STATE_MAX_AGE_SECONDS = 600
const STATE_COOKIE = 'ck_ig_oauth_state'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  // Server-side session check — the "Connect Instagram" button only ever
  // renders for a signed-in creator on /pending, but this route is
  // reachable directly by anyone, so it must not trust that.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`)
  }

  // Cryptographically random, bound to this exact user, short-lived.
  // Never derived from or influenced by anything the browser sends —
  // user.id comes only from the server-verified session above.
  const state = crypto.randomBytes(32).toString('hex')
  const exp = Date.now() + STATE_MAX_AGE_SECONDS * 1000
  const payload = Buffer.from(JSON.stringify({ state, userId: user.id, exp })).toString('base64url')
  // Signed with the app's existing Instagram secret (already server-only,
  // already provisioned for this exact feature) rather than introducing a
  // separate signing secret.
  const signature = crypto
    .createHmac('sha256', process.env.INSTAGRAM_APP_SECRET!)
    .update(payload)
    .digest('base64url')

  const redirectUri = `${baseUrl}/api/auth/instagram/callback`
  const authorizeUrl = new URL('https://www.instagram.com/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', process.env.INSTAGRAM_APP_ID!)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'instagram_business_basic')
  authorizeUrl.searchParams.set('state', state)

  const response = NextResponse.redirect(authorizeUrl.toString())
  response.cookies.set(STATE_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    // Secure in production; relaxed for local http development, since
    // Set-Cookie with Secure is dropped outright by browsers over plain
    // http on a non-localhost origin.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STATE_MAX_AGE_SECONDS,
    path: '/api/auth/instagram',
  })
  return response
}
