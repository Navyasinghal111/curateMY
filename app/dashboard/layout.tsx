'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

const NAV = [
  { label: 'Dashboard',   href: '/dashboard',            icon: '⊞' },
  { label: 'My Products', href: '/dashboard/products',   icon: '◈' },
  { label: 'Storefront',  href: '/dashboard/storefront', icon: '⊕' },
  { label: 'Earnings',    href: '/dashboard/earnings',   icon: '◎' },
  { label: 'Analytics',   href: '/dashboard/analytics',  icon: '▦' },
  { label: 'Settings',    href: '/dashboard/settings',   icon: '⊙' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!data) { router.push('/login'); return }
      if (data.status !== 'approved') { router.push('/pending'); return }
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FAFAF8', fontFamily:'Cormorant Garamond, serif', fontSize:24, color:'#C4BEB6', fontStyle:'italic' }}>
      Loading…
    </div>
  )

  const initials = profile?.display_name?.split(' ').map((w:string) => w[0]).join('').toUpperCase().slice(0,2) ?? 'CK'

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F4F2EE; font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <div style={{ display:'flex', minHeight:'100vh' }}>

        {/* Sidebar */}
        <aside style={{ width:240, background:'#141210', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:100 }}>
          <div style={{ padding:'28px 24px 24px', borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
            <a href="/" style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:300, color:'#fff', textDecoration:'none' }}>
              Curate<em style={{ fontStyle:'italic', color:'#C99A6A' }}>Kin</em>
            </a>
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:4, letterSpacing:'0.1em' }}>CREATOR STUDIO</p>
          </div>

          <nav style={{ flex:1, padding:'16px 0' }}>
            {NAV.map(item => {
              const active = pathname === item.href
              return (
                <a key={item.href} href={item.href} style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'11px 24px', fontSize:13,
                  fontWeight: active ? 500 : 300,
                  color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                  textDecoration:'none',
                  background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  borderLeft: active ? '2px solid #B07D4A' : '2px solid transparent',
                  transition:'all 0.15s',
                }}>
                  <span style={{ fontSize:14, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                  {item.label}
                </a>
              )
            })}
          </nav>

          <div style={{ padding:'20px 24px', borderTop:'0.5px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'#B07D4A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'#fff', flexShrink:0 }}>
                {initials}
              </div>
              <div>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:500 }}>{profile?.display_name}</p>
                <p style={{ fontSize:10, color:'#B07D4A', letterSpacing:'0.08em' }}>CREATOR</p>
              </div>
            </div>
            <button onClick={signOut} style={{ fontSize:11, color:'rgba(255,255,255,0.25)', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'inherit', letterSpacing:'0.06em' }}>
              SIGN OUT
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ marginLeft:240, flex:1, minHeight:'100vh', background:'#F4F2EE' }}>
          <div style={{ background:'#fff', borderBottom:'0.5px solid rgba(20,18,16,0.07)', padding:'16px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
            <p style={{ fontSize:12, color:'#8C867E' }}>
              curatekin.com/<span style={{ color:'#B07D4A' }}>{profile?.username ?? profile?.instagram_handle ?? 'you'}</span>
            </p>
            <a href={`/${profile?.username}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize:11, color:'#B07D4A', textDecoration:'none', letterSpacing:'0.08em', border:'0.5px solid rgba(176,125,74,0.3)', padding:'6px 14px', borderRadius:100 }}>
              VIEW STOREFRONT ↗
            </a>
          </div>
          <div style={{ padding:'40px' }}>
            {children}
          </div>
        </main>
      </div>
    </>
  )
}