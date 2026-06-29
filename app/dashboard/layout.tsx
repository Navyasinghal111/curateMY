'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

const NAV = [
  { label: 'My Shop',           href: '/dashboard' },
  { label: 'My Products',       href: '/dashboard/products' },
  { label: 'Earnings',          href: '/dashboard/earnings' },
  { label: 'Analytics',         href: '/dashboard/analytics' },
  { label: 'Settings',          href: '/dashboard/settings' },
]

const PREVIEW_PROFILE = {
  display_name: 'Navya Singhal',
  username: 'navya',
  instagram_handle: 'navya',
  status: 'approved',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile]   = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setProfile(PREVIEW_PROFILE); setLoading(false); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!data) { setProfile(PREVIEW_PROFILE); setLoading(false); return }
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
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', fontFamily:'Cormorant Garamond, serif', fontSize:24, color:'#ccc', fontStyle:'italic' }}>
      Loading…
    </div>
  )

  const initials = profile?.display_name?.split(' ').map((w:string) => w[0]).join('').toUpperCase().slice(0,2) ?? 'CK'

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .nav-tab { display:flex; align-items:center; padding:0 16px; height:100%; font-size:13px; font-weight:400; color:rgba(255,255,255,0.55); text-decoration:none; border-bottom:2px solid transparent; transition:all 0.15s; white-space:nowrap; }
        .nav-tab:hover { color:rgba(255,255,255,0.9); }
        .nav-tab.active { color:#fff; border-bottom-color:#fff; font-weight:500; }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#fff' }}>

        {/* Top nav — dark like ShopMy */}
        <nav style={{ background:'#1A1A1A', height:56, display:'flex', alignItems:'stretch', position:'sticky', top:0, zIndex:100, borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', padding:'0 24px', borderRight:'0.5px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
            <a href="/" style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:300, color:'#fff', textDecoration:'none' }}>
              Curate<em style={{ fontStyle:'italic', color:'#C99A6A' }}>Kin</em>
            </a>
          </div>

          {/* Nav tabs */}
          <div style={{ display:'flex', alignItems:'stretch', flex:1, overflowX:'auto' }}>
            {NAV.map(item => (
              <a key={item.href} href={item.href}
                className={`nav-tab${pathname === item.href ? ' active' : ''}`}>
                {item.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0 20px', borderLeft:'0.5px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
            <a href={`/${profile?.username}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize:11, color:'rgba(255,255,255,0.5)', textDecoration:'none', letterSpacing:'0.08em', border:'0.5px solid rgba(255,255,255,0.2)', padding:'6px 14px', borderRadius:4, transition:'all 0.15s', whiteSpace:'nowrap' }}>
              VIEW STOREFRONT ↗
            </a>
            <div style={{ position:'relative' }}>
              <button onClick={() => setMenuOpen(m => !m)} style={{ width:32, height:32, borderRadius:'50%', background:'#B07D4A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'#fff', border:'none', cursor:'pointer' }}>
                {initials}
              </button>
              {menuOpen && (
                <div style={{ position:'absolute', top:40, right:0, background:'#fff', border:'0.5px solid #E5E5E5', borderRadius:8, padding:'8px 0', minWidth:160, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:200 }}>
                  <div style={{ padding:'8px 16px 10px', borderBottom:'0.5px solid #F0F0F0' }}>
                    <p style={{ fontSize:13, fontWeight:500, color:'#0A0A0A' }}>{profile?.display_name}</p>
                    <p style={{ fontSize:11, color:'#9B9B9B' }}>Creator</p>
                  </div>
                  <a href="/dashboard/settings" style={{ display:'block', padding:'8px 16px', fontSize:13, color:'#0A0A0A', textDecoration:'none' }}>Settings</a>
                  <a href={`/${profile?.username}`} target="_blank" style={{ display:'block', padding:'8px 16px', fontSize:13, color:'#0A0A0A', textDecoration:'none' }}>View storefront</a>
                  <button onClick={signOut} style={{ display:'block', width:'100%', padding:'8px 16px', fontSize:13, color:'#E53E3E', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main style={{ background:'#fff', minHeight:'calc(100vh - 56px)' }}>
          {children}
        </main>

      </div>
    </>
  )
}