'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ── CONFIG ────────────────────────────────────────────────────────
const OTP_ENABLED = false
const SESSION_KEY = 'ck_creator_draft'
// ─────────────────────────────────────────────────────────────────

type Role = 'shopper' | 'creator' | 'brand' | null

const inp = 'w-full px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#B89A6E] transition-colors'
const sel = 'w-full px-4 py-3 bg-[#2a2320] border border-white/20 text-[12px] text-white outline-none focus:border-[#B89A6E] transition-colors appearance-none'
const lbl = 'text-[10px] tracking-[0.12em] text-[#B89A6E]'
const GOLD = '#B89A6E'

const NICHES    = ['Beauty','Skincare','Fashion','Home Decor','Wellness','Jewellery','Food & Lifestyle','Travel','Fitness']
const PLATFORMS = ['Instagram','YouTube','Pinterest','Blog','LinkedIn','Other']
const FOLLOWERS = ['Under 1,000','1,000–10,000','10,000–50,000','50,000–2,00,000','2,00,000+']
const LANGUAGES = ['English','Hindi','Both English & Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Other']
const ENG_RATES = ['Under 1%','1–3%','3–6%','6–10%','Above 10%']
const SOURCES   = ['Instagram','A friend or creator','Google','A brand I work with','Other']

function PendingScreen({ title, sub, onHome }: { title: string; sub: string; onHome: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 text-center py-16">
      <div className="w-12 h-12 border border-[#B89A6E] flex items-center justify-center mb-6 text-[#B89A6E] text-lg">✓</div>
      <p className="text-[10px] tracking-[0.2em] text-[#B89A6E] mb-3">STATUS — RECEIVED</p>
      <h1 className="font-[family-name:var(--font-cormorant)] text-[28px] font-light text-white mb-4">{title}</h1>
      <p className="text-[12px] text-white/60 font-light leading-relaxed max-w-xs mb-8">{sub}</p>
      <button onClick={onHome} className="px-8 py-3 bg-white text-[#1C1814] text-[11px] tracking-[0.1em] hover:bg-white/90 transition-colors">
        BACK TO CURATEKIN
      </button>
    </div>
  )
}

function RoleHeader({ onBack, tag, children }: { onBack: () => void; tag: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
      <button onClick={onBack} className="text-[11px] tracking-[0.08em] text-white/50 hover:text-white transition-colors">← Back</button>
      {children ?? <div className="w-10" />}
      <p className="text-[10px] tracking-[0.18em] text-[#B89A6E]">{tag}</p>
    </div>
  )
}

function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div onClick={onChange} className={`w-4 h-4 border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer ${checked ? 'bg-[#B89A6E] border-[#B89A6E]' : 'border-white/30'}`}>
        {checked && <span className="text-white text-[9px]">✓</span>}
      </div>
      <span className="text-[11px] text-white/60 leading-relaxed">{children}</span>
    </label>
  )
}

function draftSave(data: object) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)) } catch {}
}
function draftLoad<T>(): T | null {
  try { const r = sessionStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null } catch { return null }
}
function draftClear() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch {}
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
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.signUp({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    if (data.user) await supabase.from('profiles').insert({ id: data.user.id, display_name: name, role: 'shopper', status: 'pending' })
    setLoading(false); setDone(true)
  }

  if (done) return <PendingScreen title="You're on the list." sub="We're setting up your account. Check back soon to start discovering." onHome={() => router.push('/')} />

  return (
    <div className="flex flex-col flex-1">
      <RoleHeader onBack={onBack} tag="FOR SHOPPERS" />
      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-xs">
          <h2 className="font-[family-name:var(--font-cormorant)] text-[30px] font-light text-white text-center mb-2">Create your account</h2>
          <p className="text-[11px] text-white/50 text-center mb-8 font-light">Discover products curated by people you trust.</p>
          <form onSubmit={submit} className="flex flex-col gap-3">
            {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}
            <input type="text"     placeholder="Full name"              value={name}     onChange={e => setName(e.target.value)}  required className={inp} />
            <input type="email"    placeholder="Email address"          value={email}    onChange={e => setEmail(e.target.value)} required className={inp} />
            <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPass(e.target.value)}  required minLength={6} className={inp} />
            <button type="submit" disabled={loading} className="w-full py-3 bg-white text-[#1C1814] text-[11px] tracking-[0.1em] hover:bg-white/90 transition-colors mt-2 disabled:opacity-50">
              {loading ? 'CREATING...' : 'CREATE AN ACCOUNT'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function CreatorForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1)
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPass]           = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [phone, setPhone]             = useState('')
  const [city, setCity]               = useState('')
  const [ageOk, setAgeOk]             = useState(false)
  const [primaryPlatform,   setPrimaryPlatform]   = useState('')
  const [primaryHandle,     setPrimaryHandle]     = useState('')
  const [primaryFollowers,  setPrimaryFollowers]  = useState('')
  const [secondaryPlatform, setSecondaryPlatform] = useState('')
  const [secondaryHandle,   setSecondaryHandle]   = useState('')
  const [secondaryFollowers,setSecondaryFollowers]= useState('')
  const [engagementRate,    setEngagementRate]    = useState('')
  const [niches,      setNiches]      = useState<string[]>([])
  const [language,    setLanguage]    = useState('')
  const [bio,         setBio]         = useState('')
  const [source,      setSource]      = useState('')
  const [referral,    setReferral]    = useState('')
  const [igConnected, setIgConnected] = useState(false)
  const [igHandle,    setIgHandle]    = useState('')
  const [upiId,          setUpiId]          = useState('')
  const [panNumber,      setPanNumber]      = useState('')
  const [agreedTos,      setAgreedTos]      = useState(false)
  const [agreedAffiliate,setAgreedAffiliate]= useState(false)
  const [otpSent,     setOtpSent]     = useState(false)
  const [otpValue,    setOtpValue]    = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpLoading,  setOtpLoading]  = useState(false)
  const [otpError,    setOtpError]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  const supabase = createClient()
  const router   = useRouter()

  const go = (n: number) => { setError(''); setStep(n); window.scrollTo(0, 0) }
  const next = () => go(step + 1)
  const prev = () => go(step - 1)
  const toggleNiche = (n: string) => setNiches(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n])

  const draftData = () => ({
    name, email, password, countryCode, phone, city, ageOk,
    primaryPlatform, primaryHandle, primaryFollowers,
    secondaryPlatform, secondaryHandle, secondaryFollowers, engagementRate,
    niches, language, bio, source, referral,
  })

  const restoreDraft = () => {
    const d = draftLoad<ReturnType<typeof draftData>>()
    if (!d) return false
    setName(d.name ?? ''); setEmail(d.email ?? ''); setPass(d.password ?? '')
    setCountryCode(d.countryCode ?? '+91'); setPhone(d.phone ?? ''); setCity(d.city ?? '')
    setAgeOk(d.ageOk ?? false)
    setPrimaryPlatform(d.primaryPlatform ?? ''); setPrimaryHandle(d.primaryHandle ?? '')
    setPrimaryFollowers(d.primaryFollowers ?? '')
    setSecondaryPlatform(d.secondaryPlatform ?? ''); setSecondaryHandle(d.secondaryHandle ?? '')
    setSecondaryFollowers(d.secondaryFollowers ?? ''); setEngagementRate(d.engagementRate ?? '')
    setNiches(d.niches ?? []); setLanguage(d.language ?? ''); setBio(d.bio ?? '')
    setSource(d.source ?? ''); setReferral(d.referral ?? '')
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

  const sendOtp = async () => {
    if (!OTP_ENABLED) { setOtpVerified(true); return }
    if (phone.replace(/\D/g,'').length < 10) { setOtpError('Enter a valid phone number'); return }
    setOtpLoading(true); setOtpError('')
    try {
      const res = await fetch('/api/auth/send-otp', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone: `${countryCode}${phone}` }) })
      const d = await res.json()
      d.success ? setOtpSent(true) : setOtpError(d.error ?? 'Failed to send OTP')
    } catch { setOtpError('Network error. Try again.') }
    setOtpLoading(false)
  }

  const verifyOtp = async () => {
    if (!OTP_ENABLED) { setOtpVerified(true); return }
    if (otpValue.length < 4) { setOtpError('Enter the OTP'); return }
    setOtpLoading(true); setOtpError('')
    try {
      const res = await fetch('/api/auth/verify-otp', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone:`${countryCode}${phone}`, otp:otpValue }) })
      const d = await res.json()
      d.success ? setOtpVerified(true) : setOtpError(d.error ?? 'Invalid OTP')
    } catch { setOtpError('Network error. Try again.') }
    setOtpLoading(false)
  }

  const step1Next = () => {
    if (!name || !email || !password) return setError('Please fill all required fields')
    if (password.length < 6)          return setError('Password must be at least 6 characters')
    if (phone.replace(/\D/g,'').length < 10) return setError('Phone number must be at least 10 digits')
    if (!city)                        return setError('Please enter your city')
    if (!ageOk)                       return setError('You must confirm you are 18 or older')
    next()
  }

  const step2Next = () => {
    if (!primaryPlatform || !primaryHandle || !primaryFollowers) return setError('Please fill all required platform fields')
    next()
  }

  const step3Next = () => {
    if (!niches.length || !language || !bio) return setError('Please fill niche, language, and bio')
    next()
  }

  const connectInstagram = () => { draftSave(draftData()); window.location.href = '/api/auth/instagram' }

  // ── SUBMIT — with optional step 5 fields for testing ──
  const submit = async (skipPayouts = false) => {
    if (!skipPayouts) {
      if (!upiId)      return setError('UPI ID is required for payouts')
      if (!panNumber)  return setError('PAN number is required')
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

      draftClear()
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return <PendingScreen title="Application received." sub="We'll review your profile and get back to you within 3–5 days. Keep creating." onHome={() => router.push('/')} />

  const Dots = () => (
    <div className="flex items-center gap-1.5">
      {[1,2,3,4,5].map((s,i) => (
        <div key={s} className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] border transition-all
            ${step > s ? `bg-[${GOLD}] border-[${GOLD}] text-white` : step === s ? 'bg-white border-white text-[#1C1814]' : 'border-white/30 text-white/30'}`}>
            {step > s ? '✓' : s}
          </div>
          {i < 4 && <div className={`w-4 h-px ${step > s ? `bg-[${GOLD}]` : 'bg-white/20'}`} />}
        </div>
      ))}
    </div>
  )

  const Nav = ({ onNext, label = 'NEXT', isSubmit = false, showBack = true }: { onNext: () => void; label?: string; isSubmit?: boolean; showBack?: boolean }) => (
    <div className="flex gap-2 mt-4">
      {showBack && (
        <button onClick={prev} className="flex-1 py-3 border border-white/20 text-white/50 text-[11px] tracking-[0.08em] hover:border-white/50 hover:text-white/80 transition-colors">
          ← BACK
        </button>
      )}
      <button onClick={onNext} disabled={isSubmit && loading}
        className={`${showBack ? 'flex-[2]' : 'w-full'} py-3 ${isSubmit ? `bg-[${GOLD}] hover:bg-[#A6895D]` : 'bg-white hover:bg-white/90'} ${isSubmit ? 'text-white' : 'text-[#1C1814]'} text-[11px] tracking-[0.1em] transition-colors disabled:opacity-50`}>
        {isSubmit && loading ? 'SUBMITTING...' : label}
      </button>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <RoleHeader onBack={step > 1 ? prev : onBack} tag="FOR CREATORS">
        <Dots />
      </RoleHeader>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="w-full max-w-xs mx-auto">
          {error && <p className="text-[11px] text-red-400 text-center mb-4">{error}</p>}

          {step === 1 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[26px] font-light text-white text-center mb-1">Basic info</h2>
            <p className="text-[11px] text-white/50 text-center mb-5 font-light">Let's start with who you are.</p>
            <div className="flex flex-col gap-3">
              <input type="text"     placeholder="Full name*"                    value={name}     onChange={e => setName(e.target.value)}  className={inp} />
              <input type="email"    placeholder="Email address*"               value={email}    onChange={e => setEmail(e.target.value)} className={inp} />
              <input type="password" placeholder="Password (min 6 characters)*" value={password} onChange={e => setPass(e.target.value)}  minLength={6} className={inp} />
              <input type="text"     placeholder="City*"                        value={city}     onChange={e => setCity(e.target.value)}  className={inp} />
              <div>
                <div className="flex gap-2">
                  <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                    className="w-20 px-2 py-3 bg-[#2a2320] border border-white/20 text-[12px] text-white outline-none focus:border-[#B89A6E] appearance-none">
                    {['+91','+1','+44','+971','+65'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input type="tel" placeholder="Phone number* (min 10 digits)" value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g,''))} maxLength={10}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#B89A6E] transition-colors" />
                </div>
              </div>
              <Checkbox checked={ageOk} onChange={() => setAgeOk(a => !a)}>
                I confirm I am 18 years of age or older*
              </Checkbox>
              <Nav onNext={step1Next} showBack={false} />
              {/* ⚡ Preview shortcut */}
              <a href="/dashboard"
                style={{ display:'block', textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.35)', letterSpacing:'0.08em', marginTop:12, textDecoration:'none', padding:'8px', border:'1px dashed rgba(255,255,255,0.2)', borderRadius:2 }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color='rgba(255,255,255,0.7)'; (e.currentTarget as HTMLAnchorElement).style.borderColor='rgba(255,255,255,0.4)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color='rgba(255,255,255,0.35)'; (e.currentTarget as HTMLAnchorElement).style.borderColor='rgba(255,255,255,0.2)' }}
              >⚡ Preview dashboard (editor only)</a>
            </div>
          </>}

          {step === 2 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[26px] font-light text-white text-center mb-1">Your platforms</h2>
            <p className="text-[11px] text-white/50 text-center mb-5 font-light">It's about taste, not follower count.</p>
            <div className="flex flex-col gap-3">
              <p className={lbl}>PRIMARY PLATFORM</p>
              <select value={primaryPlatform} onChange={e => setPrimaryPlatform(e.target.value)} className={sel}>
                <option value="">Select platform*</option>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
              <div className="flex gap-2">
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
              <div className="border-t border-white/10 pt-3">
                <p className={`${lbl} mb-3`}>SECONDARY PLATFORM <span className="text-white/30 normal-case tracking-normal">(optional)</span></p>
                <select value={secondaryPlatform} onChange={e => setSecondaryPlatform(e.target.value)} className={sel}>
                  <option value="">Select platform</option>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
                {secondaryPlatform && (
                  <div className="flex flex-col gap-3 mt-3">
                    <input type="text" placeholder="Handle or profile URL" value={secondaryHandle} onChange={e => setSecondaryHandle(e.target.value)} className={inp} />
                    <select value={secondaryFollowers} onChange={e => setSecondaryFollowers(e.target.value)} className={sel}>
                      <option value="">Follower count</option>
                      {FOLLOWERS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <Nav onNext={step2Next} />
            </div>
          </>}

          {step === 3 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[26px] font-light text-white text-center mb-1">Your content</h2>
            <p className="text-[11px] text-white/50 text-center mb-5 font-light">Tell us what makes your taste unique.</p>
            <div className="flex flex-col gap-3">
              <div>
                <p className={`${lbl} mb-2`}>YOUR NICHE*</p>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map(n => (
                    <button key={n} type="button" onClick={() => toggleNiche(n)}
                      className={`text-[10px] tracking-[0.06em] px-3 py-1.5 border transition-all ${niches.includes(n) ? 'bg-white text-[#1C1814] border-white' : 'border-white/20 text-white/60 hover:border-white/50'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <select value={language} onChange={e => setLanguage(e.target.value)} className={sel}>
                <option value="">Content language*</option>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
              <textarea placeholder="Describe your content style and aesthetic...*" value={bio} onChange={e => setBio(e.target.value)} rows={3} className={`${inp} resize-none`} />
              <div className="border-t border-white/10 pt-3 opacity-40 pointer-events-none select-none">
                <div className="flex items-center gap-2 mb-2">
                  <p className={lbl}>YOUR BEST POSTS / REELS</p>
                  <span className="text-[9px] text-white/30 border border-white/15 px-2 py-0.5 rounded-full font-mono tracking-wide">optional — skip for now</span>
                </div>
                {['best','second','third'].map((ord, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-white/20 font-mono w-5">0{i+1}</span>
                    <input disabled placeholder={`Link to your ${ord} post or reel`} className={`${inp} flex-1`} />
                  </div>
                ))}
              </div>
              <select value={source} onChange={e => setSource(e.target.value)} className={sel}>
                <option value="">How did you hear about us?</option>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
              <input type="text" placeholder="Referral code (optional)" value={referral} onChange={e => setReferral(e.target.value)} className={inp} />
              <Nav onNext={step3Next} />
            </div>
          </>}

          {step === 4 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[26px] font-light text-white text-center mb-1">Verify Instagram</h2>
            <p className="text-[11px] text-white/50 text-center mb-5 font-light">Prove you own the account you're applying with.</p>
            <div className="flex flex-col gap-3">
              {igConnected
                ? <div className="flex items-center gap-3 px-4 py-3 border border-[#B89A6E]/50 bg-[#B89A6E]/10">
                    <div className="w-8 h-8 rounded-full bg-[#B89A6E] flex items-center justify-center text-white text-sm flex-shrink-0">✓</div>
                    <div>
                      <p className="text-[12px] text-white font-medium">@{igHandle}</p>
                      <p className="text-[10px] text-[#B89A6E]">Instagram confirmed</p>
                    </div>
                  </div>
                : <button onClick={connectInstagram}
                    className="w-full py-3 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white text-[11px] tracking-[0.1em] hover:opacity-90 transition-opacity">
                    CONNECT INSTAGRAM
                  </button>
              }
              <Nav onNext={next} label={igConnected ? 'NEXT' : 'SKIP & CONTINUE →'} />
              {!igConnected && <p className="text-[10px] text-white/25 text-center font-mono">You can verify from your creator dashboard after approval.</p>}
            </div>
          </>}

          {step === 5 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[26px] font-light text-white text-center mb-1">Payouts & agreement</h2>
            <p className="text-[11px] text-white/50 text-center mb-5 font-light">Almost there. Set up how you'll get paid.</p>
            <div className="flex flex-col gap-4">
              <div>
                <p className={`${lbl} mb-2`}>UPI ID</p>
                <input type="text" placeholder="e.g. priya@okicici*" value={upiId} onChange={e => setUpiId(e.target.value)} className={inp} />
                <p className="text-[10px] text-white/30 mt-1 font-mono">Your 80% commission is transferred here monthly once your balance crosses ₹100.</p>
              </div>
              <div>
                <p className={`${lbl} mb-2`}>PAN NUMBER</p>
                <input type="text" placeholder="e.g. ABCDE1234F*" value={panNumber}
                  onChange={e => setPanNumber(e.target.value.toUpperCase())} maxLength={10} className={inp} />
                <p className="text-[10px] text-white/30 mt-1 font-mono">Required for earnings above ₹50,000/year. Never shared with brands.</p>
              </div>
              <div className="border-t border-white/10 pt-3 flex flex-col gap-3">
                <p className={lbl}>AGREEMENTS</p>
                <Checkbox checked={agreedTos} onChange={() => setAgreedTos(a => !a)}>
                  I have read and agree to the{' '}
                  <a href="/terms"   target="_blank" className="text-[#B89A6E] underline hover:text-white">Terms & Conditions</a>{'  and '}<a href="/privacy" target="_blank" className="text-[#B89A6E] underline hover:text-white">Privacy Policy</a>*
                </Checkbox>
                <Checkbox checked={agreedAffiliate} onChange={() => setAgreedAffiliate(a => !a)}>
                  I agree to the{' '}
                  <a href="/affiliate-policy" target="_blank" className="text-[#B89A6E] underline hover:text-white">Affiliate & Commission Policy</a>,
                  including the 80% commission structure and monthly payout schedule*
                </Checkbox>
              </div>
              <Nav onNext={() => submit(false)} label="SUBMIT APPLICATION →" isSubmit />
              {/* ── Testing shortcut — skip payouts ── */}
              <button onClick={() => submit(true)}
                style={{ background:'none', border:'1px dashed rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.25)', fontSize:10, letterSpacing:'0.08em', padding:'8px', cursor:'pointer', fontFamily:'inherit', marginTop:4 }}>
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
    <div className="flex flex-col flex-1">
      <RoleHeader onBack={onBack} tag="FOR BRANDS" />
      <div className="flex-1 flex items-center justify-center px-8 py-6 overflow-y-auto">
        <div className="w-full max-w-xs">
          <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] font-light text-white text-center mb-2">Partner with Curatekin</h2>
          <p className="text-[11px] text-white/50 text-center mb-6 font-light">No one pushes your product like the people who love it.</p>
          <form onSubmit={submit} className="flex flex-col gap-3">
            {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}
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
            <textarea placeholder="Tell us about your brand and goals..." value={message} onChange={e => setMessage(e.target.value)} rows={3} className={`${inp} resize-none`} />
            <button type="submit" disabled={loading} className="w-full py-3 bg-white text-[#1C1814] text-[11px] tracking-[0.1em] hover:bg-white/90 transition-colors mt-2 disabled:opacity-50">
              {loading ? 'SENDING...' : 'APPLY'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const ROLE_CARDS = [
  { role: 'shopper' as Role, image:'/card-shopper.jpg', title:'Shopper', sub:'A destination for shopping, not scrolling.', btn:'CREATE AN ACCOUNT' },
  { role: 'creator' as Role, image:'/card-creator.jpg', title:'Creator', sub:'Where great taste leads to great opportunities.', btn:'APPLY' },
  { role: 'brand'   as Role, image:'/card-brand.jpg',   title:'Brand',   sub:'No one pushes your product like the people who love them.', btn:'APPLY' },
]
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
      <div className="fixed inset-0 bg-[#1C1814]/80 backdrop-blur-sm z-40" onClick={() => { if (!role) goHome() }} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-[#1C1814] shadow-2xl flex flex-col" style={{ height:'min(780px,94vh)' }}>

          <button onClick={(e) => { e.stopPropagation(); window.history.back() }} className="absolute top-6 right-6 z-50 w-12 h-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all text-2xl rounded-full" style={{fontSize:28, lineHeight:1}}>×</button>

          {!role && (
            <div className="flex flex-col h-full">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 overflow-y-auto sm:overflow-hidden">
                {ROLE_CARDS.map(card => (
                  <button key={card.role} onClick={() => setRole(card.role)}
                    className="relative overflow-hidden group text-left flex flex-col justify-between min-h-[220px] sm:min-h-0">
                    {/* Photo */}
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage:`url(${card.image})` }} />
                    {/* Overlay — lighter than before */}
                    <div className="absolute inset-0" style={{ background:'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.1) 100%)' }} />
                    {/* Content — pinned to bottom */}
                    <div className="relative z-10 flex flex-col justify-end h-full p-6 sm:p-8">
                      <h3 style={{
                        fontFamily:'Cormorant Garamond, serif',
                        fontSize:'clamp(36px, 4vw, 56px)',
                        fontWeight:300,
                        color:'#fff',
                        lineHeight:1.05,
                        marginBottom:10,
                        letterSpacing:'-0.01em'
                      }}>{card.title}</h3>
                      <p style={{
                        fontSize:12,
                        color:'rgba(255,255,255,0.65)',
                        fontWeight:300,
                        lineHeight:1.6,
                        marginBottom:24,
                        maxWidth:240
                      }}>{card.sub}</p>
                      <span style={{
                        display:'inline-block',
                        padding:'10px 20px',
                        border:'1px solid rgba(255,255,255,0.6)',
                        fontSize:10,
                        letterSpacing:'0.12em',
                        color:'#fff',
                        fontFamily:'inherit',
                        alignSelf:'flex-start',
                        transition:'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLSpanElement).style.background='#fff'
                        ;(e.currentTarget as HTMLSpanElement).style.color='#000'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLSpanElement).style.background='transparent'
                        ;(e.currentTarget as HTMLSpanElement).style.color='#fff'
                      }}>
                        {card.btn}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-white/10 py-4 text-center flex-shrink-0" style={{background:'#1C1814'}}>
                <p className="text-[11px] text-white/40">
                  Already have an account?{' '}
                  <Link href="/login" className="text-white/70 underline hover:text-white transition-colors">Log in</Link>
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