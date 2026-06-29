'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SESSION_KEY = 'ck_creator_draft'
const NICHES    = ['Beauty','Skincare','Fashion','Home Decor','Wellness','Jewellery','Food & Lifestyle','Travel','Fitness']
const PLATFORMS = ['Instagram','YouTube','Pinterest','Blog','LinkedIn','Other']
const FOLLOWERS = ['Under 1,000','1,000–10,000','10,000–50,000','50,000–2,00,000','2,00,000+']
const LANGUAGES = ['English','Hindi','Both English & Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Other']
const ENG_RATES = ['Under 1%','1–3%','3–6%','6–10%','Above 10%']
const SOURCES   = ['Instagram','A friend or creator','Google','A brand I work with','Other']
const STEPS     = ['Basic info','Platforms','Content','Instagram','Payouts']

function draftSave(data: object) { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)) } catch {} }
function draftLoad<T>(): T | null { try { const r = sessionStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null } catch { return null } }
function draftClear() { try { sessionStorage.removeItem(SESSION_KEY) } catch {} }

const winp: React.CSSProperties = { width:'100%', padding:'14px 18px', border:'1px solid #E5E5E5', borderRadius:8, fontSize:14, color:'#0A0A0A', background:'#fff', outline:'none', fontFamily:'DM Sans, sans-serif' }
const wsel: React.CSSProperties = { width:'100%', padding:'14px 18px', border:'1px solid #E5E5E5', borderRadius:8, fontSize:14, color:'#0A0A0A', background:'#fff', outline:'none', fontFamily:'DM Sans, sans-serif', appearance:'none' as const, cursor:'pointer' }

function WCheck({ checked, onChange, children }: { checked:boolean; onChange:()=>void; children:React.ReactNode }) {
  return (
    <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer' }}>
      <div onClick={onChange} style={{ width:18, height:18, border:`1.5px solid ${checked ? '#0A0A0A' : '#D4D4D4'}`, borderRadius:4, flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center', background: checked ? '#0A0A0A' : '#fff', cursor:'pointer', transition:'all 0.15s' }}>
        {checked && <span style={{ fontSize:10, color:'#fff', fontWeight:700 }}>✓</span>}
      </div>
      <span style={{ fontSize:13, color:'#6B6B6B', lineHeight:1.6 }}>{children}</span>
    </label>
  )
}

export default function CreatorSignupPage() {
  const [step, setStep]                             = useState(1)
  const [name, setName]                             = useState('')
  const [email, setEmail]                           = useState('')
  const [password, setPass]                         = useState('')
  const [countryCode, setCountryCode]               = useState('+91')
  const [phone, setPhone]                           = useState('')
  const [city, setCity]                             = useState('')
  const [ageOk, setAgeOk]                           = useState(false)
  const [primaryPlatform, setPrimaryPlatform]       = useState('')
  const [primaryHandle, setPrimaryHandle]           = useState('')
  const [primaryFollowers, setPrimaryFollowers]     = useState('')
  const [secondaryPlatform, setSecondaryPlatform]   = useState('')
  const [secondaryHandle, setSecondaryHandle]       = useState('')
  const [secondaryFollowers, setSecondaryFollowers] = useState('')
  const [engagementRate, setEngagementRate]         = useState('')
  const [niches, setNiches]                         = useState<string[]>([])
  const [language, setLanguage]                     = useState('')
  const [bio, setBio]                               = useState('')
  const [source, setSource]                         = useState('')
  const [referral, setReferral]                     = useState('')
  const [igConnected, setIgConnected]               = useState(false)
  const [igHandle, setIgHandle]                     = useState('')
  const [upiId, setUpiId]                           = useState('')
  const [panNumber, setPanNumber]                   = useState('')
  const [agreedTos, setAgreedTos]                   = useState(false)
  const [agreedAffiliate, setAgreedAffiliate]       = useState(false)
  const [error, setError]                           = useState('')
  const [loading, setLoading]                       = useState(false)
  const [done, setDone]                             = useState(false)

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
      window.history.replaceState({}, '', '/signup/creator')
    } else if (p.get('ig_error')) {
      restoreDraft(); setError('Instagram verification failed. You can skip it below.'); go(4)
      window.history.replaceState({}, '', '/signup/creator')
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

  if (done) return (
    <div style={{ minHeight:'100vh', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'DM Sans, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Fanwood+Text:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={{ width:48, height:48, border:'1.5px solid #0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:20 }}>✓</div>
      <p style={{ fontSize:10, letterSpacing:'0.18em', color:'#9B9B9B', marginBottom:12, textTransform:'uppercase' }}>Application received</p>
      <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:40, fontWeight:300, color:'#0A0A0A', marginBottom:14, textAlign:'center', lineHeight:1.1 }}>You're on your way.</h1>
      <p style={{ fontSize:14, color:'#6B6B6B', maxWidth:320, textAlign:'center', lineHeight:1.7, marginBottom:36 }}>We'll review your profile and get back to you within 3–5 days. Keep creating.</p>
      <button onClick={() => router.push('/')} style={{ padding:'12px 36px', background:'#0A0A0A', color:'#fff', fontSize:12, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
        BACK TO CURATEKIN
      </button>
    </div>
  )

  const Dots = () => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:48 }}>
      {STEPS.map((label, i) => {
        const n = i + 1
        const isDone = step > n
        const isCurrent = step === n
        return (
          <div key={n} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div title={label} style={{ width:30, height:30, borderRadius:'50%', border:`1.5px solid ${isDone || isCurrent ? '#0A0A0A' : '#D4D4D4'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, background: isDone ? '#0A0A0A' : '#fff', color: isDone ? '#fff' : isCurrent ? '#0A0A0A' : '#D4D4D4', transition:'all 0.2s', fontFamily:'DM Sans, sans-serif', cursor: isDone ? 'pointer' : 'default' }}
              onClick={() => isDone && go(n)}>
              {isDone ? '✓' : n}
            </div>
            {i < STEPS.length - 1 && <div style={{ width:28, height:1, background: step > n ? '#0A0A0A' : '#E5E5E5' }} />}
          </div>
        )
      })}
    </div>
  )

  const Nav = ({ onNext, nextLabel='NEXT', isSubmit=false, showBack=true }: { onNext:()=>void; nextLabel?:string; isSubmit?:boolean; showBack?:boolean }) => (
    <div style={{ display:'flex', gap:12, marginTop:20 }}>
      {showBack && (
        <button onClick={prev} style={{ flex:1, padding:'14px', border:'1px solid #E5E5E5', background:'#fff', color:'#6B6B6B', fontSize:12, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
          GO BACK
        </button>
      )}
      <button onClick={onNext} disabled={isSubmit && loading} style={{ flex: showBack ? 2 : 1, padding:'14px', background:'#0A0A0A', color:'#fff', fontSize:12, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit', borderRadius:8, opacity: (isSubmit && loading) ? 0.6 : 1 }}>
        {isSubmit && loading ? 'SUBMITTING...' : nextLabel}
      </button>
    </div>
  )

  const SL = ({ t }: { t: string }) => <p style={{ fontSize:11, letterSpacing:'0.1em', color:'#9B9B9B', textTransform:'uppercase', marginBottom:8 }}>{t}</p>
  const fs: React.CSSProperties = { display:'flex', flexDirection:'column', gap:14 }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fanwood+Text:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={{ minHeight:'100vh', background:'#fff', fontFamily:'DM Sans, sans-serif' }}>

        <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', height:64, borderBottom:'0.5px solid #EBEBEB', position:'sticky', top:0, background:'#fff', zIndex:10 }}>
          <Link href="/" style={{ fontFamily:"'Fanwood Text', Georgia, serif", fontSize:32, fontWeight:400, color:'#0A0A0A', textDecoration:'none' }}>
            Curate<em style={{ fontStyle:'italic', color:'#B07D4A' }}>Kin</em>
          </Link>
          <div style={{ display:'flex', gap:28, alignItems:'center' }}>
            <Link href="/signup" style={{ fontSize:14, color:'#0A0A0A', textDecoration:'none', fontWeight:400 }}>← Back</Link>
            <Link href="/login" style={{ fontSize:14, color:'#0A0A0A', textDecoration:'none', fontWeight:400 }}>
              Log In
            </Link>
            <Link href="/signup" style={{ fontSize:14, color:'#0A0A0A', textDecoration:'none', fontWeight:500, padding:'8px 20px', border:'1.5px solid #0A0A0A', borderRadius:4 }}>
              Sign Up
            </Link>
          </div>
        </nav>

        <div style={{ maxWidth:560, margin:'0 auto', padding:'56px 24px 80px' }}>
          <Dots />

          {error && (
            <div style={{ padding:'12px 16px', background:'#FFF5F5', border:'1px solid #FED7D7', borderRadius:8, marginBottom:24 }}>
              <p style={{ fontSize:13, color:'#C53030' }}>{error}</p>
            </div>
          )}

          {step === 1 && (
            <div>
            <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:52, fontWeight:300, color:'#0A0A0A', textAlign:'center', lineHeight:1.1, marginBottom:16 }}>Apply to be a<br/>CurateKin Creator</h1>
            <p style={{ fontSize:14, color:'#6B6B6B', textAlign:'center', lineHeight:1.7, marginBottom:48 }}>Share your most loved and trusted products and monetise them.</p>
              <div style={fs}>
                <input type="text"     placeholder="Full name*"                    value={name}     onChange={e => setName(e.target.value)}  style={winp} />
                <input type="email"    placeholder="Email address*"               value={email}    onChange={e => setEmail(e.target.value)} style={winp} />
                <input type="password" placeholder="Password (min 6 characters)*" value={password} onChange={e => setPass(e.target.value)}  minLength={6} style={winp} />
                <input type="text"     placeholder="City*"                        value={city}     onChange={e => setCity(e.target.value)}  style={winp} />
                <div style={{ display:'flex', gap:10 }}>
                  <select value={countryCode} onChange={e => setCountryCode(e.target.value)} style={{ ...wsel, width:90, flexShrink:0 }}>
                    {['+91','+1','+44','+971','+65'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input type="tel" placeholder="Phone number* (10 digits)" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} maxLength={10} style={{ ...winp, flex:1 }} />
                </div>
                <WCheck checked={ageOk} onChange={() => setAgeOk(a => !a)}>I confirm I am 18 years of age or older*</WCheck>
                <div style={{ display:'flex', gap:12, marginTop:20 }}>
                  <button onClick={() => router.push('/')} style={{ flex:1, padding:'14px', border:'1px solid #E5E5E5', background:'#fff', color:'#6B6B6B', fontSize:12, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
                    GO TO HOME
                  </button>
                  <button onClick={() => {
                    if (!name || !email || !password) return setError('Please fill all required fields')
                    if (password.length < 6) return setError('Password must be at least 6 characters')
                    if (phone.replace(/\D/g,'').length < 10) return setError('Phone number must be at least 10 digits')
                    if (!city) return setError('Please enter your city')
                    if (!ageOk) return setError('You must confirm you are 18 or older')
                    next()
                  }} style={{ flex:2, padding:'14px', background:'#0A0A0A', color:'#fff', fontSize:12, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
                    NEXT
                  </button>
                </div>
                <p style={{ textAlign:'center', fontSize:12, color:'#9B9B9B', marginTop:4 }}>
                  Are you a brand? <Link href="/signup" style={{ color:'#0A0A0A', textDecoration:'underline' }}>Apply here</Link>
                </p>
                <a href="/dashboard" style={{ display:'block', textAlign:'center', fontSize:11, color:'#D4D4D4', padding:'8px', border:'1px dashed #E5E5E5', textDecoration:'none', borderRadius:4 }}>⚡ Preview dashboard (editor only)</a>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:44, fontWeight:300, color:'#0A0A0A', textAlign:'center', lineHeight:1.1, marginBottom:8 }}>Your platforms</h1>
              <p style={{ fontSize:14, color:'#6B6B6B', textAlign:'center', marginBottom:40 }}>It's about taste, not follower count.</p>
              <div style={fs}>
                <SL t="Primary platform" />
                <select value={primaryPlatform} onChange={e => setPrimaryPlatform(e.target.value)} style={wsel}>
                  <option value="">Select platform*</option>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
                <input type="text" placeholder="Handle or profile URL*" value={primaryHandle} onChange={e => setPrimaryHandle(e.target.value)} style={winp} />
                <select value={primaryFollowers} onChange={e => setPrimaryFollowers(e.target.value)} style={wsel}>
                  <option value="">Follower count*</option>
                  {FOLLOWERS.map(r => <option key={r}>{r}</option>)}
                </select>
                <select value={engagementRate} onChange={e => setEngagementRate(e.target.value)} style={wsel}>
                  <option value="">Average engagement rate</option>
                  {ENG_RATES.map(r => <option key={r}>{r}</option>)}
                </select>
                <div style={{ borderTop:'1px solid #F0F0F0', paddingTop:16 }}>
                  <SL t="Secondary platform (optional)" />
                  <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:6 }}>
                    <select value={secondaryPlatform} onChange={e => setSecondaryPlatform(e.target.value)} style={wsel}>
                      <option value="">Select platform</option>
                      {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                    </select>
                    {secondaryPlatform && <>
                      <input type="text" placeholder="Handle or profile URL" value={secondaryHandle} onChange={e => setSecondaryHandle(e.target.value)} style={winp} />
                      <select value={secondaryFollowers} onChange={e => setSecondaryFollowers(e.target.value)} style={wsel}>
                        <option value="">Follower count</option>
                        {FOLLOWERS.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </>}
                  </div>
                </div>
                <Nav onNext={() => {
                  if (!primaryPlatform || !primaryHandle || !primaryFollowers) return setError('Please fill all required platform fields')
                  next()
                }} nextLabel="NEXT" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:44, fontWeight:300, color:'#0A0A0A', textAlign:'center', lineHeight:1.1, marginBottom:8 }}>Your content</h1>
              <p style={{ fontSize:14, color:'#6B6B6B', textAlign:'center', marginBottom:40 }}>Tell us what makes your taste unique.</p>
              <div style={fs}>
                <div>
                  <SL t="Your niche*" />
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
                    {NICHES.map(n => (
                      <button key={n} type="button" onClick={() => toggleNiche(n)} style={{ padding:'8px 16px', borderRadius:99, border:`1px solid ${niches.includes(n) ? '#0A0A0A' : '#E5E5E5'}`, background: niches.includes(n) ? '#0A0A0A' : '#fff', color: niches.includes(n) ? '#fff' : '#6B6B6B', fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>{n}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <SL t="Content language*" />
                  <select value={language} onChange={e => setLanguage(e.target.value)} style={{ ...wsel, marginTop:6 }}>
                    <option value="">Select language</option>
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <SL t="Bio & content style*" />
                  <textarea placeholder="Describe your content style, aesthetic, and what makes your recommendations unique..." value={bio} onChange={e => setBio(e.target.value)} rows={4} style={{ ...winp, resize:'none', marginTop:6, lineHeight:1.6 }} />
                </div>
                <select value={source} onChange={e => setSource(e.target.value)} style={wsel}>
                  <option value="">How did you hear about us?</option>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
                <input type="text" placeholder="Referral code (optional)" value={referral} onChange={e => setReferral(e.target.value)} style={winp} />
                <Nav onNext={() => {
                  if (!niches.length || !language || !bio) return setError('Please fill niche, language, and bio')
                  next()
                }} nextLabel="NEXT" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:44, fontWeight:300, color:'#0A0A0A', textAlign:'center', lineHeight:1.1, marginBottom:8 }}>Verify Instagram</h1>
              <p style={{ fontSize:14, color:'#6B6B6B', textAlign:'center', marginBottom:40 }}>Prove you own the account you're applying with.</p>
              <div style={fs}>
                {igConnected
                  ? <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', border:'1px solid #E5E5E5', borderRadius:8, background:'#FAFAFA' }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16, flexShrink:0 }}>✓</div>
                      <div>
                        <p style={{ fontSize:14, color:'#0A0A0A', fontWeight:500 }}>@{igHandle}</p>
                        <p style={{ fontSize:12, color:'#9B9B9B' }}>Instagram verified</p>
                      </div>
                    </div>
                  : <button onClick={connectInstagram} style={{ width:'100%', padding:'14px', background:'linear-gradient(to right, #833ab4, #fd1d1d, #fcb045)', color:'#fff', fontSize:13, letterSpacing:'0.06em', border:'none', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
                      Connect Instagram
                    </button>
                }
                <Nav onNext={next} nextLabel={igConnected ? 'NEXT' : 'SKIP FOR NOW →'} />
                {!igConnected && <p style={{ fontSize:12, color:'#9B9B9B', textAlign:'center' }}>You can verify from your creator dashboard after approval.</p>}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:44, fontWeight:300, color:'#0A0A0A', textAlign:'center', lineHeight:1.1, marginBottom:8 }}>Payouts & agreement</h1>
              <p style={{ fontSize:14, color:'#6B6B6B', textAlign:'center', marginBottom:40 }}>Almost there. Set up how you'll get paid.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div>
                  <SL t="UPI ID" />
                  <input type="text" placeholder="e.g. yourname@okicici*" value={upiId} onChange={e => setUpiId(e.target.value)} style={{ ...winp, marginTop:6 }} />
                  <p style={{ fontSize:12, color:'#9B9B9B', marginTop:6, lineHeight:1.5 }}>Your 80% commission is transferred here monthly once balance crosses ₹100.</p>
                </div>
                <div>
                  <SL t="PAN Number" />
                  <input type="text" placeholder="e.g. ABCDE1234F*" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} maxLength={10} style={{ ...winp, marginTop:6 }} />
                  <p style={{ fontSize:12, color:'#9B9B9B', marginTop:6, lineHeight:1.5 }}>Required for earnings above ₹50,000/year. Never shared with brands.</p>
                </div>
                <div style={{ borderTop:'1px solid #F0F0F0', paddingTop:20, display:'flex', flexDirection:'column', gap:14 }}>
                  <SL t="Agreements" />
                  <WCheck checked={agreedTos} onChange={() => setAgreedTos(a => !a)}>
                    I agree to the <a href="/terms" target="_blank" style={{ color:'#0A0A0A', textDecoration:'underline' }}>Terms & Conditions</a> and <a href="/privacy" target="_blank" style={{ color:'#0A0A0A', textDecoration:'underline' }}>Privacy Policy</a>*
                  </WCheck>
                  <WCheck checked={agreedAffiliate} onChange={() => setAgreedAffiliate(a => !a)}>
                    I agree to the <a href="/affiliate-policy" target="_blank" style={{ color:'#0A0A0A', textDecoration:'underline' }}>Affiliate & Commission Policy</a>, including the 80% commission structure*
                  </WCheck>
                </div>
                <Nav onNext={() => submit(false)} nextLabel="SUBMIT APPLICATION" isSubmit />
                <button onClick={() => submit(true)} style={{ background:'none', border:'1px dashed #E5E5E5', color:'#D4D4D4', fontSize:11, letterSpacing:'0.06em', padding:'10px', cursor:'pointer', fontFamily:'inherit', borderRadius:4 }}>
                  ⚡ Skip payouts & submit (testing only)
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}