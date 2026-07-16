'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ADMIN_EMAILS = ['navysirius05@gmail.com'] // add your email here

const INK    = '#0A0A0A'
const GOLD   = '#B07D4A'
const MUTED  = '#6B6B6B'
const MUTED2 = '#9B9B9B'
const BORDER = '#E5E5E5'
const SERIF  = "'Cormorant Garamond', 'Fanwood Text', Georgia, serif"
const SANS   = "'DM Sans', sans-serif"

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
  secondary_platform: string
  secondary_handle: string
  niches: string[]
  content_language: string
  instagram_handle: string
  instagram_verified: boolean
  phone: string
  created_at: string
  // profiles has no email column — signup never writes one, so this is
  // always undefined until that's added. Approval email is skipped when absent.
  email?: string
}

// Deliberately excludes upi_id and pan_number — this page never needs to
// see payout details, so we don't even fetch them. Also excludes
// brands_worked_with — it's collected in the creator signup form's auth
// metadata, but profiles has no matching column yet, so selecting it here
// would fail the entire query (PostgREST errors on a nonexistent column).
const REVIEW_COLUMNS = 'id, display_name, username, city, bio, status, primary_platform, primary_handle, primary_followers, secondary_platform, secondary_handle, niches, content_language, instagram_handle, instagram_verified, phone, created_at'

function platformHandleFor(c: Creator, platform: string): string {
  if (c.primary_platform === platform && c.primary_handle) return c.primary_handle
  if (c.secondary_platform === platform && c.secondary_handle) return c.secondary_handle
  return ''
}

function socialUrl(platform: string, handleOrLink: string): string {
  const raw = handleOrLink.trim()
  if (/^https?:\/\//i.test(raw)) return raw
  const h = raw.replace(/^@/, '')
  if (platform === 'Instagram') return `https://instagram.com/${h}`
  if (platform === 'Pinterest') return `https://pinterest.com/${h}`
  if (platform === 'YouTube')   return `https://youtube.com/@${h}`
  return raw
}

function fmtDate(v?: string) {
  if (!v) return 'Not provided'
  try { return new Date(v).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) }
  catch { return 'Not provided' }
}

function ExternalLink({ platform, value }: { platform: string; value?: string }) {
  if (!value) return <span style={{ fontSize:13, color:MUTED2 }}>Not provided</span>
  return (
    <a href={socialUrl(platform, value)} target="_blank" rel="noopener noreferrer"
      style={{ fontSize:13, color:INK, fontWeight:500, textDecoration:'none', borderBottom:`1px solid ${GOLD}`, paddingBottom:1 }}>
      {value} ↗
    </a>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', gap:16, padding:'12px 0', borderBottom:`0.5px solid ${BORDER}` }}>
      <span style={{ fontSize:12, color:MUTED, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, color: value ? INK : MUTED2, fontWeight: value ? 500 : 400, textAlign:'right' }}>{value || 'Not provided'}</span>
    </div>
  )
}

export default function AdminPage() {
  const [creators, setCreators]     = useState<Creator[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<'pending'|'approved'|'rejected'>('pending')
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Creator | null>(null)
  const [notes, setNotes]           = useState('')
  const [actionLoading, setAction]  = useState(false)
  const [toast, setToast]           = useState('')
  const [toastErr, setToastErr]     = useState(false)
  const [access, setAccess]         = useState<'checking'|'denied'|'ok'>('checking')
  const supabase = createClient()
  const router   = useRouter()

  const loadCreators = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select(REVIEW_COLUMNS)
      .eq('role', 'creator')
      .order('created_at', { ascending: false })
    setCreators((data as unknown as Creator[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
        setAccess('denied')
        router.replace('/')
        return
      }
      setAccess('ok')
      loadCreators()
    }
    checkAccess()
  }, [])

  const counts = {
    pending:  creators.filter(c => c.status === 'pending').length,
    approved: creators.filter(c => c.status === 'approved').length,
    rejected: creators.filter(c => c.status === 'rejected').length,
  }

  const q = search.trim().toLowerCase()
  const filtered = creators
    .filter(c => c.status === filter)
    .filter(c => {
      if (!q) return true
      return [c.display_name, c.username, c.email, c.instagram_handle, c.primary_handle]
        .some(v => v?.toLowerCase().includes(q))
    })

  const approve = async (creator: Creator) => {
    setAction(true)
    const { error: updateErr } = await supabase.from('profiles').update({ status: 'approved' }).eq('id', creator.id)
    if (updateErr) {
      setAction(false)
      showToast(`Failed to approve: ${updateErr.message}`, true)
      return
    }

    // Send approval email — skipped if there's no email on file (profiles has no email column yet)
    if (creator.email) {
      try {
        const res = await fetch('/api/auth/instagram/email/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: creator.email,
            name: creator.display_name,
            username: creator.username,
          }),
        })
        if (!res.ok) console.error('Approval email failed:', await res.text())
      } catch (e) {
        console.error('Approval email failed:', e)
      }
    }

    setCreators(prev => prev.map(c => c.id === creator.id ? { ...c, status: 'approved' } : c))
    setSelected(null)
    setNotes('')
    setAction(false)
    showToast(creator.email ? `${creator.display_name} approved` : `${creator.display_name} approved — no email on file, notify manually`)
  }

  const reject = async (creator: Creator) => {
    setAction(true)
    const { error: updateErr } = await supabase.from('profiles').update({ status: 'rejected' }).eq('id', creator.id)
    if (updateErr) {
      setAction(false)
      showToast(`Failed to reject: ${updateErr.message}`, true)
      return
    }
    setCreators(prev => prev.map(c => c.id === creator.id ? { ...c, status: 'rejected' } : c))
    setSelected(null)
    setNotes('')
    setAction(false)
    showToast(`${creator.display_name} rejected`)
  }

  const showToast = (msg: string, isErr = false) => {
    setToast(msg); setToastErr(isErr)
    setTimeout(() => setToast(''), 3500)
  }

  const fontLink = <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

  if (access !== 'ok') return (
    <>
      {fontLink}
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', fontFamily:SERIF, fontSize:20, fontStyle:'italic', color:MUTED2 }}>
        {access === 'checking' ? 'Verifying access…' : 'Access denied — redirecting…'}
      </div>
    </>
  )

  if (loading) return (
    <>
      {fontLink}
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', fontFamily:SERIF, fontSize:20, fontStyle:'italic', color:MUTED2 }}>
        Loading applications…
      </div>
    </>
  )

  return (
    <>
      {fontLink}
      <style>{`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } body { background: #fff; font-family: ${SANS}; }`}</style>

      {toast && (
        <div style={{ position:'fixed', top:24, right:24, background: toastErr ? '#C0392B' : INK, color:'#fff', padding:'12px 20px', fontSize:13, zIndex:999, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}

      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#fff' }}>

        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', height:64, borderBottom:`0.5px solid ${BORDER}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
            <span style={{ fontFamily:SERIF, fontSize:22, fontWeight:400, color:INK }}>
<span style={{ fontFamily:'Cormorant Garamond, Georgia, serif', fontStyle:'italic', fontWeight:400, whiteSpace:'nowrap' }}><span><span style={{ display:'inline-block', fontSize:'1.18em', lineHeight:.8 }}>C</span>urate</span><span style={{ color:GOLD }}><span style={{ display:'inline-block', fontSize:'1.18em', lineHeight:.8 }}>K</span>in</span></span>
            </span>
            <span style={{ fontSize:11, letterSpacing:'0.14em', color:MUTED2, textTransform:'uppercase' }}>Creator review</span>
          </div>
          <Link href="/dashboard" style={{ fontSize:13, color:MUTED, textDecoration:'none' }}>← Back to dashboard</Link>
        </div>

        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

          {/* ── Left panel: filters, search, list ── */}
          <div style={{ width:400, flexShrink:0, borderRight:`0.5px solid ${BORDER}`, display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'20px 24px 16px', borderBottom:`0.5px solid ${BORDER}` }}>
              <div style={{ display:'flex', gap:6, marginBottom:14 }}>
                {(['pending','approved','rejected'] as const).map(s => (
                  <button key={s} onClick={() => { setFilter(s); setSelected(null) }}
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px 8px', background: filter===s ? INK : '#fff', border:`1px solid ${filter===s ? INK : BORDER}`, borderRadius:8, cursor:'pointer', color: filter===s ? '#fff' : MUTED, fontSize:12, fontFamily:'inherit', textTransform:'capitalize' }}>
                    {s}
                    <span style={{ fontSize:10, opacity:0.7 }}>{counts[s]}</span>
                  </button>
                ))}
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, username, handle…"
                style={{ width:'100%', padding:'10px 14px', border:`1px solid ${BORDER}`, borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit', color:INK }} />
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:16 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px' }}>
                  <p style={{ fontFamily:SERIF, fontSize:19, fontStyle:'italic', color:MUTED2, marginBottom:6 }}>
                    {search ? 'No matches' : `No ${filter} applications`}
                  </p>
                  <p style={{ fontSize:12, color:MUTED2 }}>
                    {search ? 'Try a different search.' : filter === 'pending' ? 'New applications will show up here.' : `Nothing has been ${filter} yet.`}
                  </p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {filtered.map(c => {
                    const isSelected = selected?.id === c.id
                    return (
                      <button key={c.id} onClick={() => { setSelected(c); setNotes('') }}
                        style={{ textAlign:'left', width:'100%', background: isSelected ? '#FAF7F2' : '#fff', border:`1px solid ${isSelected ? GOLD : BORDER}`, borderRadius:10, padding:'14px 16px', cursor:'pointer', fontFamily:'inherit' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:14, fontWeight:500, color:INK }}>{c.display_name || 'Not provided'}</span>
                          <span style={{ fontSize:10, letterSpacing:'0.06em', textTransform:'uppercase', color: c.status==='approved' ? GOLD : c.status==='rejected' ? '#C0392B' : MUTED2 }}>{c.status}</span>
                        </div>
                        <p style={{ fontSize:12, color:MUTED, marginBottom:6 }}>
                          {c.username ? `@${c.username}` : 'No username yet'}
                        </p>
                        <p style={{ fontSize:12, color:MUTED2 }}>
                          {c.primary_platform || 'Not provided'} · {c.primary_followers || 'Not provided'}
                        </p>
                        <p style={{ fontSize:11, color:MUTED2, marginTop:6 }}>{fmtDate(c.created_at)}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel: detail ── */}
          <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
            {!selected ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:40 }}>
                <p style={{ fontFamily:SERIF, fontSize:24, fontStyle:'italic', color:MUTED2, marginBottom:8 }}>Select an application</p>
                <p style={{ fontSize:13, color:MUTED2, maxWidth:320, textAlign:'center', lineHeight:1.6 }}>
                  Choose a creator from the list to review their profile and platforms.
                </p>
              </div>
            ) : (
              <>
                <div style={{ padding:'32px 40px 24px', borderBottom:`0.5px solid ${BORDER}` }}>
                  <p style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color: selected.status==='approved' ? GOLD : selected.status==='rejected' ? '#C0392B' : MUTED2, marginBottom:8 }}>
                    {selected.status}
                  </p>
                  <h1 style={{ fontFamily:SERIF, fontSize:32, fontWeight:400, color:INK, marginBottom:4 }}>{selected.display_name || 'Not provided'}</h1>
                  <p style={{ fontSize:13, color:MUTED }}>{selected.username ? `@${selected.username}` : 'No username yet'}</p>
                </div>

                <div style={{ padding:'8px 40px 32px', flex:1 }}>
                  <SectionLabel>Contact</SectionLabel>
                  <Field label="Email" value={selected.email} />
                  <Field label="Phone" value={selected.phone} />

                  <SectionLabel>Platforms</SectionLabel>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:16, padding:'12px 0', borderBottom:`0.5px solid ${BORDER}` }}>
                    <span style={{ fontSize:12, color:MUTED }}>Instagram</span>
                    <ExternalLink platform="Instagram" value={selected.instagram_handle} />
                  </div>
                  {selected.instagram_verified && (
                    <div style={{ padding:'8px 0 4px' }}>
                      <span style={{ fontSize:11, color:GOLD }}>✓ Marked verified</span>
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', gap:16, padding:'12px 0', borderBottom:`0.5px solid ${BORDER}` }}>
                    <span style={{ fontSize:12, color:MUTED }}>Pinterest</span>
                    <ExternalLink platform="Pinterest" value={platformHandleFor(selected, 'Pinterest')} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:16, padding:'12px 0', borderBottom:`0.5px solid ${BORDER}` }}>
                    <span style={{ fontSize:12, color:MUTED }}>YouTube</span>
                    <ExternalLink platform="YouTube" value={platformHandleFor(selected, 'YouTube')} />
                  </div>
                  <Field label="Largest platform" value={selected.primary_platform} />
                  <Field label="Follower range" value={selected.primary_followers} />

                  <SectionLabel>Taste profile</SectionLabel>
                  <div style={{ padding:'12px 0', borderBottom:`0.5px solid ${BORDER}` }}>
                    <p style={{ fontSize:12, color:MUTED, marginBottom:8 }}>Niches</p>
                    {selected.niches?.length > 0 ? (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {selected.niches.map(n => (
                          <span key={n} style={{ fontSize:11, padding:'4px 10px', background:'#F7F5F1', color:INK, borderRadius:100 }}>{n}</span>
                        ))}
                      </div>
                    ) : <span style={{ fontSize:13, color:MUTED2 }}>Not provided</span>}
                  </div>
                  <Field label="Content language" value={selected.content_language} />
                  <div style={{ padding:'12px 0', borderBottom:`0.5px solid ${BORDER}` }}>
                    <p style={{ fontSize:12, color:MUTED, marginBottom:6 }}>Content style</p>
                    <p style={{ fontSize:13, color: selected.bio ? INK : MUTED2, lineHeight:1.6 }}>{selected.bio || 'Not provided'}</p>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:16, padding:'12px 0', borderBottom:`0.5px solid ${BORDER}` }}>
                    <span style={{ fontSize:12, color:MUTED, flexShrink:0 }}>Brands worked with</span>
                    <span style={{ fontSize:12, color:MUTED2, textAlign:'right', fontStyle:'italic' }}>Not stored yet — requires creator_applications or a profiles column.</span>
                  </div>
                  <Field label="Applied" value={fmtDate(selected.created_at)} />

                  <SectionLabel>Review notes</SectionLabel>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Jot anything worth remembering while you review…" rows={3}
                    style={{ width:'100%', padding:'12px 14px', border:`1px solid ${BORDER}`, fontSize:13, outline:'none', fontFamily:'inherit', color:INK, borderRadius:8, resize:'vertical', marginBottom:8 }} />
                  <p style={{ fontSize:11, color:MUTED2, lineHeight:1.5 }}>
                    Not saved. Persistent admin notes require an <code>admin_notes</code> table and RLS policy — this is a local scratchpad for this session only.
                  </p>
                </div>

                {selected.status === 'pending' ? (
                  <div style={{ padding:'20px 40px', borderTop:`0.5px solid ${BORDER}`, display:'flex', gap:12, position:'sticky', bottom:0, background:'#fff' }}>
                    <button onClick={() => reject(selected)} disabled={actionLoading}
                      style={{ flex:1, padding:'13px', background:'#fff', border:`1px solid ${BORDER}`, fontSize:12, letterSpacing:'0.06em', cursor: actionLoading ? 'default' : 'pointer', color:MUTED, borderRadius:8, fontFamily:'inherit', opacity:actionLoading?0.6:1 }}>
                      REJECT
                    </button>
                    <button onClick={() => approve(selected)} disabled={actionLoading}
                      style={{ flex:2, padding:'13px', background:INK, color:'#fff', border:'none', fontSize:12, letterSpacing:'0.06em', cursor: actionLoading ? 'default' : 'pointer', borderRadius:8, fontFamily:'inherit', opacity:actionLoading?0.6:1 }}>
                      {actionLoading ? 'APPROVING…' : 'APPROVE & SEND EMAIL'}
                    </button>
                  </div>
                ) : (
                  <div style={{ padding:'20px 40px', borderTop:`0.5px solid ${BORDER}` }}>
                    <p style={{ fontSize:12, color:MUTED2, textAlign:'center' }}>
                      This application has already been {selected.status}.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:GOLD, fontWeight:500, marginTop:28, marginBottom:4 }}>
      {children}
    </p>
  )
}
