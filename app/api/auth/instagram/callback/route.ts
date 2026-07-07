import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const redirectUri = `${baseUrl}/api/auth/instagram/callback`
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/signup/creator?ig_error=denied`)
  }

  try {
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
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${baseUrl}/signup/creator?ig_error=token_failed`)
    }

    const shortToken = tokenData.access_token
    const igUserId = tokenData.user_id

    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortToken}`
    )
    const longTokenData = await longTokenRes.json()
    const longToken = longTokenData.access_token || shortToken

    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,name&access_token=${longToken}`
    )
    const profile = await profileRes.json()

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('profiles').update({
        instagram_handle: profile.username,
        instagram_id: String(igUserId),
        instagram_verified: true,
      }).eq('id', user.id)
    }

    return NextResponse.redirect(
      `${baseUrl}/signup/creator?ig_success=true&ig_handle=${profile.username}`
    )
  } catch (err) {
    console.error('Instagram OAuth error:', err)
    return NextResponse.redirect(`${baseUrl}/signup/creator?ig_error=server_error`)
  }
}