'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { logEvent } from '@/lib/logEvent'
import { useRouter } from 'next/navigation'

type Stage = 'checking' | 'error' | 'creator-done' | 'shopper-done'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight:'100vh', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'DM Sans, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      {children}
    </div>
  )
}

export default function SignupConfirmPage() {
  const [stage, setStage] = useState<Stage>('checking')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErrorMsg('This confirmation link is invalid or has expired.')
        setStage('error')
        return
      }

      const meta = user.user_metadata ?? {}
      const role = meta.role === 'creator' || meta.role === 'shopper' ? meta.role : null

      const { data: existing } = await supabase.from('profiles').select('id, role').eq('id', user.id).maybeSingle()

      if (!existing) {
        if (!role) {
          setErrorMsg('Your email is confirmed, but we could not find your signup details. Please try signing up again.')
          setStage('error')
          return
        }
        // Single shape for both roles — a shopper's metadata simply never set
        // the creator-only fields, so they fall back to null/[]/false here
        // rather than being absent, which is what was tripping up insert()'s
        // typing (two branches with genuinely different keys = a union type
        // Supabase's insert() rejects).
        const insertFields = {
          id: user.id, status: 'pending', role,
          display_name: meta.display_name ?? null, phone: meta.phone ?? null,
          primary_platform: meta.primary_platform ?? null, primary_handle: meta.primary_handle ?? null,
          primary_followers: meta.primary_followers ?? null,
          secondary_platform: meta.secondary_platform ?? null, secondary_handle: meta.secondary_handle ?? null,
          secondary_followers: meta.secondary_followers ?? null, engagement_rate: meta.engagement_rate ?? null,
          niches: meta.niches ?? [], content_language: meta.content_language ?? null, bio: meta.bio ?? null,
          referral_code: meta.referral_code ?? null, source: meta.source ?? null,
          instagram_handle: meta.instagram_handle ?? null, instagram_verified: meta.instagram_verified ?? false,
          upi_id: meta.upi_id ?? null, pan_number: meta.pan_number ?? null,
          agreed_tos: meta.agreed_tos ?? false, agreed_affiliate: meta.agreed_affiliate ?? false,
        }

        const { error: insertErr } = await supabase.from('profiles').insert(insertFields)
        if (insertErr) {
          setErrorMsg(`Your email is confirmed, but we couldn't finish setting up your account: ${insertErr.message}`)
          setStage('error')
          return
        }
      }

      const finalRole = existing?.role ?? role
      logEvent(supabase, 'email_confirmed', { creatorId: finalRole === 'creator' ? user.id : null, metadata: { type: finalRole } })
      setStage(finalRole === 'creator' ? 'creator-done' : 'shopper-done')
    }
    run()
  }, [])

  if (stage === 'checking') return (
    <Shell>
      <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, fontStyle:'italic', color:'#C4BEB6' }}>Confirming your account…</p>
    </Shell>
  )

  if (stage === 'error') return (
    <Shell>
      <div style={{ width:48, height:48, border:'1.5px solid #c0392b', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:20, color:'#c0392b' }}>×</div>
      <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:300, color:'#0A0A0A', marginBottom:14, textAlign:'center', lineHeight:1.1 }}>Something went wrong.</h1>
      <p style={{ fontSize:14, color:'#6B6B6B', maxWidth:340, textAlign:'center', lineHeight:1.7, marginBottom:36 }}>{errorMsg}</p>
      <div style={{ display:'flex', gap:12 }}>
        <button onClick={() => router.push('/signup')} style={{ padding:'12px 28px', background:'#fff', color:'#0A0A0A', border:'1px solid #E5E5E5', fontSize:12, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
          BACK TO SIGN UP
        </button>
        <button onClick={() => router.push('/login')} style={{ padding:'12px 28px', background:'#0A0A0A', color:'#fff', border:'none', fontSize:12, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
          LOG IN
        </button>
      </div>
    </Shell>
  )

  if (stage === 'creator-done') return (
    <Shell>
      <div style={{ width:48, height:48, border:'1.5px solid #0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:20 }}>✓</div>
      <p style={{ fontSize:10, letterSpacing:'0.18em', color:'#9B9B9B', marginBottom:12, textTransform:'uppercase' }}>Email confirmed</p>
      <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color:'#0A0A0A', marginBottom:14, textAlign:'center', lineHeight:1.1 }}>You&apos;re on your way.</h1>
      <p style={{ fontSize:14, color:'#6B6B6B', maxWidth:340, textAlign:'center', lineHeight:1.7, marginBottom:36 }}>We&apos;ll review your application and get back to you within 3–5 days. Keep creating.</p>
      <button onClick={() => router.push('/pending')} style={{ padding:'12px 36px', background:'#0A0A0A', color:'#fff', fontSize:12, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
        CONTINUE
      </button>
    </Shell>
  )

  return (
    <Shell>
      <div style={{ width:48, height:48, border:'1.5px solid #0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:20 }}>✓</div>
      <p style={{ fontSize:10, letterSpacing:'0.18em', color:'#9B9B9B', marginBottom:12, textTransform:'uppercase' }}>Email confirmed</p>
      <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color:'#0A0A0A', marginBottom:14, textAlign:'center', lineHeight:1.1 }}>You&apos;re on the list.</h1>
      <p style={{ fontSize:14, color:'#6B6B6B', maxWidth:340, textAlign:'center', lineHeight:1.7, marginBottom:36 }}>We&apos;re setting up your account. Check back soon to start discovering.</p>
      <button onClick={() => router.push('/')} style={{ padding:'12px 36px', background:'#0A0A0A', color:'#fff', fontSize:12, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
        BACK TO CURATEKIN
      </button>
    </Shell>
  )
}
