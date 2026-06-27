'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ADMIN_EMAILS = ['navysirius05@gmail.com'] // add your email here

type Creator = {
  id: string
  display_name: string
  username: string
  city: string
  bio: string
  status: string
  primary_platform: string
  primary_handle: string
  primary_followers: string
  niches: string[]
  content_language: string
  instagram_handle: string
  instagram_verified: boolean
  upi_id: string
  pan_number: string
  created_at: string
  email?: string
}

export default function AdminPage() {
  const [creators, setCreators]     = useState<Creator[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<'pending'|'approved'|'rejected'>('pending')
  const [selected, setSelected]     = useState<Creator | null>(null)
  const [notes, setNotes]           = useState('')
  const [actionLoading, setAction]  = useState(false)
  const [toast, setToast]           = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
        router.push('/')
        return
      }
      loadCreators()
    }
    init()
  }, [])

  const loadCreators = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'creator')
      .order('created_at', { ascending: false })
    setCreators(data ?? [])
    setLoading(false)
  }

  const filtered = creators.filter(c => c.status === filter)

  const counts = {
    pending:  creators.filter(c => c.status === 'pending').length,
    approved: creators.filter(c => c.status === 'approved').length,
    rejected: creators.filter(c => c.status === 'rejected').length,
  }

  const approve = async (creator: Creator) => {
    setAction(true)
    await supabase.from('profiles').update({ status: 'approved', admin_notes: notes }).eq('id', creator.id)

    // Send approval email
    try {
      await fetch('/api/email/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: creator.email,
          name: creator.display_name,
          username: creator.username,
        }),
      })
    } catch (e) {
      console.error('Email failed:', e)
    }

    setCreators(prev => prev.map(c => c.id === creator.id ? { ...c, status: 'approved' } : c))
    setSelected(null)
    setNotes('')
    setAction(false)
    showToast(`✓ ${creator.display_name} approved`)
  }

  const reject = async (creator: Creator) => {
    setAction(true)
    await supabase.from('profiles').update({ status: 'rejected', admin_notes: notes }).eq('id', creator.id)
    setCreators(prev => prev.map(c => c.id === creator.id ? { ...c, status: 'rejected' } : c))
    setSelected(null)
    setNotes('')
    setAction(false)
    showToast(`${creator.display_name} rejected`)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FAFAF8', fontFamily:'Cormorant Garamond, serif', fontSize:22, color:'#C4BEB6', fontStyle:'italic' }}>
      Loading…
    </div>
  )

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F4F2EE; font-family: 'DM Sans', system-ui, sans-serif; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:24, right:24, background:'#141210', color:'#fff', padding:'12px 20px', fontSize:13, zIndex:999, borderRadius:8 }}>
          {toast}
        </div>
      )}

      <div style={{ display:'flex', minHeight:'100vh' }}>

        {/* Sidebar */}
        <aside style={{ width:260, background:'#141210', display:'flex', flexDirection:'column', padding:'32px 0', position:'fixed', top:0, left:0, bottom:0 }}>
          <div style={{ padding:'0 24px 32px', borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'#fff' }}>
              Curate<em style={{ fontStyle:'italic', color:'#C99A6A' }}>Kin</em>
            </p>
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:4, letterSpacing:'0.1em' }}>ADMIN PANEL</p>
          </div>

          <div style={{ padding:'24px' }}>
            {(['pending','approved','rejected'] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'10px 12px', marginBottom:8, background: filter===s ? 'rgba(255,255,255,0.08)' : 'none', border:'none', borderRadius:8, cursor:'pointer', color: filter===s ? '#fff' : 'rgba(255,255,255,0.4)', fontSize:13, fontFamily:'inherit', textAlign:'left' }}>
                <span style={{ textTransform:'capitalize' }}>{s}</span>
                <span style={{ background:'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:100, fontSize:11 }}>{counts[s]}</span>
              </button>
            ))}
          </div>

          <div style={{ marginTop:'auto', padding:'24px', borderTop:'0.5px solid rgba(255,255,255,0.07)' }}>
            <a href="/dashboard" style={{ fontSize:12, color:'rgba(255,255,255,0.3)', textDecoration:'none' }}>← Back to dashboard</a>
          </div>
        </aside>

        {/* Main */}
        <main style={{ marginLeft:260, flex:1, padding:'40px' }}>
          <div style={{ marginBottom:32 }}>
            <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:300, color:'#141210' }}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)} applications
            </h1>
            <p style={{ fontSize:13, color:'#8C867E', marginTop:4 }}>{filtered.length} creator{filtered.length !== 1 ? 's' : ''}</p>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', borderRadius:14, border:'0.5px solid rgba(20,18,16,0.07)' }}>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, color:'#C4BEB6' }}>No {filter} applications</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {filtered.map(c => (
                <div key={c.id}
                  onClick={() => { setSelected(c); setNotes('') }}
                  style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:12, padding:'20px 24px', cursor:'pointer', display:'flex', alignItems:'center', gap:20, transition:'box-shadow 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow='0 4px 20px rgba(20,18,16,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>

                  <div style={{ width:44, height:44, borderRadius:'50%', background:'#D4B896', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16, fontStyle:'italic', color:'#fff' }}>
                      {c.display_name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                    </span>
                  </div>

                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:500, color:'#141210', marginBottom:2 }}>{c.display_name}</p>
                    <p style={{ fontSize:12, color:'#8C867E' }}>
                      {c.city} · {c.primary_platform} · {c.primary_followers} followers
                      {c.instagram_verified && <span style={{ color:'#B07D4A', marginLeft:8 }}>✓ IG verified</span>}
                    </p>
                  </div>

                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', maxWidth:200 }}>
                    {(c.niches ?? []).slice(0,3).map(n => (
                      <span key={n} style={{ fontSize:10, padding:'3px 8px', background:'#F4F2EE', color:'#8C867E', borderRadius:100 }}>{n}</span>
                    ))}
                  </div>

                  <p style={{ fontSize:11, color:'#C4BEB6', flexShrink:0 }}>
                    {new Date(c.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Detail panel */}
        {selected && (
          <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex' }}>
            <div style={{ flex:1, background:'rgba(0,0,0,0.3)' }} onClick={() => setSelected(null)} />
            <div style={{ width:480, background:'#fff', overflowY:'auto', display:'flex', flexDirection:'column' }}>
              
              <div style={{ padding:'24px 28px', borderBottom:'0.5px solid rgba(20,18,16,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'#fff', zIndex:10 }}>
                <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:400, color:'#141210' }}>{selected.display_name}</h2>
                <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', fontSize:22, color:'#aaa', cursor:'pointer' }}>×</button>
              </div>

              <div style={{ padding:'24px 28px', flex:1 }}>
                {[
                  ['City', selected.city],
                  ['Platform', selected.primary_platform],
                  ['Handle', selected.primary_handle],
                  ['Followers', selected.primary_followers],
                  ['Language', selected.content_language],
                  ['Instagram', selected.instagram_handle ? `@${selected.instagram_handle}${selected.instagram_verified ? ' ✓' : ''}` : '—'],
                  ['UPI ID', selected.upi_id || '—'],
                  ['PAN', selected.pan_number || '—'],
                ].map(([l, v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'0.5px solid rgba(20,18,16,0.05)' }}>
                    <span style={{ fontSize:12, color:'#8C867E' }}>{l}</span>
                    <span style={{ fontSize:12, color:'#141210', fontWeight:500 }}>{v}</span>
                  </div>
                ))}

                {selected.niches?.length > 0 && (
                  <div style={{ padding:'12px 0', borderBottom:'0.5px solid rgba(20,18,16,0.05)' }}>
                    <p style={{ fontSize:12, color:'#8C867E', marginBottom:8 }}>Niches</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {selected.niches.map(n => (
                        <span key={n} style={{ fontSize:11, padding:'4px 10px', background:'#F4F2EE', color:'#141210', borderRadius:100 }}>{n}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.bio && (
                  <div style={{ padding:'12px 0', borderBottom:'0.5px solid rgba(20,18,16,0.05)' }}>
                    <p style={{ fontSize:12, color:'#8C867E', marginBottom:6 }}>Bio</p>
                    <p style={{ fontSize:13, color:'#141210', lineHeight:1.6 }}>{selected.bio}</p>
                  </div>
                )}

                <div style={{ marginTop:20 }}>
                  <label style={{ display:'block', fontSize:11, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:8 }}>Admin notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add internal notes…" rows={3}
                    style={{ width:'100%', padding:'10px 14px', border:'0.5px solid rgba(20,18,16,0.2)', fontSize:13, outline:'none', fontFamily:'inherit', color:'#141210', borderRadius:6, resize:'vertical' }} />
                </div>
              </div>

              {selected.status === 'pending' && (
                <div style={{ padding:'20px 28px', borderTop:'0.5px solid rgba(20,18,16,0.07)', display:'flex', gap:10 }}>
                  <button onClick={() => reject(selected)} disabled={actionLoading}
                    style={{ flex:1, padding:'12px', background:'none', border:'0.5px solid rgba(20,18,16,0.2)', fontSize:13, cursor:'pointer', color:'#8C867E', borderRadius:8, fontFamily:'inherit' }}>
                    Reject
                  </button>
                  <button onClick={() => approve(selected)} disabled={actionLoading}
                    style={{ flex:2, padding:'12px', background:'#141210', color:'#fff', border:'none', fontSize:13, cursor:'pointer', borderRadius:8, fontFamily:'inherit', opacity:actionLoading?0.6:1 }}>
                    {actionLoading ? 'Approving…' : '✓ Approve & send email'}
                  </button>
                </div>
              )}

              {selected.status !== 'pending' && (
                <div style={{ padding:'20px 28px', borderTop:'0.5px solid rgba(20,18,16,0.07)' }}>
                  <p style={{ fontSize:13, color:'#8C867E', textAlign:'center' }}>
                    Status: <strong style={{ color: selected.status==='approved' ? '#B07D4A' : '#c0392b' }}>{selected.status}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}