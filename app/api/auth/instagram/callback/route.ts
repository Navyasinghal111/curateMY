import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceRoleClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const STATE_COOKIE = 'ck_ig_oauth_state'

type ErrorCode =
  | 'no_session'
  | 'invalid_state'
  | 'denied'
  | 'application_not_found'
  | 'token_failed'
  | 'ineligible_account_type'
  | 'server_error'

// Verifies the signed state cookie against Meta's returned `state` and the
// currently-authenticated user in one pass: correct signature (constant-time
// compare), not expired, state value matches, and — critically — the user
// this state was issued for matches the user making this request right now.
function verifyState(cookieValue: string | undefined, returnedState: string, currentUserId: string): boolean {
  if (!cookieValue || !returnedState) return false
  const separator = cookieValue.lastIndexOf('.')
  if (separator === -1) return false

  const payload = cookieValue.slice(0, separator)
  const signature = cookieValue.slice(separator + 1)

  const expectedSignature = crypto
    .createHmac('sha256', process.env.INSTAGRAM_APP_SECRET!)
    .update(payload)
    .digest('base64url')

  const provided = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return false
  }

  let parsed: { state?: string; userId?: string; exp?: number }
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return false
  }

  if (!parsed.state || !parsed.userId || !parsed.exp) return false
  if (Date.now() > parsed.exp) return false
  if (parsed.state !== returnedState) return false
  if (parsed.userId !== currentUserId) return false
  return true
}

// Meta returns account_type as BUSINESS / MEDIA_CREATOR / PERSONAL.
// instagram_business_basic only works for the first two — a Personal
// account maps to null here, treated as ineligible, not a generic failure.
function mapAccountType(raw: unknown): 'business' | 'creator' | null {
  const value = typeof raw === 'string' ? raw.toUpperCase() : ''
  if (value === 'BUSINESS') return 'business'
  if (value === 'MEDIA_CREATOR' || value === 'CREATOR') return 'creator'
  return null
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  // Every exit from this route goes through here — always clears the
  // single-use state cookie, whether the outcome was success or failure.
  const redirect = (params: string) => {
    const res = NextResponse.redirect(`${baseUrl}/pending?${params}`)
    res.cookies.set(STATE_COOKIE, '', { maxAge: 0, path: '/api/auth/instagram' })
    return res
  }
  const fail = (code: ErrorCode) => redirect(`ig_error=${code}`)

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    // 1. Session — verified server-side. Never trusted from the query
    // string or any other client-supplied value.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fail('no_session')

    // 2. State — present, correctly signed, unexpired, matches Meta's
    // returned state, and bound to this exact authenticated user.
    const returnedState = request.nextUrl.searchParams.get('state') ?? ''
    const stateCookie = cookieStore.get(STATE_COOKIE)?.value
    if (!verifyState(stateCookie, returnedState, user.id)) {
      return fail('invalid_state')
    }

    // 3. Meta-reported denial/cancellation, or a missing code — a normal
    // "didn't finish connecting" outcome, not a security failure.
    const code = request.nextUrl.searchParams.get('code')
    const metaError = request.nextUrl.searchParams.get('error')
    if (metaError || !code) return fail('denied')

    // 4. The application row must already exist — this route only ever
    // updates an existing applicant's own row, never creates one. Read via
    // the normal session-scoped client: RLS already permits an applicant
    // to read their own row, so no elevated privilege is needed here.
    const { data: application } = await supabase
      .from('creator_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!application) return fail('application_not_found')

    // 5. Server-side code exchange — unchanged mechanics from before.
    const redirectUri = `${baseUrl}/api/auth/instagram/callback`
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID!,
        client_secret: process.env.INSTAGRAM_APP_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) return fail('token_failed')

    const shortToken = tokenData.access_token as string

    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortToken}`
    )
    const longTokenData = await longTokenRes.json()
    const longToken = (longTokenData.access_token as string | undefined) || shortToken

    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,name,account_type&access_token=${longToken}`
    )
    const profile = await profileRes.json()
    if (!profile?.id || !profile?.username) return fail('token_failed')
    // shortToken/longToken are not read again after this point and are
    // never written anywhere — discarded with the rest of this request's
    // local state once the function returns. No token is persisted.

    // 6. Account-type eligibility — instagram_business_basic only works
    // for Business/Creator accounts; a Personal account fails here,
    // distinctly from a generic token failure.
    const accountType = mapAccountType(profile.account_type)
    if (!accountType) return fail('ineligible_account_type')

    // 7. The write. Server-only service-role client, instantiated only
    // now, after every check above has passed — touches only the five
    // verification columns, scoped to this exact user's own,
    // still-pending application row. Never imported by or exposed to any
    // client-side code.
    const serviceRoleClient = createServiceRoleClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error: updateErr } = await serviceRoleClient
      .from('creator_applications')
      .update({
        instagram_verified_username: profile.username,
        instagram_account_id: String(profile.id),
        instagram_account_type: accountType,
        instagram_verified_at: new Date().toISOString(),
        instagram_connection_status: 'connected',
      })
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (updateErr) {
      // Deliberately not logging updateErr's full contents here — keep
      // failure logging minimal so nothing sensitive can end up in it.
      console.error('Instagram verification write failed')
      return fail('server_error')
    }

    return redirect(`ig_success=true&ig_handle=${encodeURIComponent(profile.username)}&ig_account_type=${accountType}`)
  } catch {
    // No error detail logged here — this catches anything unexpected in
    // the chain above, and never risking a token or key ending up in logs
    // takes priority over a more detailed error message.
    console.error('Instagram OAuth callback error')
    return fail('server_error')
  }
}
