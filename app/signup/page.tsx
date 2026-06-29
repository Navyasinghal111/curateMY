'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const OTP_ENABLED = false
const SESSION_KEY = 'ck_creator_draft'

type Role = 'shopper' | 'creator' | 'brand' | null

const inp = 'w-full px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-white/60 transition-colors'
const sel = 'w-full px-4 py-3 bg-[#111] border border-white/20 text-[12px] text-white outline-none focus:border-white/60 transition-colors appearance-none'
const lbl = 'text-[10px] tracking-[0.12em] text-white/40'

const NICHES    = ['Beauty','Skincare','Fashion','Home Decor','Wellness','Jewellery','Food & Lifestyle','Travel','Fitness']
const PLATFORMS = ['Instagram','YouTube','Pinterest','Blog','LinkedIn','Other']
const FOLLOWERS = ['Under 1,000','1,000–10,000','10,000–50,000','50,000–2,00,000','2,00,000+']
const LANGUAGES = ['English','Hindi','Both English & Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Other']
const ENG_RATES = ['Under 1%','1–3%','3–6%','6–10%','Above 10%']
const SOURCES   = ['Instagram','A friend or creator','Google','A brand I work with','Other']

const ROLE_CARDS = [
  { role: 'shopper' as Role, image:'/card-shopper.jpg', title:'Shopper', sub:'A destination for shopping, not scrolling.', btn:'CREATE AN ACCOUNT' },
  { role: 'creator' as Role, image:'/card-creator.jpg', title:'Creator', sub:'Where great taste leads to great opportunities.', btn:'APPLY' },
  { role: 'brand'   as Role, image:'/card-brand.jpg',   title:'Brand',   sub:'No one pushes your product like the people who love them.', btn:'APPLY' },
]

function PendingScreen({ title, sub, onHome }: { title: string; sub: string; onHome: () => void }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:'64px 24px', textAlign:'center' }}>
      <div style={{ width:44, height:44, border:'1px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:18, color:'#fff' }}>✓</div>
      <p style={{ fontSize:10, letterSpacing:'0.2em', color:'rgba(255,255,255,0.4)', marginBottom:12, textTransform:'uppercase' }}>Status — Received</p>
      <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:28, fontWeight:300, color:'#fff', marginBottom:16 }}>{title}</h1>
      <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:300, lineHeight:1.7, maxWidth:280, marginBottom:32 }}>{sub}</p>
      <button onClick={onHome} style={{ padding:'11px 32px', background:'#fff', color:'#000', fontSize:11, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
        BACK TO CURATEKIN
      </button>
    </div>
  )
}

function RoleHeader({ onBack, tag, children }: { onBack: () => void; tag: string; children?: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', borderBottom:'0.5px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
      <button onClick={onBack} style={{ fontSize:11, letterSpacing:'0.08em', color:'rgba(255,255,255,0.4)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
      {children ?? <div style={{ width:40 }} />}
      <p style={{ fontSize:10, letterSpacing:'0.18em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase' }}>{tag}</p>
    </div>
  )
}

function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label style={{ display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer' }}>
      <div onClick={onChange} style={{ width:16, height:16, border:`1px solid ${checked ? '#fff' : 'rgba(255,255,255,0.25)'}`, flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center', background: checked ? '#fff' : 'transparent', cursor:'pointer', transition:'all 0.15s' }}>
        {checked && <span style={{ fontSize:9, color:'#000', fontWeight:700 }}>✓</span>}
      </div>
      <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>{children}</span>
    </label>
  )
}

function draftSave(data: object) { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)) } catch {} }
function draftLoad<T>(): T | null { try { const r = sessionStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null } catch { return null } }
function draftClear() { try { sessionStorage.removeItem(SESSION_KEY) } catch {} }

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
    e.preventDefault()
    setLoading(true); setError('')
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
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:30, fontWeight:300, color:'#fff', textAlign:'center', marginBottom:8 }}>Create your account</h2>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textAlign:'center', marginBottom:32, fontWeight:300 }}>Discover products curated by people you trust.</p>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {error && <p style={{ fontSize:11, color:'#f87171', textAlign:'center' }}>{error}</p>}
            <input type="text"     placeholder="Full name"              value={name}     onChange={e => setName(e.target.value)}  required className={inp} />
            <input type="email"    placeholder="Email address"          value={email}    onChange={e => setEmail(e.target.value)} required className={inp} />
            <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPass(e.target.value)}  required minLength={6} className={inp} />
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', background:'#fff', color:'#000', fontSize:11, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit', marginTop:8, opacity: loading ? 0.5 : 1 }}>
              {loading ? 'CREATING...' : 'CREATE AN ACCOUNT'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function CreatorForm({ onBack }: { onBack: () => void }) {
  const [step, setStep]                                 = useState(1)
  const [name, setName]                                 = useState('')
  const [email, setEmail]                               = useState('')
  const [password, setPass]                             = useState('')
  const [countryCode, setCountryCode]                   = useState('+91')
  const [phone, setPhone]                               = useState('')
  const [city, setCity]                                 = useState('')
  const [ageOk, setAgeOk]                               = useState(false)
  const [primaryPlatform, setPrimaryPlatform]           = useState('')
  const [primaryHandle, setPrimaryHandle]               = useState('')
  const [primaryFollowers, setPrimaryFollowers]         = useState('')
  const [secondaryPlatform, setSecondaryPlatform]       = useState('')
  const [secondaryHandle, setSecondaryHandle]           = useState('')
  const [secondaryFollowers, setSecondaryFollowers]     = useState('')
  const [engagementRate, setEngagementRate]             = useState('')
  const [niches, setNiches]                             = useState<string[]>([])
  const [language, setLanguage]                         = useState('')
  const [bio, setBio]                                   = useState('')
  const [source, setSource]                             = useState('')
  const [referral, setReferral]                         = useState('')
  const [igConnected, setIgConnected]                   = useState(false)
  const [igHandle, setIgHandle]                         = useState('')
  const [upiId, setUpiId]                               = useState('')
  const [panNumber, setPanNumber]                       = useState('')
  const [agreedTos, setAgreedTos]                       = useState(false)
  const [agreedAffiliate, setAgreedAffiliate]           = useState(false)
  const [error, setError]                               = useState('')
  const [loading, setLoading]                           = useState(false)
  const [done, setDone]                                 = useState(false)

  const supabase = createClient()
  const router   = useRouter()

  const go   = (n: number) => { setError(''); setStep(n); window.scrollTo(0,0) }
  const next = () => go(step + 1)
  const prev = () => go(step - 1)
  const toggleNiche = (n: string) => setNiches(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n])

  const draftData = () => ({ name, email, password, countryCode, phone, city, ageOk, primaryPlatform, primaryHandle, primaryFollowers, secondaryPlatform, secondaryHandle, secondaryFollowers, engagementRate, niches, language, bio, source, referral })

  const restoreDraft = () => {
    const d = draftLoad<ReturnType<typeof draftData>>()
    if (!d) return false
    setName(d.name ?? ''); setEmail(d.email ?? ''); setPass(d.password ?? '')
    setCountryCode(d.countryCode ?? '+91'); setPhone(d.phone ?? ''); setCity(d.city ?? '')
    setAgeOk(d.ageOk ?? false)
    setPrimaryPlatform(d.primaryPlatform ?? ''); setPrimaryHandle(d.primaryHandle ?? ''); setPrimaryFollowers(d.primaryFollowers ?? '')
    setSecondaryPlatform(d.secondaryPlatform ?? ''); setSecondaryHandle(d.secondaryHandle ?? ''); setSecondaryFollowers(d.secondaryFollowers ?? '')
    setEngagementRate(d.engagementRate ?? ''); setNiches(d.niches ?? []); setLanguage(d.language ?? '')
    setBio(d.bio ?? ''); setSource(d.source ?? ''); setReferral(d.referral ?? '')
    return true
  }

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('ig_success') === 'true') {
      if (restoreDraft()) { setIgConnected(true); setIgHandle(p.get('ig_handle') ?? ''); go(5) }
      else setError('Session expired. Please fill in your details again.')
      window.history.replaceState({}, '', '/signup')
    } else if (p.get('ig_error')) {
      restoreDraft(); setError('Instagram verification failed. You can skip it below.'); go(4)
      window.history.replaceState({}, '', '/signup')
    }
  }, [])

  const connectInstagram = () => { draftSave(draftData()); window.location.href = '/api/auth/instagram' }

  const submit = async (skipPayouts = false) => {
    if (!skipPayouts) {
      if (!upiId)     return setError('UPI ID is required for payouts')
      if (!panNumber) return setError('PAN number is required')
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber)) return setError('Enter a valid PAN (e.g. ABCDE1234F)')
      if (!agreedTos || !agreedAffiliate) return setError('Please agree to all terms to continue')
    }
    setLoading(true); setError('')
    try {
      const { data, error: authErr } = await supabase.auth.signUp({ email, password })
      if (authErr) throw authErr
      if (!data.user) throw new Error('Signup failed — please try again.')
      const { error: profileErr } = await supabase.from('profiles').insert({
        id: data.user.id, display_name: name, phone: `${countryCode}${phone}`, city,
        role: 'creator', status: 'pending',
        primary_platform: primaryPlatform, primary_handle: primaryHandle, primary_followers: primaryFollowers,
        secondary_platform: secondaryPlatform || null, secondary_handle: secondaryHandle || null,
        secondary_followers: secondaryFollowers || null, engagement_rate: engagementRate || null,
        niches, content_language: language, bio,
        referral_code: referral || null, source,
        instagram_handle: igHandle || null, instagram_verified: igConnected,
        upi_id: upiId || null, pan_number: panNumber || null,
        agreed_tos: skipPayouts ? false : agreedTos,
        agreed_affiliate: skipPayouts ? false : agreedAffiliate,
      })
      if (profileErr) throw profileErr
      draftClear(); setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  if (done) return <PendingScreen title="Application received." sub="We'll review your profile and get back to you within 3–5 days. Keep creating." onHome={() => router.push('/')} />

  const Dots = () => (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      {[1,2,3,4,5].map((s,i) => (
        <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{
            width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:9, border:'1px solid',
            background: step > s ? '#fff' : step === s ? '#fff' : 'transparent',
            borderColor: step > s ? '#fff' : step === s ? '#fff' : 'rgba(255,255,255,0.2)',
            color: step > s ? '#000' : step === s ? '#000' : 'rgba(255,255,255,0.3)',
            transition:'all 0.15s'
          }}>
            {step > s ? '✓' : s}
          </div>
          {i < 4 && <div style={{ width:16, height:0.5, background: step > s ? '#fff' : 'rgba(255,255,255,0.15)' }} />}
        </div>
      ))}
    </div>
  )

  const Nav = ({ onNext, label='NEXT', isSubmit=false, showBack=true }: { onNext:()=>void; label?:string; isSubmit?:boolean; showBack?:boolean }) => (
    <div style={{ display:'flex', gap:8, marginTop:16 }}>
      {showBack && (
        <button onClick={prev} style={{ flex:1, padding:'11px', border:'0.5px solid rgba(255,255,255,0.2)', background:'transparent', color:'rgba(255,255,255,0.4)', fontSize:11, letterSpacing:'0.08em', cursor:'pointer', fontFamily:'inherit' }}>
          ← BACK
        </button>
      )}
      <button onClick={onNext} disabled={isSubmit && loading} style={{
        flex: showBack ? 2 : 1, padding:'11px',
        background: isSubmit ? '#fff' : '#fff',
        color: '#000',
        fontSize:11, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit',
        opacity: (isSubmit && loading) ? 0.5 : 1
      }}>
        {isSubmit && loading ? 'SUBMITTING...' : label}
      </button>
    </div>
  )

  const formStyle: React.CSSProperties = { display:'flex', flexDirection:'column', gap:12 }
  const sectionLabel = (text: string) => <p style={{ fontSize:10, letterSpacing:'0.12em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', marginBottom:4 }}>{text}</p>

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <RoleHeader onBack={step > 1 ? prev : onBack} tag="For Creators">
        <Dots />
      </RoleHeader>
      <div style={{ flex:1, overflowY:'auto', padding:'24px 20px' }}>
        <div style={{ width:'100%', maxWidth:320, margin:'0 auto' }}>
          {error && <p style={{ fontSize:11, color:'#f87171', textAlign:'center', marginBottom:16 }}>{error}</p>}

          {step === 1 && <>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:26, fontWeight:300, color:'#fff', textAlign:'center', marginBottom:4 }}>Basic info</h2>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textAlign:'center', marginBottom:20, fontWeight:300 }}>Let's start with who you are.</p>
            <div style={formStyle}>
              <input type="text"     placeholder="Full name*"                    value={name}     onChange={e => setName(e.target.value)}  className={inp} />
              <input type="email"    placeholder="Email address*"               value={email}    onChange={e => setEmail(e.target.value)} className={inp} />
              <input type="password" placeholder="Password (min 6 characters)*" value={password} onChange={e => setPass(e.target.value)}  minLength={6} className={inp} />
              <input type="text"     placeholder="City*"                        value={city}     onChange={e => setCity(e.target.value)}  className={inp} />
              <div style={{ display:'flex', gap:8 }}>
                <select value={countryCode} onChange={e => setCountryCode(e.target.value)} style={{ width:72, padding:'10px 8px', background:'#111', border:'0.5px solid rgba(255,255,255,0.2)', color:'#fff', fontSize:12, outline:'none', appearance:'none', flexShrink:0 }}>
                  {['+91','+1','+44','+971','+65'].map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="tel" placeholder="Phone number* (10 digits)" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} maxLength={10} className={inp} style={{ flex:1 }} />
              </div>
              <Checkbox checked={ageOk} onChange={() => setAgeOk(a => !a)}>
                I confirm I am 18 years of age or older*
              </Checkbox>
              <Nav onNext={() => {
                if (!name || !email || !password) return setError('Please fill all required fields')
                if (password.length < 6) return setError('Password must be at least 6 characters')
                if (phone.replace(/\D/g,'').length < 10) return setError('Phone number must be at least 10 digits')
                if (!city) return setError('Please enter your city')
                if (!ageOk) return setError('You must confirm you are 18 or older')
                next()
              }} showBack={false} />
              <a href="/dashboard" style={{ display:'block', textAlign:'center', fontSize:10, color:'rgba(255,255,255,0.2)', letterSpacing:'0.08em', marginTop:8, textDecoration:'none', padding:'8px', border:'1px dashed rgba(255,255,255,0.1)' }}>
                ⚡ Preview dashboard (editor only)
              </a>
            </div>
          </>}

          {step === 2 && <>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:26, fontWeight:300, color:'#fff', textAlign:'center', marginBottom:4 }}>Your platforms</h2>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textAlign:'center', marginBottom:20, fontWeight:300 }}>It's about taste, not follower count.</p>
            <div style={formStyle}>
              {sectionLabel('Primary Platform')}
              <select value={primaryPlatform} onChange={e => setPrimaryPlatform(e.target.value)} className={sel}>
                <option value="">Select platform*</option>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <input type="text" placeholder="Handle or profile URL*" value={primaryHandle} onChange={e => setPrimaryHandle(e.target.value)} className={inp} />
                <select value={primaryFollowers} onChange={e => setPrimaryFollowers(e.target.value)} className={sel}>
                  <option value="">Followers*</option>
                  {FOLLOWERS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <select value={engagementRate} onChange={e => setEngagementRate(e.target.value)} className={sel}>
                <option value="">Average engagement rate</option>
                {ENG_RATES.map(r => <option key={r}>{r}</option>)}
              </select>
              <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.08)', paddingTop:12 }}>
                {sectionLabel('Secondary Platform (optional)')}
                <select value={secondaryPlatform} onChange={e => setSecondaryPlatform(e.target.value)} className={sel}>
                  <option value="">Select platform</option>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
                {secondaryPlatform && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
                    <input type="text" placeholder="Handle or profile URL" value={secondaryHandle} onChange={e => setSecondaryHandle(e.target.value)} className={inp} />
                    <select value={secondaryFollowers} onChange={e => setSecondaryFollowers(e.target.value)} className={sel}>
                      <option value="">Follower count</option>
                      {FOLLOWERS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <Nav onNext={() => {
                if (!primaryPlatform || !primaryHandle || !primaryFollowers) return setError('Please fill all required platform fields')
                next()
              }} />
            </div>
          </>}

          {step === 3 && <>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:26, fontWeight:300, color:'#fff', textAlign:'center', marginBottom:4 }}>Your content</h2>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textAlign:'center', marginBottom:20, fontWeight:300 }}>Tell us what makes your taste unique.</p>
            <div style={formStyle}>
              <div>
                {sectionLabel('Your niche*')}
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                  {NICHES.map(n => (
                    <button key={n} type="button" onClick={() => toggleNiche(n)} style={{
                      fontSize:10, letterSpacing:'0.06em', padding:'6px 12px',
                      border:`0.5px solid ${niches.includes(n) ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                      background: niches.includes(n) ? '#fff' : 'transparent',
                      color: niches.includes(n) ? '#000' : 'rgba(255,255,255,0.5)',
                      cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s'
                    }}>{n}</button>
                  ))}
                </div>
              </div>
              <select value={language} onChange={e => setLanguage(e.target.value)} className={sel}>
                <option value="">Content language*</option>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
              <textarea placeholder="Describe your content style and aesthetic...*" value={bio} onChange={e => setBio(e.target.value)} rows={3} className={inp} style={{ resize:'none' }} />
              <select value={source} onChange={e => setSource(e.target.value)} className={sel}>
                <option value="">How did you hear about us?</option>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
              <input type="text" placeholder="Referral code (optional)" value={referral} onChange={e => setReferral(e.target.value)} className={inp} />
              <Nav onNext={() => {
                if (!niches.length || !language || !bio) return setError('Please fill niche, language, and bio')
                next()
              }} />
            </div>
          </>}

          {step === 4 && <>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:26, fontWeight:300, color:'#fff', textAlign:'center', marginBottom:4 }}>Verify Instagram</h2>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textAlign:'center', marginBottom:20, fontWeight:300 }}>Prove you own the account you're applying with.</p>
            <div style={formStyle}>
              {igConnected
                ? <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', border:'0.5px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.05)' }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', color:'#000', fontSize:14, flexShrink:0 }}>✓</div>
                    <div>
                      <p style={{ fontSize:12, color:'#fff', fontWeight:500 }}>@{igHandle}</p>
                      <p style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>Instagram confirmed</p>
                    </div>
                  </div>
                : <button onClick={connectInstagram} style={{ width:'100%', padding:'12px', background:'linear-gradient(to right, #833ab4, #fd1d1d, #fcb045)', color:'#fff', fontSize:11, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                    CONNECT INSTAGRAM
                  </button>
              }
              <Nav onNext={next} label={igConnected ? 'NEXT' : 'SKIP & CONTINUE →'} />
              {!igConnected && <p style={{ fontSize:10, color:'rgba(255,255,255,0.2)', textAlign:'center' }}>You can verify from your dashboard after approval.</p>}
            </div>
          </>}

          {step === 5 && <>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:26, fontWeight:300, color:'#fff', textAlign:'center', marginBottom:4 }}>Payouts & agreement</h2>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textAlign:'center', marginBottom:20, fontWeight:300 }}>Almost there. Set up how you'll get paid.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                {sectionLabel('UPI ID')}
                <input type="text" placeholder="e.g. priya@okicici*" value={upiId} onChange={e => setUpiId(e.target.value)} className={inp} style={{ marginTop:6 }} />
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:6, fontFamily:'monospace' }}>Your 80% commission is transferred here monthly once balance crosses ₹100.</p>
              </div>
              <div>
                {sectionLabel('PAN Number')}
                <input type="text" placeholder="e.g. ABCDE1234F*" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} maxLength={10} className={inp} style={{ marginTop:6 }} />
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:6, fontFamily:'monospace' }}>Required for earnings above ₹50,000/year. Never shared with brands.</p>
              </div>
              <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.08)', paddingTop:16, display:'flex', flexDirection:'column', gap:12 }}>
                {sectionLabel('Agreements')}
                <Checkbox checked={agreedTos} onChange={() => setAgreedTos(a => !a)}>
                  I agree to the{' '}
                  <a href="/terms" target="_blank" style={{ color:'rgba(255,255,255,0.7)', textDecoration:'underline' }}>Terms & Conditions</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" style={{ color:'rgba(255,255,255,0.7)', textDecoration:'underline' }}>Privacy Policy</a>*
                </Checkbox>
                <Checkbox checked={agreedAffiliate} onChange={() => setAgreedAffiliate(a => !a)}>
                  I agree to the{' '}
                  <a href="/affiliate-policy" target="_blank" style={{ color:'rgba(255,255,255,0.7)', textDecoration:'underline' }}>Affiliate & Commission Policy</a>,
                  including the 80% commission structure and monthly payout schedule*
                </Checkbox>
              </div>
              <Nav onNext={() => submit(false)} label="SUBMIT APPLICATION →" isSubmit />
              <button onClick={() => submit(true)} style={{ background:'none', border:'1px dashed rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.2)', fontSize:10, letterSpacing:'0.08em', padding:'8px', cursor:'pointer', fontFamily:'inherit' }}>
                ⚡ Skip payouts & submit (testing only)
              </button>
            </div>
          </>}

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
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:28, fontWeight:300, color:'#fff', textAlign:'center', marginBottom:8 }}>Partner with CurateKin</h2>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textAlign:'center', marginBottom:28, fontWeight:300 }}>No one pushes your product like the people who love it.</p>
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

          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); window.history.back() }}
            style={{ position:'absolute', top:16, right:16, zIndex:60, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.08)', border:'none', color:'rgba(255,255,255,0.6)', fontSize:22, cursor:'pointer', borderRadius:'50%', lineHeight:1 }}>
            ×
          </button>

          {!role && (
            <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
              {/* Role cards */}
              <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(3,1fr)', overflow:'hidden' }}
                className="max-sm:grid-cols-1 max-sm:overflow-y-auto">
                {ROLE_CARDS.map(card => (
                  <button
                    key={card.role}
                    onClick={() => setRole(card.role)}
                    style={{ position:'relative', overflow:'hidden', textAlign:'left', display:'flex', flexDirection:'column', minHeight:220, border:'none', padding:0, cursor:'pointer' }}
                    onMouseEnter={e => { const bg = e.currentTarget.querySelector('.card-bg') as HTMLElement; if (bg) bg.style.transform='scale(1.05)' }}
                    onMouseLeave={e => { const bg = e.currentTarget.querySelector('.card-bg') as HTMLElement; if (bg) bg.style.transform='scale(1)' }}>
                    {/* Photo */}
                    <div className="card-bg" style={{
                      position:'absolute', inset:0,
                      backgroundImage:`url(${card.image})`,
                      backgroundSize:'cover', backgroundPosition:'center',
                      transition:'transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)'
                    }} />
                    {/* Gradient overlay */}
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.1) 100%)' }} />
                    {/* Content pinned to bottom */}
                    <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', justifyContent:'flex-end', flex:1, padding:28 }}>
                      <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:52, fontWeight:300, color:'#fff', lineHeight:1, marginBottom:10, letterSpacing:'-0.01em' }}>
                        {card.title}
                      </h3>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', fontWeight:300, lineHeight:1.6, marginBottom:24, minHeight:36 }}>
                        {card.sub}
                      </p>
                      <span style={{
                        display:'inline-block', padding:'10px 22px',
                        border:'1px solid rgba(255,255,255,0.5)',
                        fontSize:10, letterSpacing:'0.12em', color:'#fff',
                        fontFamily:'DM Sans, sans-serif', alignSelf:'flex-start',
                        transition:'background 0.2s, color 0.2s'
                      }}>
                        {card.btn}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {/* Bottom bar */}
              <div style={{ borderTop:'0.5px solid rgba(255,255,255,0.08)', padding:'14px', textAlign:'center', flexShrink:0, background:'#000' }}>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>
                  Already have an account?{' '}
                  <Link href="/login" style={{ color:'rgba(255,255,255,0.6)', textDecoration:'underline' }}>Log in</Link>
                </p>
              </div>
            </div>
          )}

          {role === 'shopper' && <ShopperForm onBack={() => setRole(null)} />}
          {role === 'creator' && <CreatorForm onBack={() => setRole(null)} />}
          {role === 'brand'   && <BrandForm   onBack={() => setRole(null)} />}

        </div>
      </div>
    </>
  )
}