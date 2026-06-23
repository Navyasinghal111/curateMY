'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Role = 'shopper' | 'creator' | 'brand' | null

function PendingScreen({ title, sub, onHome }: { title: string; sub: string; onHome: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 text-center py-16">
      <div className="w-12 h-12 rounded-full bg-white/10 border border-[#B89A6E] flex items-center justify-center mb-6 text-[#B89A6E] text-lg">✓</div>
      <p className="text-[10px] tracking-[0.2em] text-[#B89A6E] mb-3">YOU'RE IN</p>
      <h1 className="font-[family-name:var(--font-cormorant)] text-[28px] font-light text-white mb-4">{title}</h1>
      <p className="text-[12px] text-white/60 font-light leading-relaxed max-w-xs mb-8">{sub}</p>
      <button onClick={onHome} className="px-8 py-3 bg-white text-[#1C1814] text-[11px] tracking-[0.1em] hover:bg-white/90 transition-colors">
        Back to Curatekin
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
    setLoading(true)
    setError('')
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: name,
        role: 'shopper',
        status: 'pending',
      })
    }
    setLoading(false)
    setSubmitted(true)
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
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [platform, setPlatform] = useState('')
  const [handle, setHandle] = useState('')
  const [followers, setFollowers] = useState('')
  const [niches, setNiches] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [source, setSource] = useState('')
  const [referral, setReferral] = useState('')
  const [igConnected, setIgConnected] = useState(false)
  const [igHandle, setIgHandle] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  // Check if Instagram was just verified (coming back from OAuth)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('ig_success') === 'true') {
      setIgConnected(true)
      setIgHandle(params.get('ig_handle') || '')
      setStep(4)
      window.history.replaceState({}, '', '/signup')
    }
    if (params.get('ig_error')) {
      setError('Instagram verification failed. Please try again.')
      setStep(4)
      window.history.replaceState({}, '', '/signup')
    }
  }, [])

  const NICHES = ['Beauty', 'Skincare', 'Fashion', 'Home Decor', 'Wellness', 'Jewellery', 'Food & Lifestyle', 'Travel', 'Fitness']
  const toggleNiche = (n: string) => setNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id, display_name: name, phone, role: 'creator',
        status: 'pending', platform, handle, followers_range: followers,
        niches, bio, referral_code: referral || null,
        instagram_handle: igHandle || null,
        instagram_verified: igConnected,
      })
    }
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) return <PendingScreen title="Application received." sub="We'll review your profile and get back to you within 3–5 days. Keep creating." onHome={() => router.push('/')} />

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#B89A6E] transition-colors"
  const selectClass = "w-full px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white/70 outline-none focus:border-[#B89A6E] transition-colors appearance-none"

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button onClick={step > 1 ? () => setStep(s => s - 1) : onBack} className="text-[11px] tracking-[0.08em] text-white/50 hover:text-white transition-colors">← Back</button>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border transition-all
                ${step > s ? 'bg-[#B89A6E] border-[#B89A6E] text-white' : step === s ? 'bg-white border-white text-[#1C1814]' : 'border-white/30 text-white/30'}`}>
                {step > s ? '✓' : s}
              </div>
              {i < 3 && <div className={`w-6 h-px ${step > s ? 'bg-[#B89A6E]' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>
        <p className="text-[10px] tracking-[0.18em] text-[#B89A6E]">FOR CREATORS</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 py-6 overflow-y-auto">
        <div className="w-full max-w-xs">
          {error && <p className="text-[11px] text-red-400 text-center mb-4">{error}</p>}

          {step === 1 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] font-light text-white text-center mb-2">Apply as a creator</h2>
            <p className="text-[11px] text-white/50 text-center mb-6 font-light">Turn your taste into income.</p>
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Full name*" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
              <input type="email" placeholder="Email address*" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
              <input type="password" placeholder="Password (min 6 characters)*" value={password} onChange={e => setPassword(e.target.value)} minLength={6} className={inputClass} />
              <div className="flex gap-2">
                <select className="w-24 px-3 py-3 bg-white/5 border border-white/20 text-[12px] text-white/70 outline-none focus:border-[#B89A6E] appearance-none">
                  <option>+91</option><option>+1</option><option>+44</option>
                </select>
                <input type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} className="flex-1 px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#B89A6E] transition-colors" />
              </div>
              <button onClick={() => name && email && password ? setStep(2) : setError('Please fill all required fields')}
                className="w-full py-3 bg-white text-[#1C1814] text-[11px] tracking-[0.1em] hover:bg-white/90 transition-colors mt-2">NEXT</button>
            </div>
          </>}

          {step === 2 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] font-light text-white text-center mb-2">Your platforms</h2>
            <p className="text-[11px] text-white/50 text-center mb-6 font-light">It's about taste, not follower count.</p>
            <div className="flex flex-col gap-3">
              <select value={platform} onChange={e => setPlatform(e.target.value)} className={selectClass}>
                <option value="">Primary platform*</option>
                <option>Instagram</option><option>YouTube</option><option>Pinterest</option><option>Blog</option><option>Other</option>
              </select>
              <input type="text" placeholder="Your handle or profile URL*" value={handle} onChange={e => setHandle(e.target.value)} className={inputClass} />
              <select value={followers} onChange={e => setFollowers(e.target.value)} className={selectClass}>
                <option value="">Follower count*</option>
                <option>Under 1,000</option><option>1,000 - 10,000</option><option>10,000 - 50,000</option><option>50,000 - 2,00,000</option><option>2,00,000+</option>
              </select>
              <div>
                <p className="text-[10px] tracking-[0.12em] text-[#B89A6E] mb-2">YOUR NICHE</p>
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
              <button onClick={() => platform && handle && followers ? setStep(3) : setError('Please fill all fields')}
                className="w-full py-3 bg-white text-[#1C1814] text-[11px] tracking-[0.1em] hover:bg-white/90 transition-colors mt-2">NEXT</button>
            </div>
          </>}

          {step === 3 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] font-light text-white text-center mb-2">Your aesthetic</h2>
            <p className="text-[11px] text-white/50 text-center mb-6 font-light">Tell us what makes your taste unique.</p>
            <div className="flex flex-col gap-3">
              <textarea placeholder="Describe your content style and the products you love..." value={bio} onChange={e => setBio(e.target.value)} rows={3}
                className={`${inputClass} resize-none`} />
              <select value={source} onChange={e => setSource(e.target.value)} className={selectClass}>
                <option value="">How did you hear about us?</option>
                <option>Instagram</option><option>A friend or creator</option><option>Google</option><option>A brand I work with</option><option>Other</option>
              </select>
              <input type="text" placeholder="Referral code (optional)" value={referral} onChange={e => setReferral(e.target.value)} className={inputClass} />
              <button onClick={() => setStep(4)}
                className="w-full py-3 bg-white text-[#1C1814] text-[11px] tracking-[0.1em] hover:bg-white/90 transition-colors mt-2">NEXT</button>
            </div>
          </>}

          {step === 4 && <>
            <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] font-light text-white text-center mb-2">Verify Instagram</h2>
            <p className="text-[11px] text-white/50 text-center mb-6 font-light">Confirm you own the account you're applying with.</p>
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
                <a href="/api/auth/instagram"
                  className="w-full py-3 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white text-[11px] tracking-[0.1em] text-center block hover:opacity-90 transition-opacity">
                  CONNECT INSTAGRAM
                </a>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading || !igConnected}
                className="w-full py-3 bg-[#B89A6E] text-white text-[11px] tracking-[0.1em] hover:bg-[#A6895D] transition-colors disabled:opacity-40">
                {loading ? 'Submitting...' : 'APPLY'}
              </button>
              {!igConnected && (
                <p className="text-[10px] text-white/30 text-center">Please connect your Instagram to continue</p>
              )}
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
    e.preventDefault()
    setLoading(true)
    const { error: insertError } = await supabase.from('brand_inquiries').insert({
      company_name: company, email, website, category, budget, message,
    })
    if (insertError) { setError(insertError.message); setLoading(false); return }
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) return <PendingScreen title="We'll be in touch." sub="Our team will reach out within 24 hours to schedule your walkthrough." onHome={() => router.push('/')} />

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-[#B89A6E] transition-colors"
  const selectClass = "w-full px-4 py-3 bg-white/5 border border-white/20 text-[12px] text-white/70 outline-none focus:border-[#B89A6E] transition-colors appearance-none"

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
              <option>Under 50,000</option><option>50,000 - 2,00,000</option><option>2,00,000 - 10,00,000</option><option>10,00,000+</option>
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
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])

  const cards = [
    {
      role: 'shopper' as Role,
      image: '/card-shopper.jpg',
      title: 'For Shoppers',
      sub: 'A destination for shopping, from trusted brands and quality.',
      btn: 'CREATE AN ACCOUNT',
    },
    {
      role: 'creator' as Role,
      image: '/card-creator.jpg',
      title: 'For Creators',
      sub: 'Curate your great taste. Build your storefront and earn.',
      btn: 'APPLY',
    },
    {
      role: 'brand' as Role,
      image: '/card-brand.jpg',
      title: 'For Brands',
      sub: 'No one pushes your product like the people who love them.',
      btn: 'APPLY',
    },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-[#1C1814]/80 backdrop-blur-sm z-40" onClick={() => !role && router.push('/')} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-6xl bg-[#1C1814] shadow-2xl flex flex-col"
          style={{ height: 'min(780px, 94vh)' }}
        >
          {!role && (
            <button
              onClick={() => router.push('/')}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors text-xl"
            >
              x
            </button>
          )}

          {!role && (
            <div className="flex flex-col h-full">
              <div className="flex-1 grid grid-cols-3 gap-0">
                {cards.map((card) => (
                  <button
                    key={card.role}
                    onClick={() => setRole(card.role)}
                    className="relative overflow-hidden group text-left flex flex-col justify-between"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url(${card.image})` }}
                    />
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors duration-300" />
                    <div className="relative z-10 flex flex-col justify-between h-full p-6">
                      <div />
                      <div>
                        <h3 className="font-[family-name:var(--font-cormorant)] text-[28px] font-light text-white mb-2">
                          {card.title}
                        </h3>
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
                  <Link href="/login" className="text-white/70 underline hover:text-white transition-colors">
                    Log in
                  </Link>
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