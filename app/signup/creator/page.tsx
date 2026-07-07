'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SESSION_KEY = 'ck_creator_draft'
const NICHES    = ['Beauty','Skincare','Fashion','Home Decor','Wellness','Jewellery','Food & Lifestyle','Travel','Fitness']
const FOLLOWERS = ['Under 1,000','1,000–10,000','10,000–50,000','50,000–2,00,000','2,00,000+']
const LANGUAGES = ['English','Hindi','Both English & Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Other']
const STEPS     = ['Apply', 'Platforms', 'Content']

const INK    = '#0A0A0A'
const GOLD   = '#B07D4A'
const MUTED  = '#6B6B6B'
const MUTED2 = '#9B9B9B'
const BORDER = '#E5E5E5'
const SERIF  = "'Fanwood Text', 'Cormorant Garamond', Georgia, serif"
const SANS   = "'DM Sans', sans-serif"

function draftSave(data: object) { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)) } catch {} }
function draftLoad<T>(): T | null { try { const r = sessionStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null } catch { return null } }
function draftClear() { try { sessionStorage.removeItem(SESSION_KEY) } catch {} }

const winp: React.CSSProperties = { width:'100%', padding:'14px 18px', border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14, color:INK, background:'#fff', outline:'none', fontFamily:SANS }
const wsel: React.CSSProperties = { width:'100%', padding:'14px 18px', border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14, color:INK, background:'#fff', outline:'none', fontFamily:SANS, appearance:'none' as const, cursor:'pointer' }
const fs: React.CSSProperties = { display:'flex', flexDirection:'column', gap:14 }

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
        style={{ ...winp, paddingRight:44 }} />
      <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}
        style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', padding:0, cursor:'pointer', color:MUTED2, display:'flex', alignItems:'center' }}>
        {show ? EyeOffIcon : EyeIcon}
      </button>
    </div>
  )
}

function Dots({ step, onDotClick }: { step: number; onDotClick: (n: number) => void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:48 }}>
      {STEPS.map((label, i) => {
        const n = i + 1
        const isDone = step > n
        const isCurrent = step === n
        return (
          <div key={n} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div title={label} style={{ width:30, height:30, borderRadius:'50%', border:`1.5px solid ${isDone || isCurrent ? INK : '#CCC'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, background: isDone ? INK : '#fff', color: isDone ? '#fff' : isCurrent ? INK : '#CCC', transition:'all 0.2s', fontFamily:SANS, cursor: isDone ? 'pointer' : 'default' }}
              onClick={() => isDone && onDotClick(n)}>
              {isDone ? '✓' : n}
            </div>
            {i < STEPS.length - 1 && <div style={{ width:28, height:1.5, background: isDone ? INK : '#CCC' }} />}
          </div>
        )
      })}
    </div>
  )
}

function WCheck({ checked, onChange, children }: { checked:boolean; onChange:()=>void; children:React.ReactNode }) {
  return (
    <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer' }}>
      <div onClick={onChange} style={{ width:18, height:18, border:`1.5px solid ${checked ? INK : '#D4D4D4'}`, borderRadius:4, flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center', background: checked ? INK : '#fff', cursor:'pointer', transition:'all 0.15s' }}>
        {checked && <span style={{ fontSize:10, color:'#fff', fontWeight:700 }}>✓</span>}
      </div>
      <span style={{ fontSize:13, color:MUTED, lineHeight:1.6 }}>{children}</span>
    </label>
  )
}

export default function CreatorSignupPage() {
  const [step, setStep]                       = useState(1)
  const [firstName, setFirstName]             = useState('')
  const [lastName, setLastName]               = useState('')
  const [email, setEmail]                     = useState('')
  const [password, setPass]                   = useState('')
  const [countryCode, setCountryCode]         = useState('+91')
  const [phone, setPhone]                     = useState('')
  const [ageOk, setAgeOk]                     = useState(false)
  const [agreedTerms, setAgreedTerms]         = useState(false)

  const [igConnected, setIgConnected]         = useState(false)
  const [igHandle, setIgHandle]               = useState('')
  const [pinterestHandle, setPinterestHandle] = useState('')
  const [youtubeHandle, setYoutubeHandle]     = useState('')
  const [largestPlatform, setLargestPlatform] = useState('')
  const [followerCount, setFollowerCount]     = useState('')

  const [niches, setNiches]                   = useState<string[]>([])
  const [bio, setBio]                         = useState('')
  const [language, setLanguage]               = useState('')

  const [error, setError]                     = useState('')
  const [loading, setLoading]                 = useState(false)
  const [done, setDone]                       = useState(false)
  const [awaitingConfirm, setAwaitingConfirm]  = useState(false)

  const supabase = createClient()
  const router   = useRouter()

  const go   = (n: number) => { setError(''); setStep(n); window.scrollTo(0,0) }
  const next = () => go(step + 1)
  const prev = () => go(step - 1)
  const toggleNiche = (n: string) => {
    setNiches(prev => {
      if (prev.includes(n)) return prev.filter(x => x !== n)
      if (prev.length >= 3) return prev
      return [...prev, n]
    })
  }

  const draftData = () => ({ firstName, lastName, email, password, countryCode, phone, ageOk, agreedTerms, pinterestHandle, youtubeHandle, largestPlatform, followerCount })

  const restoreDraft = () => {
    const d = draftLoad<ReturnType<typeof draftData>>()
    if (!d) return false
    setFirstName(d.firstName ?? ''); setLastName(d.lastName ?? ''); setEmail(d.email ?? ''); setPass(d.password ?? '')
    setCountryCode(d.countryCode ?? '+91'); setPhone(d.phone ?? '')
    setAgeOk(d.ageOk ?? false); setAgreedTerms(d.agreedTerms ?? false)
    setPinterestHandle(d.pinterestHandle ?? ''); setYoutubeHandle(d.youtubeHandle ?? '')
    setLargestPlatform(d.largestPlatform ?? ''); setFollowerCount(d.followerCount ?? '')
    return true
  }

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('ig_success') === 'true') {
      if (restoreDraft()) { setIgConnected(true); setIgHandle(p.get('ig_handle') ?? ''); go(2) }
      else setError('Session expired. Please fill in your details again.')
      window.history.replaceState({}, '', '/signup/creator')
    } else if (p.get('ig_error')) {
      restoreDraft(); setError('Instagram verification failed. Please try connecting again.'); go(2)
      window.history.replaceState({}, '', '/signup/creator')
    }
  }, [])

  const connectInstagram = () => { draftSave(draftData()); window.location.href = '/api/auth/instagram' }

  const applyValid = firstName.trim() !== '' && lastName.trim() !== '' && email.trim() !== '' && password.length >= 8 && phone.trim() !== '' && ageOk && agreedTerms
  const platformsValid = igConnected && largestPlatform !== '' && followerCount !== ''
  const contentValid = niches.length > 0 && bio.trim() !== '' && language !== ''

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const primaryHandle = largestPlatform === 'Instagram' ? igHandle : largestPlatform === 'Pinterest' ? pinterestHandle : largestPlatform === 'YouTube' ? youtubeHandle : ''
      const profileFields = {
        role: 'creator', display_name: `${firstName} ${lastName}`.trim(), phone: `${countryCode}${phone}`,
        primary_platform: largestPlatform, primary_handle: primaryHandle, primary_followers: followerCount,
        // Secondary platform, engagement rate, referral code, and signup source were
        // collected by the previous version of this flow but dropped from this
        // redesign. All are nullable — can be reintroduced as extra optional fields
        // later if the business wants to keep gathering them.
        secondary_platform: null, secondary_handle: null, secondary_followers: null, engagement_rate: null,
        niches, content_language: language, bio,
        referral_code: null, source: null,
        instagram_handle: igHandle || null, instagram_verified: igConnected,
        // UPI/PAN payout collection now happens post-approval, from Dashboard > Settings.
        upi_id: null, pan_number: null,
        agreed_tos: agreedTerms, agreed_affiliate: agreedTerms,
      }
      const { data, error: authErr } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/signup/confirm`,
          data: profileFields,
        },
      })
      if (authErr) throw authErr
      if (!data.user) throw new Error('Signup failed — please try again.')

      if (!data.session) {
        // Supabase returns this same "no session yet" shape for two very
        // different cases: a genuine new signup awaiting confirmation, and
        // an email that already has an account (deliberately disguised as
        // a normal response to prevent email enumeration — no new email is
        // sent in that second case). data.user.identities is how the two
        // are told apart: empty means "already exists".
        if (data.user.identities?.length === 0) {
          throw new Error('This email is already registered. Try logging in instead, or use "Forgot password" if you don\'t remember your credentials.')
        }
        // Confirmation required for a genuinely new signup — there's no
        // session yet, so we can't write to profiles (RLS requires
        // auth.uid() = id). The collected fields already rode along as
        // auth user_metadata above; /signup/confirm creates the profile
        // row once they click the link.
        draftClear(); setAwaitingConfirm(true)
        return
      }

      const { error: profileErr } = await supabase.from('profiles').insert({
        id: data.user.id, status: 'pending', ...profileFields,
      })
      if (profileErr) throw profileErr
      draftClear(); setDone(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        msg.toLowerCase().includes('rate limit')
          ? 'Too many signup attempts right now — please wait a few minutes and try again.'
          : msg || 'Something went wrong. Please try again.'
      )
    } finally { setLoading(false) }
  }

  if (awaitingConfirm) return (
    <div style={{ minHeight:'100vh', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:SANS }}>
      <link href="https://fonts.googleapis.com/css2?family=Fanwood+Text:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={{ width:48, height:48, border:`1.5px solid ${INK}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:20 }}>✉</div>
      <p style={{ fontSize:10, letterSpacing:'0.18em', color:MUTED2, marginBottom:12, textTransform:'uppercase' }}>Check your email</p>
      <h1 style={{ fontFamily:SERIF, fontSize:36, fontWeight:300, color:INK, marginBottom:14, textAlign:'center', lineHeight:1.1 }}>Confirm your address to continue.</h1>
      <p style={{ fontSize:14, color:MUTED, maxWidth:360, textAlign:'center', lineHeight:1.7, marginBottom:8 }}>
        We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to activate your account — we&apos;ll then review your application within 3–5 days.
      </p>
      <p style={{ fontSize:12, color:MUTED2, maxWidth:360, textAlign:'center', lineHeight:1.6, marginBottom:36 }}>
        Don&apos;t see it? Check spam, or make sure {email} is correct.
      </p>
      <button onClick={() => router.push('/')} style={{ padding:'12px 36px', background:INK, color:'#fff', fontSize:12, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
        BACK TO CURATEKIN
      </button>
    </div>
  )

  if (done) return (
    <div style={{ minHeight:'100vh', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:SANS }}>
      <link href="https://fonts.googleapis.com/css2?family=Fanwood+Text:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={{ width:48, height:48, border:`1.5px solid ${INK}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:20 }}>✓</div>
      <p style={{ fontSize:10, letterSpacing:'0.18em', color:MUTED2, marginBottom:12, textTransform:'uppercase' }}>Application received</p>
      <h1 style={{ fontFamily:SERIF, fontSize:40, fontWeight:300, color:INK, marginBottom:14, textAlign:'center', lineHeight:1.1 }}>You&apos;re on your way.</h1>
      <p style={{ fontSize:14, color:MUTED, maxWidth:320, textAlign:'center', lineHeight:1.7, marginBottom:36 }}>We&apos;ll review your profile and get back to you within 3–5 days. Keep creating.</p>
      <button onClick={() => router.push('/')} style={{ padding:'12px 36px', background:INK, color:'#fff', fontSize:12, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
        BACK TO CURATEKIN
      </button>
    </div>
  )

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fanwood+Text:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={{ minHeight:'100vh', background:'#fff', fontFamily:SANS }}>

        <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', height:64, borderBottom:'0.5px solid #EBEBEB', position:'sticky', top:0, background:'#fff', zIndex:10 }}>
          <Link href="/" style={{ fontFamily:SERIF, fontSize:26, fontWeight:400, color:INK, textDecoration:'none' }}>
            Curate<em style={{ fontStyle:'italic', color:GOLD }}>Kin</em>
          </Link>
          <div style={{ display:'flex', gap:28, alignItems:'center' }}>
            <Link href="/signup" style={{ fontSize:14, color:INK, textDecoration:'none', fontWeight:400 }}>← Back</Link>
            <Link href="/login" style={{ fontSize:14, color:INK, textDecoration:'none', fontWeight:400 }}>
              Log In
            </Link>
            <Link href="/signup" style={{ fontSize:14, color:INK, textDecoration:'none', fontWeight:500, padding:'8px 20px', border:`1.5px solid ${INK}`, borderRadius:4 }}>
              Sign Up
            </Link>
          </div>
        </nav>

        <div style={{ maxWidth:560, margin:'0 auto', padding:'56px 24px 80px' }}>
          <Dots step={step} onDotClick={go} />

          {error && (
            <div style={{ padding:'12px 16px', background:'#FFF5F5', border:'1px solid #FED7D7', borderRadius:8, marginBottom:24 }}>
              <p style={{ fontSize:13, color:'#C53030' }}>{error}</p>
            </div>
          )}

          {step === 1 && (
            <div style={{ background:'#fff', padding:'40px 36px', borderRadius:12, border:`0.5px solid ${BORDER}` }}>
              <h1 style={{ fontFamily:SERIF, fontSize:40, fontWeight:400, color:INK, textAlign:'center', lineHeight:1.1, marginBottom:12 }}>
                Apply to be a Curate<em style={{ fontStyle:'italic', color:GOLD }}>Kin</em> Creator
              </h1>
              <p style={{ fontSize:14, color:MUTED, textAlign:'center', lineHeight:1.7, marginBottom:36 }}>Curate with your taste and build relationships with brands.</p>
              <div style={fs}>
                <input type="text" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} style={winp} />
                <input type="text" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} style={winp} />
                <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={winp} />
                <PasswordInput placeholder="Password (min 8 characters)" value={password} onChange={setPass} />
                <div style={{ display:'flex', gap:10 }}>
                  <select value={countryCode} onChange={e => setCountryCode(e.target.value)} style={{ ...wsel, width:90, flexShrink:0 }}>
                    {['+91','+1','+44','+971','+65'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} maxLength={10} style={{ ...winp, flex:1 }} />
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:12, margin:'4px 0' }}>
                  <div style={{ flex:1, height:1, background:BORDER }} />
                  <span style={{ fontSize:12, color:MUTED2, whiteSpace:'nowrap' }}>or</span>
                  <div style={{ flex:1, height:1, background:BORDER }} />
                </div>
                <button type="button" style={{ width:'100%', padding:'14px', borderRadius:8, border:`1px solid ${BORDER}`, background:'#fff', color:INK, fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                  <span style={{ width:20, height:20, borderRadius:'50%', border:`1px solid ${BORDER}`, color:INK, fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>G</span>
                  Sign up with Google
                </button>

                <WCheck checked={ageOk} onChange={() => setAgeOk(a => !a)}>I confirm I&apos;m 18 or older</WCheck>
                <WCheck checked={agreedTerms} onChange={() => setAgreedTerms(a => !a)}>
                  I agree to the <a href="/terms" target="_blank" style={{ color:INK, textDecoration:'underline' }}>Terms &amp; Conditions</a>, <a href="/privacy" target="_blank" style={{ color:INK, textDecoration:'underline' }}>Privacy Policy</a>, and <a href="/affiliate-policy" target="_blank" style={{ color:INK, textDecoration:'underline' }}>Affiliate &amp; Commission Policy</a>
                </WCheck>

                <div style={{ display:'flex', gap:12, marginTop:6 }}>
                  <button onClick={() => router.push('/')} style={{ flex:1, padding:'14px', border:`1px solid ${BORDER}`, background:'#fff', color:MUTED, fontSize:12, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
                    GO TO HOME
                  </button>
                  <button onClick={next} disabled={!applyValid}
                    style={{ flex:2, padding:'14px', background: applyValid ? INK : BORDER, color: applyValid ? '#fff' : MUTED, fontSize:12, letterSpacing:'0.1em', border:'none', cursor: applyValid ? 'pointer' : 'not-allowed', fontFamily:'inherit', borderRadius:8 }}>
                    NEXT
                  </button>
                </div>
                <p style={{ textAlign:'center', fontSize:12, marginTop:2 }}>
                  Are you a brand? <Link href="/signup" style={{ color:MUTED, textDecoration:'underline' }}>Apply here</Link>
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ background:'#fff', padding:'40px 36px', borderRadius:12, border:`0.5px solid ${BORDER}` }}>
              <h1 style={{ fontFamily:SERIF, fontSize:40, fontWeight:400, color:INK, textAlign:'center', lineHeight:1.1, marginBottom:12 }}>
                Socials
              </h1>
              <p style={{ fontSize:14, color:MUTED, textAlign:'center', lineHeight:1.7, marginBottom:36 }}>Your socials show us how you show up across platforms, so we can support your growth more strategically.</p>
              <div style={fs}>
                <div>
                  <label style={{ display:'block', fontSize:15, fontWeight:500, color:INK, marginBottom:10 }}>Instagram*</label>
                  {igConnected ? (
                    <div style={{ ...winp, display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>IG</span>
                      <span style={{ color:INK, fontSize:14, flex:1 }}>@{igHandle}</span>
                      <span style={{ color:GOLD, fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:4 }}>
                        ✓ Instagram verified
                      </span>
                    </div>
                  ) : (
                    <div>
                      <button type="button" onClick={connectInstagram}
                        style={{ width:'100%', padding:'14px', borderRadius:8, border:'none', background:'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)', color:'#fff', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>
                        Connect Instagram
                      </button>
                      <p style={{ fontSize:12, color:MUTED2, marginTop:8, lineHeight:1.6 }}>
                        Connect Instagram to continue — this is what actually proves the account is yours.
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display:'block', fontSize:15, fontWeight:500, color:INK, marginBottom:10 }}>Pinterest (optional)</label>
                  <input type="text" placeholder="@handle or profile link" value={pinterestHandle} onChange={e => setPinterestHandle(e.target.value)} style={winp} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:15, fontWeight:500, color:INK, marginBottom:10 }}>YouTube (optional)</label>
                  <input type="text" placeholder="@handle or profile link" value={youtubeHandle} onChange={e => setYoutubeHandle(e.target.value)} style={winp} />
                </div>

                <div>
                  <label style={{ display:'block', fontSize:15, fontWeight:500, color:INK, marginBottom:10 }}>Where is your largest following?*</label>
                  <select value={largestPlatform} onChange={e => setLargestPlatform(e.target.value)}
                    style={{ ...wsel, color: largestPlatform ? INK : MUTED2 }}>
                    <option value="">Select platform</option>
                    {['Instagram','Pinterest','YouTube'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:15, fontWeight:500, color:INK, marginBottom:10 }}>What is your following on that platform?*</label>
                  <select value={followerCount} onChange={e => setFollowerCount(e.target.value)}
                    style={{ ...wsel, color: followerCount ? INK : MUTED2 }}>
                    <option value="">Select range</option>
                    {FOLLOWERS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>

                <p style={{ fontSize:12, color:MUTED2, lineHeight:1.6 }}>
                  Please be honest, as we fact-check. Follower count is just one factor we consider — our review process takes a holistic approach, valuing authenticity, content quality, and engagement.
                </p>

                <div style={{ display:'flex', gap:12, marginTop:6 }}>
                  <button onClick={prev} style={{ flex:1, padding:'14px', border:`1px solid ${BORDER}`, background:'#fff', color:MUTED, fontSize:12, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
                    BACK
                  </button>
                  <button onClick={next} disabled={!platformsValid}
                    style={{ flex:2, padding:'14px', background: platformsValid ? INK : BORDER, color: platformsValid ? '#fff' : MUTED, fontSize:12, letterSpacing:'0.1em', border:'none', cursor: platformsValid ? 'pointer' : 'not-allowed', fontFamily:'inherit', borderRadius:8 }}>
                    NEXT
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ background:'#fff', padding:'40px 36px', borderRadius:12, border:`0.5px solid ${BORDER}` }}>
              <h1 style={{ fontFamily:SERIF, fontSize:40, fontWeight:400, color:INK, textAlign:'center', lineHeight:1.1, marginBottom:12 }}>
                Your content
              </h1>
              <p style={{ fontSize:14, color:MUTED, textAlign:'center', lineHeight:1.7, marginBottom:36 }}>Tell us what makes your taste unique.</p>
              <div style={fs}>
                <div>
                  <label style={{ display:'block', fontSize:15, fontWeight:500, color:INK, marginBottom:10 }}>Your niche (pick up to 3)*</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {NICHES.map(n => {
                      const selected = niches.includes(n)
                      const disabled = !selected && niches.length >= 3
                      return (
                        <button key={n} type="button" onClick={() => toggleNiche(n)} disabled={disabled}
                          style={{ padding:'8px 16px', borderRadius:99, border:`1px solid ${selected ? INK : BORDER}`, background: selected ? GOLD : '#fff', color: selected ? INK : disabled ? '#CCC' : MUTED, fontSize:13, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: disabled ? 0.6 : 1, transition:'all 0.15s' }}>
                          {n}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display:'block', fontSize:15, fontWeight:500, color:INK, marginBottom:10 }}>Describe your content style*</label>
                  <textarea placeholder="Your aesthetic, and what you already recommend or create content about…" value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ ...winp, resize:'none', lineHeight:1.6 }} />
                </div>

                <div>
                  <label style={{ display:'block', fontSize:15, fontWeight:500, color:INK, marginBottom:10 }}>Content language*</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    style={{ ...wsel, color: language ? INK : MUTED2 }}>
                    <option value="">Select language</option>
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>

                <div style={{ display:'flex', gap:12, marginTop:6 }}>
                  <button onClick={prev} style={{ flex:1, padding:'14px', border:`1px solid ${BORDER}`, background:'#fff', color:MUTED, fontSize:12, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
                    BACK
                  </button>
                  <button onClick={submit} disabled={!contentValid || loading}
                    style={{ flex:2, padding:'14px', background: (contentValid && !loading) ? INK : BORDER, color: (contentValid && !loading) ? '#fff' : MUTED, fontSize:12, letterSpacing:'0.1em', border:'none', cursor: (contentValid && !loading) ? 'pointer' : 'not-allowed', fontFamily:'inherit', borderRadius:8 }}>
                    {loading ? 'SUBMITTING...' : 'NEXT'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
