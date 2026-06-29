'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

const NAV = [
  { label: 'Storefront',      href: '/dashboard' },
  { label: 'My Shop',         href: '/dashboard/products' },
  { label: 'Links',           href: '/dashboard/links' },
  { label: 'Gifting & Codes', href: '/dashboard/gifting' },
  { label: 'Opportunities',   href: '/dashboard/opportunities' },
  { label: 'Earnings',        href: '/dashboard/earnings' },
  { label: 'Chat',            href: '/dashboard/chat' },
  { label: 'Latest',          href: '/dashboard/latest' },
]

const PREVIEW_PROFILE = {
  display_name: 'Navya Singhal',
  username: 'navya',
  instagram_handle: 'navya',
  status: 'approved',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile,  setProfile]  = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
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
        body { background: #F8F6F2; font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .nav-tab { display:flex; align-items:center; padding:0 20px; height:100%; font-size:14px; font-weight:400; color:rgba(255,255,255,0.45); text-decoration:none; transition:color 0.15s; white-space:nowrap; }
        .nav-tab:hover { color:rgba(255,255,255,0.8); }
        .nav-tab.active { color:#fff; font-weight:600; }
        .dropdown-item { display:block; padding:9px 16px; font-size:13px; color:#0A0A0A; text-decoration:none; transition:background 0.1s; }
        .dropdown-item:hover { background:#F5F5F5; }
      `}</style>

      <div style={{ minHeight:'100vh' }}>

        {/* Single nav bar — everything in one */}
        <nav style={{ background:'#0A0A0A', height:52, display:'flex', alignItems:'stretch', position:'sticky', top:0, zIndex:100 }}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', padding:'0 28px', borderRight:'0.5px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
            <a href="/" style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:300, color:'#fff', textDecoration:'none' }}>
              Curate<em style={{ fontStyle:'italic', color:'#C99A6A' }}>Kin</em>
            </a>
          </div>

          {/* Nav tabs */}
          <div style={{ display:'flex', alignItems:'stretch', flex:1, overflowX:'auto' }}>
            <style>{`.nav-tabs::-webkit-scrollbar{display:none}`}</style>
            <div className="nav-tabs" style={{ display:'flex', alignItems:'stretch' }}>
              {NAV.map(item => (
                <a key={item.href} href={item.href}
                  className={`nav-tab${pathname === item.href ? ' active' : ''}`}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Right — search + add piece + avatar */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 16px', borderLeft:'0.5px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
            <input
              placeholder="Search your closet"
              style={{ background:'rgba(255,255,255,0.08)', border:'0.5px solid rgba(255,255,255,0.15)', color:'#fff', padding:'7px 14px', fontSize:12, outline:'none', fontFamily:'inherit', width:200 }}
            />
            <a href="/dashboard/products?add=true"
              style={{ background:'#fff', color:'#0A0A0A', padding:'7px 16px', fontSize:12, fontWeight:500, textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.04em' }}>
              + ADD PIECE
            </a>

            {/* Avatar + dropdown */}
            <div style={{ position:'relative' }}>
              <button
                onClick={() => setMenuOpen(m => !m)}
                style={{ width:32, height:32, borderRadius:'50%', background:'#B07D4A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'#fff', border:'none', cursor:'pointer', flexShrink:0 }}>
                {initials}
              </button>
              {menuOpen && (
                <>
                  <div onClick={() => setMenuOpen(false)} style={{ position:'fixed', inset:0, zIndex:150 }} />
                  <div style={{ position:'absolute', top:40, right:0, background:'#fff', border:'0.5px solid #E5E5E5', borderRadius:8, padding:'8px 0', minWidth:180, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:200 }}>
                    <div style={{ padding:'10px 16px 12px', borderBottom:'0.5px solid #F0F0F0', marginBottom:4 }}>
                      <p style={{ fontSize:13, fontWeight:500, color:'#0A0A0A' }}>{profile?.display_name}</p>
                      <p style={{ fontSize:11, color:'#B07D4A', letterSpacing:'0.06em' }}>CREATOR</p>
                    </div>
                    <a href="/dashboard/settings" className="dropdown-item">Settings</a>
                    <a href={`/${profile?.username}`} target="_blank" className="dropdown-item">View storefront</a>
                    <div style={{ borderTop:'0.5px solid #F0F0F0', marginTop:4, paddingTop:4 }}>
                      <button onClick={signOut} style={{ display:'block', width:'100%', padding:'9px 16px', fontSize:13, color:'#E53E3E', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main style={{ minHeight:'calc(100vh - 52px)' }}>
          {children}
        </main>

      </div>
    </>
  )
}