'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ── OTP CONFIG ─────────────────────────────────────────────────────
// Flip to true when MSG91 credentials are in Vercel env vars:
// MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, MSG91_SENDER_ID
const OTP_ENABLED = false
// ──────────────────────────────────────────────────────────────────

const SESSION_KEY = 'ck_creator_draft'

type Role = 'shopper' | 'creator' | 'brand' | null

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

function ShopperForm({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, display_name: name, role: 'shopper', status: 'pending' })
    }
    setLoading(false); setSubmitted(true)
  }

  if (submitted) return <PendingScreen title="You're on the list." sub="We're setting up your account. Check back soon to start discovering." onHome={() => router.push('/')} />

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button onClick={onBack} className="text-[11px] tracking-[0.08em] text-white/50 hover:text-white transition-colors">← Back</button>
        <p className="text-[10px] tracking-[0.18em] text-[#B89A6E]">FOR SHOPPERS</p>
        <div className="w-10" />
      </div>
      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-xs">
          <h2 className="font-[family-name:var(--font-cormorant)] text-[30px] font-light text-white text-center mb-2">Create your account</h2>
          <p className="text-[11px] text-white/50 text-center mb-8 font-light">Discover products curated by people you trust.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}
            <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#B89A6E] transition-colors" />
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#B89A6E] transition-colors" />
            <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#B89A6E] transition-colors" />
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-white text-[#1C1814] text-[11px] tracking-[0.1em] hover:bg-white/90 transition-colors mt-2 disabled:opacity-50">
              {loading ? 'Creating...' : 'CREATE AN ACCOUNT'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function CreatorForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1)

  // Step 1
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)

  // OTP (MSG91 — disabled until OTP_ENABLED = true)
  const [otpSent, setOtpSent] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')

  // Step 2
  const [primaryPlatform, setPrimaryPlatform] = useState('')
  const [primaryHandle, setPrimaryHandle] = useState('')
  const [primaryFollowers, setPrimaryFollowers] = useState('')
  const [secondaryPlatform, setSecondaryPlatform] = useState('')
  const [secondaryHandle, setSecondaryHandle] = useState('')
  const [secondaryFollowers, setSecondaryFollowers] = useState('')
  const [engagementRate, setEngagementRate] = useState('')

  // Step 3
  const [niches, setNiches] = useState<string[]>([])
  const [contentLanguage, setContentLanguage] = useState('')
  const [bio, setBio] = useState('')
  const [portfolioLinks, setPortfolioLinks] = useState(['', '', ''])
  const [source, setSource] = useState('')
  const [referral, setReferral] = useState('')

  // Step 4
  const [igConnected, setIgConnected] = useState(false)
  const [igHandle, setIgHandle] = useState('')

  // Step 5
  const [upiId, setUpiId] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [agreedTos, setAgreedTos] = useState(false)
  const [agreedAffiliate, setAgreedAffiliate] = useState(false)

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const NICHES = ['Beauty', 'Skincare', 'Fashion', 'Home Decor', 'Wellness', 'Jewellery', 'Food & Lifestyle', 'Travel', 'Fitness']
  const toggleNiche = (n: string) => setNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  const updatePortfolioLink = (i: number, val: string) => {
    const updated = [...portfolioLinks]; updated[i] = val; setPortfolioLinks(updated)
  }

  // ── Save draft to sessionStorage ─────────────────────────────────
  const saveDraft = () => {
    const draft = {
      name, email, password, countryCode, phone, city, ageConfirmed,
      primaryPlatform, primaryHandle, primaryFollowers,
      secondaryPlatform, secondaryHandle, secondaryFollowers, engagementRate,
      niches, contentLanguage, bio, portfolioLinks, source, referral,
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(draft))
  }

  // ── Restore draft from sessionStorage ────────────────────────────
  const restoreDraft = () => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (!raw) return false
      const d = JSON.parse(raw)
      setName(d.name || ''); setEmail(d.email || ''); setPassword(d.password || '')
      setCountryCode(d.countryCode || '+91'); setPhone(d.phone || ''); setCity(d.city || '')
      setAgeConfirmed(d.ageConfirmed || false)
      setPrimaryPlatform(d.primaryPlatform || ''); setPrimaryHandle(d.primaryHandle || '')
      setPrimaryFollowers(d.primaryFollowers || '')
      setSecondaryPlatform(d.secondaryPlatform || ''); setSecondaryHandle(d.secondaryHandle || '')
      setSecondaryFollowers(d.secondaryFollowers || ''); setEngagementRate(d.engagementRate || '')
      setNiches(d.niches || []); setContentLanguage(d.contentLanguage || '')
      setBio(d.bio || ''); setPortfolioLinks(d.portfolioLinks || ['', '', ''])
      setSource(d.source || ''); setReferral(d.referral || '')
      return true
    } catch { return false }
  }

  // ── Check Instagram OAuth callback on mount ───────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('ig_success') === 'true') {
      const restored = restoreDraft()
      if (restored) {
        setIgConnected(true)
        setIgHandle(params.get('ig_handle') || '')
        setStep(5)
        sessionStorage.removeItem(SESSION_KEY)
        window.history.replaceState({}, '', '/signup')
      } else {
        // Draft lost — send back to step 1
        setError('Session expired. Please fill in your details again.')
        window.history.replaceState({}, '', '/signup')
      }
    }
    if (params.get('ig_error')) {
      restoreDraft()
      setError('Instagram verification failed. Please try again.')
      setStep(4)
      window.history.replaceState({}, '', '/signup')
    }
  }, [])

  // ── OTP: Send via MSG91 ───────────────────────────────────────────
  const sendOtp = async () => {
    if (!OTP_ENABLED) { setOtpVerified(true); return }
    if (!phone || phone.length < 10) { setOtpError('Enter a valid phone number'); return }
    setOtpLoading(true); setOtpError('')
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `${countryCode}${phone}` }),
      })
      const data = await res.json()
      if (data.success) { setOtpSent(true) } else { setOtpError(data.error || 'Failed to send OTP') }
    } catch { setOtpError('Network error. Please try again.') }
    setOtpLoading(false)
  }

  // ── OTP: Verify via MSG91 ─────────────────────────────────────────
  const verifyOtp = async () => {
    if (!OTP_ENABLED) { setOtpVerified(true); return }
    if (!otpValue || otpValue.length < 4) { setOtpError('Enter the OTP'); return }
    setOtpLoading(true); setOtpError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `${countryCode}${phone}`, otp: otpValue }),
      })
      const data = await res.json()
      if (data.success) { setOtpVerified(true) } else { setOtpError(data.error || 'Invalid OTP') }
    } catch { setOtpError('Network error. Please try again.') }
    setOtpLoading(false)
  }

  // ── Step validations ──────────────────────────────────────────────
  const handleStep1Next = () => {
    if (!name || !email || !password) { setError('Please fill all required fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!phone) { setError('Please enter your phone number'); return }
    if (!city) { setError('Please enter your city'); return }
    if (!ageConfirmed) { setError('You must confirm you are 18 or older'); return }
    if (OTP_ENABLED && !otpVerified) { setError('Please verify your phone number'); return }
    setError(''); setStep(2)
  }

  // ── Save draft + redirect to Instagram ───────────────────────────
  const connectInstagram = () => {
    saveDraft()
    window.location.href = '/api/auth/instagram'
  }

  // ── Final submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!upiId) { setError('UPI ID is required for payouts'); return }
    if (!panNumber) { setError('PAN number is required'); return }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) { setError('Enter a valid PAN number (e.g. ABCDE1234F)'); return }
    if (!agreedTos || !agreedAffiliate) { setError('Please agree to all terms to continue'); return }
    setLoading(true); setError('')
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id, display_name: name, phone: `${countryCode}${phone}`, city,
        role: 'creator', status: 'pending',
        primary_platform: primaryPlatform, primary_handle: primaryHandle, primary_followers: primaryFollowers,
        secondary_platform: secondaryPlatform || null, secondary_handle: secondaryHandle || null,
        secondary_followers: secondaryFollowers || null, engagement_rate: engagementRate || null,
        niches, content_language: contentLanguage, bio,
        portfolio_links: portfolioLinks.filter(l => l.trim() !== ''),
        referral_code: referral || null, source,
        instagram_handle: igHandle || null, instagram_verified: igConnected,
        upi_id: upiId, pan_number: panNumber.toUpperCase(),
        agreed_tos: agreedTos, agreed_affiliate: agreedAffiliate,
      })
    }
    setLoading(false); setSubmitted(true)
  }

  if (submitted) return <PendingScreen title="Application received." sub="We'll review your profile and get back to you within 3–5 days. Keep creating." onHome={() => router.push('/')} />

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#B89A6E] transition-colors"
  const selectClass = "w-full px-4 py-3 bg-[#2a2320] border border-white/20 text-[12px] text-white outline-none focus:border-[#B89A6E] transition-colors appearance-none"

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Step header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
        <button onClick={step > 1 ? () => { setError(''); setStep(s => s - 1) } : onBack}
          className="text-[11px] tracking-[0.08em] text-white/50 hover:text-white transition-colors">← Back</button>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] border transition-all
                ${step > s ? 'bg-[#B89A6E] border-[#B89A6E] text-white' : step === s ? 'bg-white border-white text-[#1C1814]' : 'border-white/30 text-white/30'}`}>
                {step > s ? '✓' : s}
              </div>
              {i < 4 && <div className={`w-4 h-px ${step > s ? 'bg-[#B89A6E]' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>
        <p className="text-[10px] tracking-[0.18em] text-[#B89A6E]">FOR CREATORS</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="w-full max-w-xs mx-auto">
          {error && <p className="text-[11px] text-red-400 text-center mb-4">{error}</p>}

          {/* ── STEP 1: Basic Info ── */}
          {step === 1 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[26px] font-light text-white text-center mb-1">Basic info</h2>
            <p className="text-[11px] text-white/50 text-center mb-5 font-light">Let's start with who you are.</p>
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Full name*" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
              <input type="email" placeholder="Email address*" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
              <input type="password" placeholder="Password (min 6 characters)*" value={password} onChange={e => setPassword(e.target.value)} minLength={6} className={inputClass} />
              <input type="text" placeholder="City*" value={city} onChange={e => setCity(e.target.value)} className={inputClass} />
              <div>
                <div className="flex gap-2">
                  <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                    className="w-20 px-2 py-3 bg-[#2a2320] border border-white/20 text-[12px] text-white outline-none focus:border-[#B89A6E] appearance-none">
                    <option value="+91">+91</option><option value="+1">+1</option>
                    <option value="+44">+44</option><option value="+971">+971</option><option value="+65">+65</option>
                  </select>
                  <input type="tel" placeholder="Phone number*" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/, ''))} maxLength={10}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#B89A6E] transition-colors" />
                </div>
                {OTP_ENABLED && !otpVerified && (
                  <div className="mt-2">
                    {!otpSent ? (
                      <button onClick={sendOtp} disabled={otpLoading}
                        className="w-full py-2 border border-white/30 text-white/70 text-[10px] tracking-[0.1em] hover:border-white/60 transition-colors disabled:opacity-40">
                        {otpLoading ? 'Sending...' : 'SEND OTP'}
                      </button>
                    ) : (
                      <div className="flex gap-2 mt-1">
                        <input type="text" placeholder="Enter OTP" value={otpValue} onChange={e => setOtpValue(e.target.value)} maxLength={6}
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#B89A6E]" />
                        <button onClick={verifyOtp} disabled={otpLoading}
                          className="px-4 py-2 bg-white text-[#1C1814] text-[10px] tracking-[0.08em] disabled:opacity-40">
                          {otpLoading ? '...' : 'VERIFY'}
                        </button>
                      </div>
                    )}
                    {otpError && <p className="text-[10px] text-red-400 mt-1">{otpError}</p>}
                  </div>
                )}
                {!OTP_ENABLED && phone.length >= 10 && (
                  <p className="text-[10px] text-white/30 mt-1">Phone verification coming soon.</p>
                )}
                {OTP_ENABLED && otpVerified && (
                  <p className="text-[10px] text-[#B89A6E] mt-1">✓ Phone verified</p>
                )}
              </div>
              <label className="flex items-start gap-3 cursor-pointer mt-1">
                <div onClick={() => setAgeConfirmed(a => !a)}
                  className={`w-4 h-4 border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer
                    ${ageConfirmed ? 'bg-[#B89A6E] border-[#B89A6E]' : 'border-white/30'}`}>
                  {ageConfirmed && <span className="text-white text-[9px]">✓</span>}
                </div>
                <span className="text-[11px] text-white/60 leading-relaxed">I confirm I am 18 years of age or older*</span>
              </label>
              <button onClick={handleStep1Next}
                className="w-full py-3 bg-white text-[#1C1814] text-[11px] tracking-[0.1em] hover:bg-white/90 transition-colors mt-1">NEXT</button>
            </div>
          </>}

          {/* ── STEP 2: Platforms ── */}
          {step === 2 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[26px] font-light text-white text-center mb-1">Your platforms</h2>
            <p className="text-[11px] text-white/50 text-center mb-5 font-light">It's about taste, not follower count.</p>
            <div className="flex flex-col gap-3">
              <p className="text-[10px] tracking-[0.12em] text-[#B89A6E]">PRIMARY PLATFORM</p>
              <select value={primaryPlatform} onChange={e => setPrimaryPlatform(e.target.value)} className={selectClass}>
                <option value="">Select platform*</option>
                <option>Instagram</option><option>YouTube</option><option>Pinterest</option><option>Blog</option><option>LinkedIn</option><option>Other</option>
              </select>
              <input type="text" placeholder="Handle or profile URL*" value={primaryHandle} onChange={e => setPrimaryHandle(e.target.value)} className={inputClass} />
              <select value={primaryFollowers} onChange={e => setPrimaryFollowers(e.target.value)} className={selectClass}>
                <option value="">Follower count*</option>
                <option>Under 1,000</option><option>1,000–10,000</option><option>10,000–50,000</option><option>50,000–2,00,000</option><option>2,00,000+</option>
              </select>
              <div className="border-t border-white/10 pt-3 mt-1">
                <p className="text-[10px] tracking-[0.12em] text-[#B89A6E] mb-3">SECONDARY PLATFORM <span className="text-white/30 normal-case tracking-normal">(optional)</span></p>
                <select value={secondaryPlatform} onChange={e => setSecondaryPlatform(e.target.value)} className={selectClass}>
                  <option value="">Select platform</option>
                  <option>Instagram</option><option>YouTube</option><option>Pinterest</option><option>Blog</option><option>LinkedIn</option><option>Other</option>
                </select>
                {secondaryPlatform && <div className="flex flex-col gap-3 mt-3">
                  <input type="text" placeholder="Handle or profile URL" value={secondaryHandle} onChange={e => setSecondaryHandle(e.target.value)} className={inputClass} />
                  <select value={secondaryFollowers} onChange={e => setSecondaryFollowers(e.target.value)} className={selectClass}>
                    <option value="">Follower count</option>
                    <option>Under 1,000</option><option>1,000–10,000</option><option>10,000–50,000</option><option>50,000–2,00,000</option><option>2,00,000+</option>
                  </select>
                </div>}
              </div>
              <select value={engagementRate} onChange={e => setEngagementRate(e.target.value)} className={selectClass}>
                <option value="">Average engagement rate</option>
                <option>Under 1%</option><option>1–3%</option><option>3–6%</option><option>6–10%</option><option>Above 10%</option>
              </select>
              <button onClick={() => primaryPlatform && primaryHandle && primaryFollowers ? (setError(''), setStep(3)) : setError('Please fill all required platform fields')}
                className="w-full py-3 bg-white text-[#1C1814] text-[11px] tracking-[0.1em] hover:bg-white/90 transition-colors mt-1">NEXT</button>
            </div>
          </>}

          {/* ── STEP 3: Content & Niche ── */}
          {step === 3 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[26px] font-light text-white text-center mb-1">Your content</h2>
            <p className="text-[11px] text-white/50 text-center mb-5 font-light">Tell us what makes your taste unique.</p>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[10px] tracking-[0.12em] text-[#B89A6E] mb-2">YOUR NICHE*</p>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map(n => (
                    <button key={n} type="button" onClick={() => toggleNiche(n)}
                      className={`text-[10px] tracking-[0.06em] px-3 py-1.5 border transition-all
                        ${niches.includes(n) ? 'bg-white text-[#1C1814] border-white' : 'border-white/20 text-white/60 hover:border-white/50'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <select value={contentLanguage} onChange={e => setContentLanguage(e.target.value)} className={selectClass}>
                <option value="">Content language*</option>
                <option>English</option><option>Hindi</option><option>Both English & Hindi</option>
                <option>Tamil</option><option>Telugu</option><option>Kannada</option>
                <option>Malayalam</option><option>Marathi</option><option>Bengali</option><option>Other</option>
              </select>
              <textarea placeholder="Describe your content style and aesthetic...*" value={bio} onChange={e => setBio(e.target.value)} rows={3}
                className={`${inputClass} resize-none`} />
              <div>
                <p className="text-[10px] tracking-[0.12em] text-[#B89A6E] mb-2">PORTFOLIO LINKS <span className="text-white/30 normal-case tracking-normal">(up to 3 posts)</span></p>
                {portfolioLinks.map((link, i) => (
                  <input key={i} type="url" placeholder={`Link ${i + 1}`} value={link} onChange={e => updatePortfolioLink(i, e.target.value)}
                    className={`${inputClass} mb-2`} />
                ))}
              </div>
              <select value={source} onChange={e => setSource(e.target.value)} className={selectClass}>
                <option value="">How did you hear about us?</option>
                <option>Instagram</option><option>A friend or creator</option><option>Google</option><option>A brand I work with</option><option>Other</option>
              </select>
              <input type="text" placeholder="Referral code (optional)" value={referral} onChange={e => setReferral(e.target.value)} className={inputClass} />
              <button onClick={() => niches.length > 0 && contentLanguage && bio ? (setError(''), setStep(4)) : setError('Please fill niche, language, and bio')}
                className="w-full py-3 bg-white text-[#1C1814] text-[11px] tracking-[0.1em] hover:bg-white/90 transition-colors mt-1">NEXT</button>
            </div>
          </>}

          {/* ── STEP 4: Instagram ── */}
          {step === 4 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[26px] font-light text-white text-center mb-1">Verify Instagram</h2>
            <p className="text-[11px] text-white/50 text-center mb-5 font-light">Confirm you own the account you're applying with.</p>
            <div className="flex flex-col gap-4">
              {igConnected ? (
                <div className="flex items-center gap-3 px-4 py-3 border border-[#B89A6E]/50 bg-[#B89A6E]/10">
                  <div className="w-8 h-8 rounded-full bg-[#B89A6E] flex items-center justify-center text-white text-sm">✓</div>
                  <div>
                    <p className="text-[12px] text-white font-medium">@{igHandle}</p>
                    <p className="text-[10px] text-[#B89A6E]">Instagram verified</p>
                  </div>
                </div>
              ) : (
                <button onClick={connectInstagram}
                  className="w-full py-3 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white text-[11px] tracking-[0.1em] text-center hover:opacity-90 transition-opacity">
                  CONNECT INSTAGRAM
                </button>
              )}
              <button onClick={() => igConnected ? (setError(''), setStep(5)) : setError('Please connect your Instagram to continue')}
                disabled={!igConnected}
                className="w-full py-3 bg-white text-[#1C1814] text-[11px] tracking-[0.1em] hover:bg-white/90 transition-colors disabled:opacity-40">
                NEXT
              </button>
              {!igConnected && <p className="text-[10px] text-white/30 text-center">Instagram verification is required to apply</p>}
            </div>
          </>}

          {/* ── STEP 5: Payouts & Legal ── */}
          {step === 5 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[26px] font-light text-white text-center mb-1">Payouts & agreement</h2>
            <p className="text-[11px] text-white/50 text-center mb-5 font-light">Almost there. Set up how you'll get paid.</p>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[10px] tracking-[0.12em] text-[#B89A6E] mb-2">UPI DETAILS</p>
                <input type="text" placeholder="UPI ID (e.g. name@upi)*" value={upiId} onChange={e => setUpiId(e.target.value)} className={inputClass} />
                <p className="text-[10px] text-white/30 mt-1">Earnings above ₹100 will be transferred monthly to this UPI ID.</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.12em] text-[#B89A6E] mb-2">PAN NUMBER</p>
                <input type="text" placeholder="PAN number (e.g. ABCDE1234F)*" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} maxLength={10} className={inputClass} />
                <p className="text-[10px] text-white/30 mt-1">Required by Indian law for payments above ₹50,000/year.</p>
              </div>
              <div className="border-t border-white/10 pt-3 mt-1 flex flex-col gap-3">
                <p className="text-[10px] tracking-[0.12em] text-[#B89A6E]">AGREEMENTS</p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <div onClick={() => setAgreedTos(a => !a)}
                    className={`w-4 h-4 border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer
                      ${agreedTos ? 'bg-[#B89A6E] border-[#B89A6E]' : 'border-white/30'}`}>
                    {agreedTos && <span className="text-white text-[9px]">✓</span>}
                  </div>
                  <span className="text-[11px] text-white/60 leading-relaxed">
                    I have read and agree to the{' '}
                    <a href="/terms" target="_blank" className="text-[#B89A6E] underline hover:text-white transition-colors">Terms & Conditions</a>
                    {' '}and{' '}
                    <a href="/privacy" target="_blank" className="text-[#B89A6E] underline hover:text-white transition-colors">Privacy Policy</a>*
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <div onClick={() => setAgreedAffiliate(a => !a)}
                    className={`w-4 h-4 border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer
                      ${agreedAffiliate ? 'bg-[#B89A6E] border-[#B89A6E]' : 'border-white/30'}`}>
                    {agreedAffiliate && <span className="text-white text-[9px]">✓</span>}
                  </div>
                  <span className="text-[11px] text-white/60 leading-relaxed">
                    I agree to the{' '}
                    <a href="/affiliate-policy" target="_blank" className="text-[#B89A6E] underline hover:text-white transition-colors">Affiliate & Commission Policy</a>,
                    including the 80% commission structure and monthly payout schedule*
                  </span>
                </label>
              </div>
              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-3 bg-[#B89A6E] text-white text-[11px] tracking-[0.1em] hover:bg-[#A6895D] transition-colors mt-2 disabled:opacity-50">
                {loading ? 'Submitting...' : 'SUBMIT APPLICATION'}
              </button>
            </div>
          </>}

        </div>
      </div>
    </div>
  )
}

function BrandForm({ onBack }: { onBack: () => void }) {
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [category, setCategory] = useState('')
  const [budget, setBudget] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { error: insertError } = await supabase.from('brand_inquiries').insert({
      company_name: company, email, website, category, budget, message,
    })
    if (insertError) { setError(insertError.message); setLoading(false); return }
    setLoading(false); setSubmitted(true)
  }

  if (submitted) return <PendingScreen title="We'll be in touch." sub="Our team will reach out within 24 hours to schedule your walkthrough." onHome={() => router.push('/')} />

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#B89A6E] transition-colors"
  const selectClass = "w-full px-4 py-3 bg-[#2a2320] border border-white/20 text-[12px] text-white outline-none focus:border-[#B89A6E] transition-colors appearance-none"

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button onClick={onBack} className="text-[11px] tracking-[0.08em] text-white/50 hover:text-white transition-colors">← Back</button>
        <p className="text-[10px] tracking-[0.18em] text-[#B89A6E]">FOR BRANDS</p>
        <div className="w-10" />
      </div>
      <div className="flex-1 flex items-center justify-center px-8 py-6 overflow-y-auto">
        <div className="w-full max-w-xs">
          <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] font-light text-white text-center mb-2">Partner with Curatekin</h2>
          <p className="text-[11px] text-white/50 text-center mb-6 font-light">No one pushes your product like the people who love it.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}
            <input type="text" placeholder="Brand / company name*" value={company} onChange={e => setCompany(e.target.value)} required className={inputClass} />
            <input type="email" placeholder="Work email*" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
            <input type="url" placeholder="Website URL" value={website} onChange={e => setWebsite(e.target.value)} className={inputClass} />
            <select value={category} onChange={e => setCategory(e.target.value)} className={selectClass}>
              <option value="">Category</option>
              <option>Beauty</option><option>Skincare</option><option>Fashion</option><option>Home Decor</option><option>Wellness</option><option>Other</option>
            </select>
            <select value={budget} onChange={e => setBudget(e.target.value)} className={selectClass}>
              <option value="">Monthly budget</option>
              <option>Under ₹50,000</option><option>₹50,000–₹2,00,000</option><option>₹2,00,000–₹10,00,000</option><option>₹10,00,000+</option>
            </select>
            <textarea placeholder="Tell us about your brand and goals..." value={message} onChange={e => setMessage(e.target.value)} rows={3}
              className={`${inputClass} resize-none`} />
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-white text-[#1C1814] text-[11px] tracking-[0.1em] hover:bg-white/90 transition-colors mt-2 disabled:opacity-50">
              {loading ? 'Sending...' : 'APPLY'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  const [role, setRole] = useState<Role>(null)
  const router = useRouter()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') router.push('/') }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])

  const cards = [
    { role: 'shopper' as Role, image: '/card-shopper.jpg', title: 'For Shoppers', sub: 'A destination for shopping, from trusted brands and quality.', btn: 'CREATE AN ACCOUNT' },
    { role: 'creator' as Role, image: '/card-creator.jpg', title: 'For Creators', sub: 'Curate your great taste. Build your storefront and earn.', btn: 'APPLY' },
    { role: 'brand' as Role, image: '/card-brand.jpg', title: 'For Brands', sub: 'No one pushes your product like the people who love them.', btn: 'APPLY' },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-[#1C1814]/80 backdrop-blur-sm z-40" onClick={() => !role && router.push('/')} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-[#1C1814] shadow-2xl flex flex-col" style={{ height: 'min(780px, 94vh)' }}>
          {!role && (
            <button onClick={() => router.push('/')}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors text-xl">
              ×
            </button>
          )}
          {!role && (
            <div className="flex flex-col h-full">
              <div className="flex-1 grid grid-cols-3 gap-0">
                {cards.map((card) => (
                  <button key={card.role} onClick={() => setRole(card.role)}
                    className="relative overflow-hidden group text-left flex flex-col justify-between">
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url(${card.image})` }} />
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors duration-300" />
                    <div className="relative z-10 flex flex-col justify-between h-full p-6">
                      <div />
                      <div>
                        <h3 className="font-[family-name:var(--font-cormorant)] text-[28px] font-light text-white mb-2">{card.title}</h3>
                        <p className="text-[11px] text-white/60 font-light mb-6 leading-relaxed">{card.sub}</p>
                        <span className="inline-block px-5 py-2.5 border border-white/60 text-[10px] tracking-[0.12em] text-white group-hover:bg-white group-hover:text-[#1C1814] transition-all">
                          {card.btn}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-white/10 py-4 text-center">
                <p className="text-[11px] text-white/40">
                  Already have an account?{' '}
                  <Link href="/login" className="text-white/70 underline hover:text-white transition-colors">Log in</Link>
                </p>
              </div>
            </div>
          )}
          {role === 'shopper' && <ShopperForm onBack={() => setRole(null)} />}
          {role === 'creator' && <CreatorForm onBack={() => setRole(null)} />}
          {role === 'brand' && <BrandForm onBack={() => setRole(null)} />}
        </div>
      </div>
    </>
  )
}