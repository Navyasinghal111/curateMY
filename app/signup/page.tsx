'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SESSION_KEY = 'ck_creator_draft'

type Role = 'shopper' | 'brand' | null

const inp = 'w-full px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-white/60 transition-colors'
const sel = 'w-full px-4 py-3 bg-[#111] border border-white/20 text-[12px] text-white outline-none focus:border-white/60 transition-colors appearance-none'

const EyeIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeOffIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

function PasswordInput({ value, onChange, placeholder }: { value:string; onChange:(v:string)=>void; placeholder?:string }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <input type={show ? 'text' : 'password'} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        required minLength={6} className={inp} style={{ paddingRight:40 }} />
      <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}
        style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', padding:0, cursor:'pointer', color:'#8C867E', display:'flex', alignItems:'center' }}>
        {show ? EyeOffIcon : EyeIcon}
      </button>
    </div>
  )
}

const ROLE_CARDS = [
  { role: 'shopper', image:'/card-shopper.jpg', title:'Shopper', sub:'A destination for shopping, not scrolling.',                btn:'CREATE AN ACCOUNT' },
  { role: 'creator', image:'/card-creator.jpg', title:'Creator', sub:'Where great taste leads to great opportunities.',           btn:'APPLY' },
  { role: 'brand',   image:'/card-brand.jpg',   title:'Brand',   sub:'No one pushes your product like the people who love them.', btn:'APPLY' },
]

function PendingScreen({ title, sub, onHome }: { title: string; sub: string; onHome: () => void }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:'64px 24px', textAlign:'center' }}>
      <div style={{ width:44, height:44, border:'1px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:18, color:'#fff' }}>✓</div>
      <p style={{ fontSize:10, letterSpacing:'0.2em', color:'rgba(255,255,255,0.4)', marginBottom:12, textTransform:'uppercase' }}>Status — Received</p>
      <h1 style={{ fontFamily:'Fanwood Text, serif', fontSize:28, fontWeight:300, color:'#fff', marginBottom:16 }}>{title}</h1>
      <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:300, lineHeight:1.7, maxWidth:280, marginBottom:32 }}>{sub}</p>
      <button onClick={onHome} style={{ padding:'11px 32px', background:'#fff', color:'#000', fontSize:11, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
        BACK TO CURATEKIN
      </button>
    </div>
  )
}

function RoleHeader({ onBack, tag }: { onBack: () => void; tag: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', borderBottom:'0.5px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
      <button onClick={onBack} style={{ fontSize:11, letterSpacing:'0.08em', color:'rgba(255,255,255,0.4)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
      <p style={{ fontSize:10, letterSpacing:'0.18em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase' }}>{tag}</p>
    </div>
  )
}

function ShopperForm({ onBack }: { onBack: () => void }) {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.signUp({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    if (data.user) await supabase.from('profiles').insert({ id: data.user.id, display_name: name, role: 'shopper', status: 'pending' })
    setLoading(false); setDone(true)
  }

  if (done) return <PendingScreen title="You're on the list." sub="We're setting up your account. Check back soon to start discovering." onHome={() => router.push('/')} />

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
      <RoleHeader onBack={onBack} tag="For Shoppers" />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 20px', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:320 }}>
          <h2 style={{ fontFamily:'Fanwood Text, serif', fontSize:30, fontWeight:300, color:'#fff', textAlign:'center', marginBottom:8 }}>Create your account</h2>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textAlign:'center', marginBottom:32 }}>Discover products curated by people you trust.</p>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {error && <p style={{ fontSize:11, color:'#f87171', textAlign:'center' }}>{error}</p>}
            <input type="text"     placeholder="Full name"              value={name}     onChange={e => setName(e.target.value)}  required className={inp} />
            <input type="email"    placeholder="Email address"          value={email}    onChange={e => setEmail(e.target.value)} required className={inp} />
            <PasswordInput placeholder="Password (min 6 chars)" value={password} onChange={setPass} />
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', background:'#fff', color:'#000', fontSize:11, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit', marginTop:8, opacity: loading ? 0.5 : 1 }}>
              {loading ? 'CREATING...' : 'CREATE AN ACCOUNT'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function BrandForm({ onBack }: { onBack: () => void }) {
  const [company,  setCompany]  = useState('')
  const [email,    setEmail]    = useState('')
  const [website,  setWebsite]  = useState('')
  const [category, setCategory] = useState('')
  const [budget,   setBudget]   = useState('')
  const [message,  setMessage]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState('')
  const supabase = createClient()
  const router   = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error: err } = await supabase.from('brand_inquiries').insert({ company_name:company, email, website, category, budget, message })
    if (err) { setError(err.message); setLoading(false); return }
    setLoading(false); setDone(true)
  }

  if (done) return <PendingScreen title="We'll be in touch." sub="Our team will reach out within 24 hours to schedule your walkthrough." onHome={() => router.push('/')} />

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
      <RoleHeader onBack={onBack} tag="For Brands" />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 20px', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:320 }}>
          <h2 style={{ fontFamily:'Fanwood Text, serif', fontSize:28, fontWeight:300, color:'#fff', textAlign:'center', marginBottom:8 }}>Partner with CurateKin</h2>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textAlign:'center', marginBottom:28 }}>No one pushes your product like the people who love it.</p>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {error && <p style={{ fontSize:11, color:'#f87171', textAlign:'center' }}>{error}</p>}
            <input type="text"  placeholder="Brand / company name*" value={company}  onChange={e => setCompany(e.target.value)}  required className={inp} />
            <input type="email" placeholder="Work email*"           value={email}    onChange={e => setEmail(e.target.value)}    required className={inp} />
            <input type="url"   placeholder="Website URL"           value={website}  onChange={e => setWebsite(e.target.value)}          className={inp} />
            <select value={category} onChange={e => setCategory(e.target.value)} className={sel}>
              <option value="">Category</option>
              {['Beauty','Skincare','Fashion','Home Decor','Wellness','Other'].map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={budget} onChange={e => setBudget(e.target.value)} className={sel}>
              <option value="">Monthly budget</option>
              {['Under ₹50,000','₹50,000–₹2,00,000','₹2,00,000–₹10,00,000','₹10,00,000+'].map(b => <option key={b}>{b}</option>)}
            </select>
            <textarea placeholder="Tell us about your brand and goals..." value={message} onChange={e => setMessage(e.target.value)} rows={3} className={inp} style={{ resize:'none' }} />
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', background:'#fff', color:'#000', fontSize:11, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit', marginTop:8, opacity: loading ? 0.5 : 1 }}>
              {loading ? 'SENDING...' : 'APPLY'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  const [role, setRole] = useState<Role>(null)

  const goHome = () => { window.history.length > 1 ? window.history.back() : window.location.href = '/' }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') goHome() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', zIndex:40 }} onClick={() => { if (!role) goHome() }} />
      <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'12px' }}>
        <div style={{ position:'relative', width:'100%', maxWidth:1100, background:'#000', boxShadow:'0 32px 80px rgba(0,0,0,0.6)', display:'flex', flexDirection:'column', height:'min(760px,95vh)' }}>

          <button onClick={goHome} style={{ position:'absolute', top:16, right:16, zIndex:60, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.08)', border:'none', color:'rgba(255,255,255,0.6)', fontSize:22, cursor:'pointer', borderRadius:'50%', lineHeight:1 }}>×</button>

          {!role && (
            <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
              <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(3,1fr)', overflow:'hidden' }}>
                {ROLE_CARDS.map(card => (
                  <button
                    key={card.role}
                    onClick={() => {
                      if (card.role === 'creator') {
                        window.location.href = '/signup/creator'
                      } else {
                        setRole(card.role as Role)
                      }
                    }}
                    style={{ position:'relative', overflow:'hidden', textAlign:'left', display:'flex', flexDirection:'column', minHeight:220, border:'none', padding:0, cursor:'pointer' }}
                    onMouseEnter={e => { const bg = e.currentTarget.querySelector('.card-bg') as HTMLElement; if (bg) bg.style.transform='scale(1.05)' }}
                    onMouseLeave={e => { const bg = e.currentTarget.querySelector('.card-bg') as HTMLElement; if (bg) bg.style.transform='scale(1)' }}>
                    <div className="card-bg" style={{ position:'absolute', inset:0, backgroundImage:`url(${card.image})`, backgroundSize:'cover', backgroundPosition:'center', transition:'transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)' }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.1) 100%)' }} />
                    <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', justifyContent:'flex-end', flex:1, padding:28 }}>
                      <h3 style={{ fontFamily:'Fanwood Text, serif', fontSize:52, fontWeight:300, color:'#fff', lineHeight:1, marginBottom:10, letterSpacing:'-0.01em' }}>{card.title}</h3>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', fontWeight:300, lineHeight:1.6, marginBottom:24, minHeight:36 }}>{card.sub}</p>
                      <span style={{ display:'inline-block', padding:'10px 22px', border:'1px solid rgba(255,255,255,0.5)', fontSize:10, letterSpacing:'0.12em', color:'#fff', fontFamily:'DM Sans, sans-serif', alignSelf:'flex-start' }}>{card.btn}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.08)', padding:'14px', textAlign:'center', flexShrink:0, background:'#000' }}>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>
                  Already have an account?{' '}
                  <Link href="/login" style={{ color:'rgba(255,255,255,0.6)', textDecoration:'underline' }}>Log in</Link>
                </p>
              </div>
            </div>
          )}

          {role === 'shopper' && <ShopperForm onBack={() => setRole(null)} />}
          {role === 'brand'   && <BrandForm   onBack={() => setRole(null)} />}

        </div>
      </div>
    </>
  )
}