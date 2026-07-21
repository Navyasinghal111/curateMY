import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceRoleClient, type User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

type SignupRole = 'creator' | 'shopper'

function text(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function textList(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function flag(metadata: Record<string, unknown>, key: string) {
  return metadata[key] === true
}

function roleFromMetadata(metadata: Record<string, unknown>): SignupRole | null {
  return metadata.role === 'creator' || metadata.role === 'shopper' ? metadata.role : null
}

function displayNameFor(user: User, metadata: Record<string, unknown>) {
  const fullName = [text(metadata, 'first_name'), text(metadata, 'last_name')]
    .filter(Boolean)
    .join(' ')
  return text(metadata, 'display_name') || fullName || user.email?.split('@')[0] || 'CurateKin member'
}

// Confirmation links land here before any app page renders. Provisioning on
// the server means a confirmed account cannot depend on a browser effect to
// become visible to the creator review queue.
async function provisionConfirmedUser(user: User) {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
  const role = roleFromMetadata(metadata)
  const email = user.email?.trim()
  if (!role || !email) throw new Error('missing_signup_metadata')

  const displayName = displayNameFor(user, metadata)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('missing_service_role_key')

  const admin = createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const profile = {
    id: user.id,
    status: 'pending',
    role,
    display_name: displayName,
    phone: text(metadata, 'phone'),
    primary_platform: text(metadata, 'primary_platform'),
    primary_handle: text(metadata, 'primary_handle'),
    primary_followers: text(metadata, 'primary_followers'),
    secondary_platform: text(metadata, 'secondary_platform'),
    secondary_handle: text(metadata, 'secondary_handle'),
    secondary_followers: text(metadata, 'secondary_followers'),
    engagement_rate: text(metadata, 'engagement_rate'),
    niches: textList(metadata, 'niches'),
    content_language: text(metadata, 'content_language'),
    bio: text(metadata, 'bio'),
    referral_code: text(metadata, 'referral_code'),
    source: text(metadata, 'source'),
    instagram_handle: text(metadata, 'instagram_handle'),
    instagram_verified: flag(metadata, 'instagram_verified'),
    upi_id: null,
    pan_number: null,
    agreed_tos: flag(metadata, 'agreed_tos'),
    agreed_affiliate: flag(metadata, 'agreed_affiliate'),
  }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert(profile, { onConflict: 'id', ignoreDuplicates: true })
  if (profileError) throw new Error('profile_provision_failed')

  if (role === 'creator') {
    const { error: applicationError } = await admin
      .from('creator_applications')
      .upsert({
        user_id: user.id,
        email,
        display_name: displayName,
        phone: text(metadata, 'phone'),
        primary_platform: text(metadata, 'primary_platform'),
        primary_handle: text(metadata, 'primary_handle'),
        primary_followers: text(metadata, 'primary_followers'),
        secondary_platform: text(metadata, 'secondary_platform'),
        secondary_handle: text(metadata, 'secondary_handle'),
        secondary_followers: text(metadata, 'secondary_followers'),
        engagement_rate: text(metadata, 'engagement_rate'),
        niches: textList(metadata, 'niches'),
        content_language: text(metadata, 'content_language'),
        bio: text(metadata, 'bio'),
        instagram_handle: text(metadata, 'instagram_handle'),
        instagram_verified: flag(metadata, 'instagram_verified'),
        brands_worked_with: text(metadata, 'brands_worked_with'),
        status: 'pending',
      }, { onConflict: 'user_id', ignoreDuplicates: true })
    if (applicationError) throw new Error('application_provision_failed')
  }

  return role
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const code = request.nextUrl.searchParams.get('code')
  const requestedNext = request.nextUrl.searchParams.get('next')
  const fallbackPath = requestedNext === '/pending' ? '/pending' : '/'
  const response = NextResponse.redirect(new URL(fallbackPath, origin))

  if (!code) return NextResponse.redirect(new URL('/signup/confirm?setup=invalid', origin))

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return NextResponse.redirect(new URL('/signup/confirm?setup=invalid', origin))

  try {
    const role = await provisionConfirmedUser(data.user)
    response.headers.set('Cache-Control', 'no-store')
    if (role === 'creator' && fallbackPath !== '/pending') response.headers.set('Location', new URL('/pending', origin).toString())
    return response
  } catch {
    // Do not expose database details to a new member. The legacy confirmation
    // page remains a safe retry path for an already-confirmed session.
    response.headers.set('Location', new URL('/signup/confirm?setup=retry', origin).toString())
    return response
  }
}
