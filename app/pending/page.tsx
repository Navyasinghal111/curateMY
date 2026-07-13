'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

type Application = {
  status: string
  instagram_handle: string | null
  instagram_verified_username: string | null
  instagram_connection_status: string | null
}

const INK = '#1a1a1a'
const MUTED = '#888'
const ACCENT = '#8B1A1A'
const BORDER = '#ddd'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight:'100vh', background:'#F0EDE8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans, system-ui, sans-serif', textAlign:'center', padding:24 }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />
      {children}
    </div>
  )
}

const IG_ERROR_COPY: Record<string, string> = {
  denied: "Instagram connection didn't complete — no problem, your entered handle is still submitted.",
  ineligible_account_type: "That Instagram account isn't a Business or Creator account, so we can't confirm it automatically — your entered handle is still on file.",
  invalid_state: 'That connection attempt could not be verified — please try connecting again.',
  no_session: 'Please log in and try connecting again.',
  application_not_found: "We couldn't find your application to attach this connection to.",
  token_failed: 'Instagram connection ran into an issue — your entered handle is still submitted, and you can try again anytime.',
  server_error: 'Instagram connection ran into an issue — your entered handle is still submitted, and you can try again anytime.',
}

function PendingContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [checking, setChecking] = useState(true)
  const [application, setApplication] = useState<Application | null>(null)
  const [connecting, setConnecting] = useState(false)

  const igSuccess = searchParams.get('ig_success') === 'true'
  const igError = searchParams.get('ig_error')
  const igHandle = searchParams.get('ig_handle')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data } = await supabase
        .from('creator_applications')
        .select('status, instagram_handle, instagram_verified_username, instagram_connection_status')
        .eq('user_id', user.id)
        .maybeSingle()

      setApplication(data ?? null)
      setChecking(false)
    }
    load()
  }, [])

  const connectInstagram = () => {
    setConnecting(true)
    window.location.href = '/api/auth/instagram'
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (checking) return (
    <Shell>
      <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontStyle:'italic', color:'#999' }}>Checking your account…</p>
    </Shell>
  )

  const isPending = application?.status === 'pending'
  const isConnected = application?.instagram_connection_status === 'connected' || igSuccess
  const connectedUsername = application?.instagram_verified_username || igHandle

  return (
    <Shell>
      <div style={{ width:56, height:56, border:`1px solid ${ACCENT}`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:ACCENT, fontSize:22, marginBottom:28 }}>✓</div>
      <p style={{ fontSize:10, letterSpacing:'0.2em', color:ACCENT, marginBottom:12, fontWeight:600 }}>STATUS — UNDER REVIEW</p>
      <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:40, fontWeight:400, color:INK, marginBottom:16, letterSpacing:'-0.02em' }}>Application received.</h1>
      <p style={{ fontSize:14, color:MUTED, lineHeight:1.7, maxWidth:360, marginBottom:28 }}>We review every creator application personally. You&apos;ll hear from us within 3–5 business days.</p>

      {!application ? (
        <p style={{ fontSize:13, color:MUTED, maxWidth:360, marginBottom:28 }}>
          We couldn&apos;t find an application on your account. If you believe this is a mistake, please contact us.
        </p>
      ) : (
        <div style={{ width:'100%', maxWidth:360, background:'#fff', border:`1px solid ${BORDER}`, borderRadius:10, padding:'20px 22px', marginBottom:28, textAlign:'left' }}>
          <p style={{ fontSize:11, letterSpacing:'0.1em', color:MUTED, textTransform:'uppercase', marginBottom:10 }}>Instagram</p>

          <p style={{ fontSize:13, color:INK, marginBottom:6 }}>
            As entered: {application.instagram_handle ? application.instagram_handle : <span style={{ color:MUTED }}>Not provided</span>}
          </p>

          {isConnected ? (
            <p style={{ fontSize:13, color:ACCENT, marginTop:8 }}>
              ✓ Connected via Instagram{connectedUsername ? ` — @${connectedUsername.replace(/^@/, '')}` : ''}
            </p>
          ) : igError ? (
            <p style={{ fontSize:12, color:MUTED, lineHeight:1.6, marginTop:8 }}>
              {IG_ERROR_COPY[igError] ?? 'Instagram connection ran into an issue — your entered handle is still submitted, and you can try again anytime.'}
            </p>
          ) : isPending ? (
            <>
              <p style={{ fontSize:12, color:MUTED, lineHeight:1.6, marginTop:8, marginBottom:14 }}>
                Optional. The handle you entered is already submitted — connecting just lets us confirm it&apos;s really you.
              </p>
              <button onClick={connectInstagram} disabled={connecting}
                style={{ width:'100%', padding:'11px 20px', background:'#fff', border:`1px solid ${INK}`, borderRadius:6, fontSize:12, letterSpacing:'0.04em', color:INK, cursor: connecting ? 'default' : 'pointer', fontFamily:'inherit', opacity: connecting ? 0.6 : 1 }}>
                {connecting ? 'REDIRECTING…' : 'CONNECT INSTAGRAM FOR FASTER REVIEW'}
              </button>
            </>
          ) : null}
        </div>
      )}

      <button onClick={signOut}
        style={{ padding:'11px 28px', background:'none', border:'1px solid #ccc', fontSize:12, color:'#555', cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.06em' }}>
        Back to CurateKin
      </button>
    </Shell>
  )
}

export default function PendingPage() {
  return (
    <Suspense fallback={
      <Shell>
        <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontStyle:'italic', color:'#999' }}>Loading…</p>
      </Shell>
    }>
      <PendingContent />
    </Suspense>
  )
}
