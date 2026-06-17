'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Role = 'shopper' | 'creator' | 'brand' | null

// ── SHOPPER FORM ────────────────────────────────────────────────
function ShopperForm({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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
  }

  if (!loading && !error) {
    // show pending after submit — handled by pending screen below
  }

  return (
    <div className="min-h-screen bg-[#FDFCFA] flex flex-col">
      <nav className="flex items-center justify-between px-7 h-14 border-b border-[#DDD5C8]">
        <Link href="/" className="font-serif text-[20px] tracking-[0.14em] text-[#1C1814]">
          curatekin<span className="text-[#B89A6E]">.</span>
        </Link>
        <button onClick={onBack} className="text-[11px] tracking-[0.08em] text-[#7A736B] hover:text-[#1C1814] transition-colors">
          ← Back
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <p className="text-[10px] tracking-[0.2em] text-[#B89A6E] mb-3 text-center">SHOPPER</p>
          <h1 className="font-serif text-[32px] font-light text-[#1C1814] text-center mb-2">
            Create your account
          </h1>
          <p className="text-[12px] text-[#7A736B] text-center mb-8 font-light leading-relaxed">
            Discover products curated by people you trust.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && (
              <p className="text-[11px] text-red-500 text-center">{error}</p>
            )}
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]"
            />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1C1814] text-[#F0EBE2] text-[11px] tracking-[0.1em] rounded-sm hover:bg-[#3D3730] transition-colors mt-2 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── CREATOR FORM ─────────────────────────────────────────────────
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
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const NICHES = ['Beauty', 'Skincare', 'Fashion', 'Home Decor', 'Wellness', 'Jewellery', 'Food & Lifestyle', 'Travel', 'Fitness']

  const toggleNiche = (n: string) => {
    setNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: name,
        phone,
        role: 'creator',
        status: 'pending',
        platform,
        handle,
        followers_range: followers,
        niches,
        bio,
        referral_code: referral || null,
      })
    }

    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <PendingScreen
        title="Application received."
        sub="We'll review your profile and get back to you within 3–5 days. Keep creating — we'll be in touch."
        onHome={() => router.push('/')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFCFA] flex flex-col">
      <nav className="flex items-center justify-between px-7 h-14 border-b border-[#DDD5C8]">
        <Link href="/" className="font-serif text-[20px] tracking-[0.14em] text-[#1C1814]">
          curatekin<span className="text-[#B89A6E]">.</span>
        </Link>
        <button onClick={step > 1 ? () => setStep(s => s - 1) : onBack} className="text-[11px] tracking-[0.08em] text-[#7A736B] hover:text-[#1C1814] transition-colors">
          ← Back
        </button>
      </nav>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-0 pt-8 pb-2">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] border transition-all
              ${step > s ? 'bg-[#B89A6E] border-[#B89A6E] text-white' :
                step === s ? 'bg-[#1C1814] border-[#1C1814] text-[#F0EBE2]' :
                'border-[#DDD5C8] text-[#7A736B]'}`}>
              {step > s ? '✓' : s}
            </div>
            {i < 2 && <div className={`w-10 h-px ${step > s ? 'bg-[#B89A6E]' : 'bg-[#DDD5C8]'}`} />}
          </div>
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">

          {/* Step 1 */}
          {step === 1 && (
            <>
              <p className="text-[10px] tracking-[0.2em] text-[#B89A6E] mb-3 text-center">STEP 1 OF 3</p>
              <h1 className="font-serif text-[28px] font-light text-[#1C1814] text-center mb-2">
                Apply as a creator
              </h1>
              <p className="text-[12px] text-[#7A736B] text-center mb-8 font-light">
                Turn your taste into income.
              </p>
              {error && <p className="text-[11px] text-red-500 text-center mb-4">{error}</p>}
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="Full name*" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]" />
                <input type="email" placeholder="Email address*" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]" />
                <input type="password" placeholder="Password (min 6 characters)*" value={password} onChange={e => setPassword(e.target.value)} minLength={6}
                  className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]" />
                <div className="flex gap-2">
                  <select className="w-24 px-3 py-3 border border-[#DDD5C8] rounded-sm text-[12px] text-[#7A736B] bg-[#FDFCFA] outline-none focus:border-[#B89A6E]">
                    <option>🇮🇳 +91</option>
                    <option>🇺🇸 +1</option>
                    <option>🇬🇧 +44</option>
                    <option>🇦🇪 +971</option>
                  </select>
                  <input type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)}
                    className="flex-1 px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]" />
                </div>
                <button onClick={() => name && email && password ? setStep(2) : setError('Please fill all required fields')}
                  className="w-full py-3 bg-[#1C1814] text-[#F0EBE2] text-[11px] tracking-[0.1em] rounded-sm hover:bg-[#3D3730] transition-colors mt-2">
                  Next
                </button>
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <p className="text-[10px] tracking-[0.2em] text-[#B89A6E] mb-3 text-center">STEP 2 OF 3</p>
              <h1 className="font-serif text-[28px] font-light text-[#1C1814] text-center mb-2">
                Your platforms
              </h1>
              <p className="text-[12px] text-[#7A736B] text-center mb-8 font-light">
                It's about taste, not follower count.
              </p>
              <div className="flex flex-col gap-3">
                <select value={platform} onChange={e => setPlatform(e.target.value)}
                  className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] text-[#7A736B] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] appearance-none">
                  <option value="">Primary platform*</option>
                  <option>Instagram</option>
                  <option>YouTube</option>
                  <option>Pinterest</option>
                  <option>Blog / Website</option>
                  <option>Other</option>
                </select>
                <input type="text" placeholder="Your handle or profile URL*" value={handle} onChange={e => setHandle(e.target.value)}
                  className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]" />
                <select value={followers} onChange={e => setFollowers(e.target.value)}
                  className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] text-[#7A736B] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] appearance-none">
                  <option value="">Follower count*</option>
                  <option>Under 1,000</option>
                  <option>1,000 – 10,000</option>
                  <option>10,000 – 50,000</option>
                  <option>50,000 – 2,00,000</option>
                  <option>2,00,000+</option>
                </select>
                <div>
                  <p className="text-[10px] tracking-[0.12em] text-[#B89A6E] mb-2">YOUR NICHE</p>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map(n => (
                      <button key={n} type="button" onClick={() => toggleNiche(n)}
                        className={`text-[10px] tracking-[0.06em] px-3 py-1.5 border rounded-sm transition-all
                          ${niches.includes(n) ? 'bg-[#1C1814] text-[#F0EBE2] border-[#1C1814]' : 'border-[#DDD5C8] text-[#7A736B] hover:border-[#1C1814]'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => platform && handle && followers ? setStep(3) : setError('Please fill all fields')}
                  className="w-full py-3 bg-[#1C1814] text-[#F0EBE2] text-[11px] tracking-[0.1em] rounded-sm hover:bg-[#3D3730] transition-colors mt-2">
                  Next
                </button>
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <p className="text-[10px] tracking-[0.2em] text-[#B89A6E] mb-3 text-center">STEP 3 OF 3</p>
              <h1 className="font-serif text-[28px] font-light text-[#1C1814] text-center mb-2">
                Your aesthetic
              </h1>
              <p className="text-[12px] text-[#7A736B] text-center mb-8 font-light">
                Tell us what makes your taste unique.
              </p>
              <div className="flex flex-col gap-3">
                <textarea placeholder="Describe your content style and the products you love to recommend..." value={bio} onChange={e => setBio(e.target.value)} rows={4}
                  className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E] resize-none" />
                <select value={source} onChange={e => setSource(e.target.value)}
                  className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] text-[#7A736B] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] appearance-none">
                  <option value="">How did you hear about us?</option>
                  <option>Instagram</option>
                  <option>A friend or creator</option>
                  <option>Google</option>
                  <option>A brand I work with</option>
                  <option>Other</option>
                </select>
                <input type="text" placeholder="Referral code (optional)" value={referral} onChange={e => setReferral(e.target.value)}
                  className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]" />
                <button onClick={handleSubmit} disabled={loading}
                  className="w-full py-3 bg-[#B89A6E] text-white text-[11px] tracking-[0.1em] rounded-sm hover:bg-[#A6895D] transition-colors mt-2 disabled:opacity-50">
                  {loading ? 'Submitting...' : 'Submit application'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── BRAND FORM ────────────────────────────────────────────────────
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
    setError('')

    const { error: insertError } = await supabase.from('brand_inquiries').insert({
      company_name: company,
      email,
      website,
      category,
      budget,
      message,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }

    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <PendingScreen
        title="We'll be in touch."
        sub="Thank you for your interest. Our team will reach out within 24 hours to schedule your walkthrough."
        onHome={() => router.push('/')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFCFA] flex flex-col">
      <nav className="flex items-center justify-between px-7 h-14 border-b border-[#DDD5C8]">
        <Link href="/" className="font-serif text-[20px] tracking-[0.14em] text-[#1C1814]">
          curatekin<span className="text-[#B89A6E]">.</span>
        </Link>
        <button onClick={onBack} className="text-[11px] tracking-[0.08em] text-[#7A736B] hover:text-[#1C1814] transition-colors">
          ← Back
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <p className="text-[10px] tracking-[0.2em] text-[#B89A6E] mb-3 text-center">FOR BRANDS</p>
          <h1 className="font-serif text-[28px] font-light text-[#1C1814] text-center mb-2">
            Partner with Curatekin
          </h1>
          <p className="text-[12px] text-[#7A736B] text-center mb-8 font-light leading-relaxed">
            No one pushes your product like the people who love it.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && <p className="text-[11px] text-red-500 text-center">{error}</p>}
            <input type="text" placeholder="Brand / company name*" value={company} onChange={e => setCompany(e.target.value)} required
              className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]" />
            <input type="email" placeholder="Work email*" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]" />
            <input type="url" placeholder="Website URL" value={website} onChange={e => setWebsite(e.target.value)}
              className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E]" />
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] text-[#7A736B] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] appearance-none">
              <option value="">Category</option>
              <option>Beauty</option>
              <option>Skincare</option>
              <option>Fashion</option>
              <option>Home Decor</option>
              <option>Wellness</option>
              <option>Jewellery</option>
              <option>Other</option>
            </select>
            <select value={budget} onChange={e => setBudget(e.target.value)}
              className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] text-[#7A736B] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] appearance-none">
              <option value="">Monthly budget</option>
              <option>Under ₹50,000</option>
              <option>₹50,000 – ₹2,00,000</option>
              <option>₹2,00,000 – ₹10,00,000</option>
              <option>₹10,00,000+</option>
            </select>
            <textarea placeholder="Tell us about your brand and goals..." value={message} onChange={e => setMessage(e.target.value)} rows={3}
              className="w-full px-4 py-3 border border-[#DDD5C8] rounded-sm text-[12px] font-light text-[#1C1814] bg-[#FDFCFA] outline-none focus:border-[#B89A6E] transition-colors placeholder:text-[#B0A89E] resize-none" />
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#1C1814] text-[#F0EBE2] text-[11px] tracking-[0.1em] rounded-sm hover:bg-[#3D3730] transition-colors mt-2 disabled:opacity-50">
              {loading ? 'Sending...' : 'Request demo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── PENDING SCREEN ────────────────────────────────────────────────
function PendingScreen({ title, sub, onHome }: { title: string; sub: string; onHome: () => void }) {
  return (
    <div className="min-h-screen bg-[#FDFCFA] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-[#F7F3EE] border border-[#B89A6E] flex items-center justify-center mb-6 text-[#B89A6E] text-lg">
        ✓
      </div>
      <p className="text-[10px] tracking-[0.2em] text-[#B89A6E] mb-3">YOU'RE IN</p>
      <h1 className="font-serif text-[32px] font-light text-[#1C1814] mb-4">{title}</h1>
      <p className="text-[13px] text-[#7A736B] font-light leading-relaxed max-w-sm mb-8">{sub}</p>
      <button onClick={onHome}
        className="px-8 py-3 bg-[#1C1814] text-[#F0EBE2] text-[11px] tracking-[0.1em] rounded-sm hover:bg-[#3D3730] transition-colors">
        Back to Curatekin
      </button>
    </div>
  )
}

// ── MAIN SIGNUP PAGE ──────────────────────────────────────────────
export default function SignupPage() {
  const [role, setRole] = useState<Role>(null)

  if (role === 'shopper') return <ShopperForm onBack={() => setRole(null)} />
  if (role === 'creator') return <CreatorForm onBack={() => setRole(null)} />
  if (role === 'brand') return <BrandForm onBack={() => setRole(null)} />

  const cards = [
    {
      role: 'shopper' as Role,
      image: '/card-shopper.jpg',
      eyebrow: 'FOR SHOPPERS',
      title: 'A destination for shopping',
      sub: 'From trusted brands and quality',
    },
    {
      role: 'creator' as Role,
      image: '/card-creator.jpg',
      eyebrow: 'FOR CREATORS',
      title: 'Curate your great taste',
      sub: 'Build your storefront and earn from what you love',
    },
    {
      role: 'brand' as Role,
      image: '/card-brand.jpg',
      eyebrow: 'FOR BRANDS',
      title: 'No one pushes your product like the people who love them',
      sub: 'Partner with India\'s most trusted curators',
    },
  ]

  return (
    <div className="min-h-screen bg-[#1C1814] flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-7 h-14 border-b border-white/10">
        <Link href="/" className="font-serif text-[20px] tracking-[0.14em] text-white">
          curatekin<span className="text-[#B89A6E]">.</span>
        </Link>
        <Link href="/login" className="text-[11px] tracking-[0.08em] text-white/60 hover:text-white transition-colors">
          Sign in
        </Link>
      </nav>

      {/* Heading */}
      <div className="text-center pt-12 pb-8 px-6">
        <p className="text-[10px] tracking-[0.2em] text-[#B89A6E] mb-3">JOIN CURATEKIN</p>
        <h1 className="font-serif text-[36px] font-light text-white leading-tight">
          Who are you?
        </h1>
      </div>

      {/* 3 Cards */}
      <div className="flex-1 flex items-center justify-center px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
          {cards.map((card) => (
            <button
              key={card.role}
              onClick={() => setRole(card.role)}
              className="relative h-[480px] rounded-sm overflow-hidden group text-left"
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${card.image})` }}
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />
              {/* Text */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <p className="text-[9px] tracking-[0.2em] text-[#B89A6E] mb-2">{card.eyebrow}</p>
                <h2 className="font-serif text-[22px] font-light text-white leading-tight mb-2">
                  {card.title}
                </h2>
                <p className="text-[11px] text-white/70 font-light mb-4">{card.sub}</p>
                <span className="text-[10px] tracking-[0.12em] text-white border-b border-white/40 pb-0.5 w-fit group-hover:border-white transition-colors">
                  GET STARTED →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Already have account */}
      <div className="text-center pb-8">
        <p className="text-[12px] text-white/40">
          Already have an account?{' '}
          <Link href="/login" className="text-white/70 underline hover:text-white transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}