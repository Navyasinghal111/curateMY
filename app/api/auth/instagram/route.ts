import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const redirectUri = `${baseUrl}/api/auth/instagram/callback`

  const url = new URL('https://www.instagram.com/oauth/authorize')
  url.searchParams.set('client_id', process.env.INSTAGRAM_APP_ID!)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'instagram_business_basic')

  return NextResponse.redirect(url.toString())
}