'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const supabase = createClient()
  const router   = useRouter()

  const signIn = async () => {
    if (!email || !password) { setError('Please enter your email and password'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }

    // Check profile status
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Something went wrong'); setLoading(false); return }

    const { data: profile } = await supabase.from('profiles').select('status, role').eq('id', user.id).single()

    if (!profile) { router.push('/dashboard'); return }
    if (profile.status === 'pending') { router.push('/pending'); return }
    if (profile.status === 'approved') { router.push('/dashboard'); return }
    router.push('/dashboard')
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FAFAF8; font-family: 'DM Sans', system-ui, sans-serif; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#FAFAF8', padding:24 }}>

        {/* Logo */}
        <a href="/" style={{ fontFamily:'Cormorant Garamond, serif', fontSize:28, fontWeight:300, color:'#141210', textDecoration:'none', marginBottom:48 }}>
          Curate<em style={{ fontStyle:'italic', color:'#B07D4A' }}>Kin</em>
        </a>

        {/* Card */}
        <div style={{ width:'100%', maxWidth:400, background:'#fff', border:'0.5px solid rgba(20,18,16,0.1)', padding:'40px 36px' }}>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:28, fontWeight:300, color:'#141210', marginBottom:6 }}>Welcome back</h1>
          <p style={{ fontSize:13, color:'#8C867E', marginBottom:32 }}>Sign in to your creator account</p>

          {error && (
            <div style={{ background:'rgba(192,57,43,0.06)', border:'0.5px solid rgba(192,57,43,0.2)', padding:'10px 14px', marginBottom:20, fontSize:12, color:'#c0392b', borderRadius:4 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:11, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && signIn()}
              placeholder="you@example.com"
              style={{ width:'100%', padding:'12px 14px', border:'0.5px solid rgba(20,18,16,0.2)', fontSize:13, outline:'none', fontFamily:'inherit', color:'#141210', background:'#fff', borderRadius:4 }}
            />
          </div>

          <div style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <label style={{ fontSize:11, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase' }}>Password</label>
              <a href="/forgot-password" style={{ fontSize:11, color:'#B07D4A', textDecoration:'none' }}>Forgot password?</a>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && signIn()}
              placeholder="••••••••"
              style={{ width:'100%', padding:'12px 14px', border:'0.5px solid rgba(20,18,16,0.2)', fontSize:13, outline:'none', fontFamily:'inherit', color:'#141210', background:'#fff', borderRadius:4 }}
            />
          </div>

          <button
            onClick={signIn}
            disabled={loading}
            style={{ width:'100%', padding:'13px', background:'#141210', color:'#fff', border:'none', fontSize:13, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.06em', opacity: loading ? 0.6 : 1, borderRadius:4 }}
          >
            {loading ? 'Signing in…' : 'SIGN IN'}
          </button>

          <p style={{ fontSize:12, color:'#8C867E', textAlign:'center', marginTop:24 }}>
            Don't have an account?{' '}
            <a href="/signup" style={{ color:'#B07D4A', textDecoration:'none', fontWeight:500 }}>Apply as a creator</a>
          </p>
        </div>

        {/* Back to site */}
        <a href="/" style={{ fontSize:12, color:'#C4BEB6', textDecoration:'none', marginTop:24, letterSpacing:'0.04em' }}>
          ← Back to CurateKin
        </a>
      </div>
    </>
  )
}