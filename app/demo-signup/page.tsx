'use client'

import { useState } from 'react'

// ── Demo-only preview of a redesigned creator signup flow ──────────
// Pure front-end click-through, no Supabase calls, no real form
// submission. Does not touch or replace app/signup/creator/page.tsx.
// Delete this route once a design decision is made.

const INK    = '#0A0A0A'
const CREAM  = '#F0EDE8'
const GOLD   = '#B07D4A'
const MUTED  = '#6B6B6B'
const MUTED2 = '#9B9B9B'
const BORDER = '#E5E5E5'
const SERIF  = "'Fanwood Text', 'Cormorant Garamond', Georgia, serif"
const SANS   = "'DM Sans', sans-serif"

const CATEGORIES = ['Beauty','Skincare','Fashion','Home Decor','Wellness','Jewellery','Food & Lifestyle','Travel','Fitness']
const NICHES = ['Beauty','Skincare','Fashion','Home Decor','Wellness','Jewellery','Food & Lifestyle','Travel','Fitness']
const LANGUAGES = ['English','Hindi','Both English & Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Other']
const STEPS = ['Apply', 'Platforms', 'Content']
const APPLICATION_STAGES = ['apply', 'platforms', 'content']
const TABS = ['My Shop', 'Links', 'Earnings', 'Chat']

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

const SL = ({ t }: { t: string }) => <p style={{ fontSize:11, letterSpacing:'0.1em', color:MUTED2, textTransform:'uppercase', marginBottom:8 }}>{t}</p>

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight:'100vh', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:SANS }}>
      {children}
    </div>
  )
}

type Stage = 'apply' | 'platforms' | 'content' | 'checkEmail' | 'storefront' | 'done'

export default function DemoSignupPage() {
  const [stage, setStage] = useState<Stage>('apply')

  // Step 1 — Apply
  const [firstName, setFirstName]     = useState('')
  const [lastName, setLastName]       = useState('')
  const [email, setEmail]             = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [phone, setPhone]             = useState('')
  const [password, setPassword]       = useState('')
  const [instagram, setInstagram]     = useState('')
  const [why, setWhy]                 = useState('')
  const [ageOk, setAgeOk]             = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)

  // Platforms
  const [igHandle, setIgHandle]               = useState('')
  const [igConnected, setIgConnected]         = useState(false)
  const [pinterestHandle, setPinterestHandle] = useState('')
  const [youtubeHandle, setYoutubeHandle]     = useState('')
  const [largestPlatform, setLargestPlatform] = useState('')
  const [followerCount, setFollowerCount]     = useState('')

  // Content
  const [niches, setNiches]                 = useState<string[]>([])
  const [nicheDescription, setNicheDescription] = useState('')
  const [contentLanguage, setContentLanguage] = useState('')
  const [brandsWorked, setBrandsWorked]     = useState('')

  const toggleNiche = (n: string) => {
    setNiches(prev => {
      if (prev.includes(n)) return prev.filter(x => x !== n)
      if (prev.length >= 3) return prev
      return [...prev, n]
    })
  }

  // Step 2 — Storefront
  const [username, setUsername]     = useState('')
  const [bio, setBio]               = useState('')
  const [categories, setCategories] = useState<string[]>([])

  const toggleCategory = (c: string) => {
    setCategories(prev => {
      if (prev.includes(c)) return prev.filter(x => x !== c)
      if (prev.length >= 3) return prev
      return [...prev, c]
    })
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fanwood+Text:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {stage === 'checkEmail' && (
        <Shell>
          <div style={{ width:48, height:48, border:`1.5px solid ${INK}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:20 }}>✉</div>
          <p style={{ fontSize:10, letterSpacing:'0.18em', color:MUTED2, marginBottom:12, textTransform:'uppercase' }}>Application received</p>
          <h1 style={{ fontFamily:SERIF, fontSize:36, fontWeight:300, color:INK, marginBottom:14, textAlign:'center', lineHeight:1.1 }}>Check your email</h1>
          <p style={{ fontSize:14, color:MUTED, maxWidth:360, textAlign:'center', lineHeight:1.7, marginBottom:36 }}>
            We&apos;ve sent a confirmation link to <strong>{email || 'your inbox'}</strong>. Click it to activate your account — we&apos;ll then review your application within 3–5 days.
          </p>
          <button onClick={() => setStage('storefront')} style={{ padding:'12px 28px', background:'none', border:`1px dashed ${BORDER}`, color:MUTED2, fontSize:12, letterSpacing:'0.06em', cursor:'pointer', fontFamily:'inherit', borderRadius:4 }}>
            Simulate approval (demo only) →
          </button>
        </Shell>
      )}

      {stage === 'done' && (
        <Shell>
          <div style={{ width:48, height:48, border:`1.5px solid ${INK}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:20 }}>✓</div>
          <h1 style={{ fontFamily:SERIF, fontSize:40, fontWeight:300, color:INK, marginBottom:14, textAlign:'center', lineHeight:1.1 }}>You&apos;re in.</h1>
          <p style={{ fontSize:14, color:MUTED, maxWidth:340, textAlign:'center', lineHeight:1.7, marginBottom:36 }}>
            Your storefront is live. Start adding products whenever you&apos;re ready.
          </p>
          <div style={{ display:'flex', gap:28, marginBottom:24 }}>
            {TABS.map(t => (
              <span key={t} style={{ fontSize:13, fontWeight: t === 'Earnings' ? 600 : 400, color: t === 'Earnings' ? GOLD : MUTED2, borderBottom: t === 'Earnings' ? `2px solid ${GOLD}` : '2px solid transparent', paddingBottom:8 }}>
                {t}
              </span>
            ))}
          </div>
          <p style={{ fontSize:12, color:MUTED2, maxWidth:320, textAlign:'center', lineHeight:1.6 }}>
            UPI and PAN now live in the Earnings tab — fill them in whenever you&apos;re ready to get paid, not at signup.
          </p>
        </Shell>
      )}

      {(stage === 'apply' || stage === 'platforms' || stage === 'content' || stage === 'storefront') && (
        <div style={{ minHeight:'100vh', background: CREAM, fontFamily:SANS }}>
          <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', height:64, borderBottom:'0.5px solid rgba(20,18,16,0.08)', position:'sticky', top:0, background:'#fff', zIndex:10 }}>
            <span style={{ fontFamily:SERIF, fontSize:26, fontWeight:400, color:INK }}>
              Curate<em style={{ fontStyle:'italic', color:GOLD }}>Kin</em>
            </span>
            <span style={{ fontSize:11, letterSpacing:'0.14em', color:MUTED2, textTransform:'uppercase' }}>Design preview — not live</span>
          </nav>

          <div style={{ maxWidth:560, margin:'0 auto', padding:'56px 24px 80px' }}>
            {APPLICATION_STAGES.includes(stage) ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:48 }}>
                {STEPS.map((label, i) => {
                  const n = i + 1
                  const stageIndex = { apply:1, platforms:2, content:3 }[stage as 'apply'|'platforms'|'content'] ?? 1
                  const isCurrent = n === stageIndex
                  const isDone = n < stageIndex
                  return (
                    <div key={n} style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <div title={label} style={{ width:30, height:30, borderRadius:'50%', border:`1.5px solid ${isDone || isCurrent ? INK : '#CCC'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, background: isDone ? INK : '#fff', color: isDone ? '#fff' : isCurrent ? INK : '#CCC', fontFamily:SANS }}>
                        {isDone ? '✓' : n}
                      </div>
                      {i < STEPS.length - 1 && <div style={{ width:28, height:1.5, background: isDone ? INK : '#CCC' }} />}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginBottom:48 }}>
                <span style={{ fontSize:11, letterSpacing:'0.12em', color:GOLD, textTransform:'uppercase', border:`1px solid ${GOLD}`, borderRadius:99, padding:'8px 18px', fontFamily:SANS }}>
                  ✓ Application approved
                </span>
              </div>
            )}

            {stage === 'apply' && (
              <div style={{ background:'#fff', padding:'40px 36px', borderRadius:12, border:`0.5px solid ${BORDER}` }}>
                <h1 style={{ fontFamily:SERIF, fontSize:40, fontWeight:400, color:INK, textAlign:'center', lineHeight:1.1, marginBottom:12 }}>
                  Apply to be a Curate<em style={{ fontStyle:'italic', color:GOLD }}>Kin</em> Creator
                </h1>
                <p style={{ fontSize:14, color:MUTED, textAlign:'center', lineHeight:1.7, marginBottom:36 }}>Curate with your taste and build relationships with brands.</p>
                <div style={fs}>
                  <input type="text" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} style={winp} />
                  <input type="text" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} style={winp} />
                  <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={winp} />
                  <div style={{ display:'flex', gap:10 }}>
                    <select value={countryCode} onChange={e => setCountryCode(e.target.value)} style={{ ...wsel, width:90, flexShrink:0 }}>
                      {['+91','+1','+44','+971','+65'].map(c => <option key={c}>{c}</option>)}
                    </select>
                    <input type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} style={{ ...winp, flex:1 }} />
                  </div>

                  <div style={{ display:'flex', gap:12, marginTop:6 }}>
                    <button onClick={() => { window.location.href = '/' }} style={{ flex:1, padding:'14px', border:`1px solid ${BORDER}`, background:'#fff', color:MUTED, fontSize:12, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
                      GO TO HOME
                    </button>
                    <button onClick={() => setStage('platforms')} style={{ flex:2, padding:'14px', background:INK, color:'#fff', fontSize:12, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
                      NEXT
                    </button>
                  </div>
                  <p style={{ textAlign:'center', fontSize:12, marginTop:2 }}>
                    <a href="#" onClick={e => e.preventDefault()} style={{ color:MUTED, textDecoration:'underline' }}>I am a Brand</a>
                  </p>

                  <PasswordInput placeholder="Password (min 8 characters)" value={password} onChange={setPassword} />
                  <input type="text" placeholder="Instagram handle or profile link" value={instagram} onChange={e => setInstagram(e.target.value)} style={winp} />
                  <div>
                    <SL t="Why CurateKin, in your own words" />
                    <textarea placeholder="Two or three sentences on why you want to join…" value={why} onChange={e => setWhy(e.target.value)} rows={3} style={{ ...winp, resize:'none', lineHeight:1.6 }} />
                  </div>
                  <WCheck checked={ageOk} onChange={() => setAgeOk(a => !a)}>I confirm I&apos;m 18 or older</WCheck>
                  <WCheck checked={agreedTerms} onChange={() => setAgreedTerms(a => !a)}>I agree to the Terms and Privacy Policy</WCheck>
                  <button onClick={() => setStage('platforms')} style={{ width:'100%', padding:'14px', background:INK, color:'#fff', fontSize:12, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit', borderRadius:8, marginTop:6 }}>
                    SUBMIT APPLICATION
                  </button>
                </div>
              </div>
            )}

            {stage === 'platforms' && (
              <div style={{ background:'#fff', padding:'40px 36px', borderRadius:12, border:`0.5px solid ${BORDER}` }}>
                <h1 style={{ fontFamily:SERIF, fontSize:40, fontWeight:400, color:INK, textAlign:'center', lineHeight:1.1, marginBottom:12 }}>
                  Socials
                </h1>
                <p style={{ fontSize:14, color:MUTED, textAlign:'center', lineHeight:1.7, marginBottom:36 }}>Your socials show us how you show up across platforms, so we can support your growth more strategically.</p>
                <div style={fs}>
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
                      <button type="button" onClick={() => { setIgConnected(true); setIgHandle('yourhandle') }}
                        style={{ width:'100%', padding:'14px', borderRadius:8, border:'none', background:'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)', color:'#fff', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>
                        Connect Instagram
                      </button>
                      <p style={{ fontSize:12, color:MUTED2, marginTop:8, lineHeight:1.6 }}>
                        Connect Instagram to continue — this is what actually proves the account is yours.
                      </p>
                    </div>
                  )}
                  <div style={{ display:'flex', gap:10 }}>
                    <span style={{ ...winp, width:140, flexShrink:0, display:'flex', alignItems:'center', color:MUTED, background:CREAM }}>pinterest.com/</span>
                    <input type="text" placeholder="handle (optional)" value={pinterestHandle} onChange={e => setPinterestHandle(e.target.value)} style={{ ...winp, flex:1 }} />
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <span style={{ ...winp, width:140, flexShrink:0, display:'flex', alignItems:'center', color:MUTED, background:CREAM }}>youtube.com/@</span>
                    <input type="text" placeholder="handle (optional)" value={youtubeHandle} onChange={e => setYoutubeHandle(e.target.value)} style={{ ...winp, flex:1 }} />
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
                      {['Under 1,000','1,000–10,000','10,000–50,000','50,000–2,00,000','2,00,000+'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Flagging this note as easy to cut if it's not wanted */}
                  <p style={{ fontSize:12, color:MUTED2, lineHeight:1.6 }}>
                    Please be honest, as we fact-check. Follower count is just one factor we consider — our review process takes a holistic approach, valuing authenticity, content quality, and engagement.
                  </p>

                  <div style={{ display:'flex', gap:12, marginTop:6 }}>
                    <button onClick={() => setStage('apply')} style={{ flex:1, padding:'14px', border:`1px solid ${BORDER}`, background:'#fff', color:MUTED, fontSize:12, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
                      BACK
                    </button>
                    <button onClick={() => setStage('content')} disabled={!igConnected}
                      style={{ flex:2, padding:'14px', background: igConnected ? INK : '#CCC', color:'#fff', fontSize:12, letterSpacing:'0.1em', border:'none', cursor: igConnected ? 'pointer' : 'not-allowed', fontFamily:'inherit', borderRadius:8, opacity: igConnected ? 1 : 0.6 }}>
                      NEXT
                    </button>
                  </div>
                </div>
              </div>
            )}

            {stage === 'content' && (
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
                    <textarea placeholder="Your aesthetic, and what you already recommend or create content about…" value={nicheDescription} onChange={e => setNicheDescription(e.target.value)} rows={3} style={{ ...winp, resize:'none', lineHeight:1.6 }} />
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:15, fontWeight:500, color:INK, marginBottom:10 }}>Content language*</label>
                    <select value={contentLanguage} onChange={e => setContentLanguage(e.target.value)}
                      style={{ ...wsel, color: contentLanguage ? INK : MUTED2 }}>
                      <option value="">Select language</option>
                      {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:15, fontWeight:500, color:INK, marginBottom:10 }}>Brands you&apos;ve worked with (optional)</label>
                    <input type="text" placeholder="e.g. Nykaa, Sugar Cosmetics" value={brandsWorked} onChange={e => setBrandsWorked(e.target.value)} style={winp} />
                  </div>

                  <div style={{ display:'flex', gap:12, marginTop:6 }}>
                    <button onClick={() => setStage('platforms')} style={{ flex:1, padding:'14px', border:`1px solid ${BORDER}`, background:'#fff', color:MUTED, fontSize:12, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
                      BACK
                    </button>
                    <button onClick={() => setStage('checkEmail')} style={{ flex:2, padding:'14px', background:INK, color:'#fff', fontSize:12, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit', borderRadius:8 }}>
                      NEXT
                    </button>
                  </div>
                </div>
              </div>
            )}

            {stage === 'storefront' && (
              <div style={{ background:'#fff', padding:'40px 36px', borderRadius:12, border:`0.5px solid ${BORDER}` }}>
                <h1 style={{ fontFamily:SERIF, fontSize:36, fontWeight:400, color:INK, textAlign:'center', lineHeight:1.1, marginBottom:8 }}>Set up your storefront</h1>
                <p style={{ fontSize:14, color:MUTED, textAlign:'center', marginBottom:32 }}>This is what shoppers will see.</p>

                <div style={{ width:96, height:96, borderRadius:'50%', border:'1.5px dashed #C8C4BC', background:CREAM, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', margin:'0 auto 32px' }}>
                  <span style={{ fontSize:22, color:'#C8C4BC' }}>+</span>
                  <span style={{ fontSize:10, color:'#C8C4BC', marginTop:2 }}>Add photo</span>
                </div>

                <div style={fs}>
                  <div>
                    <SL t="Username" />
                    <input type="text" placeholder="yourname" value={username} onChange={e => setUsername(e.target.value)} style={winp} />
                    <p style={{ fontSize:12, color: username ? GOLD : MUTED2, marginTop:6 }}>curatekin.com/{username || 'yourname'}</p>
                  </div>
                  <div>
                    <SL t="Bio" />
                    <textarea placeholder="A line or two about your taste…" value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ ...winp, resize:'none', lineHeight:1.6 }} />
                  </div>
                  <div>
                    <SL t={`Categories — up to 3 (${categories.length}/3 selected)`} />
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
                      {CATEGORIES.map(c => {
                        const selected = categories.includes(c)
                        const disabled = !selected && categories.length >= 3
                        return (
                          <button key={c} type="button" onClick={() => toggleCategory(c)} disabled={disabled}
                            style={{ padding:'8px 16px', borderRadius:99, border:`1px solid ${selected ? INK : BORDER}`, background: selected ? INK : '#fff', color: selected ? '#fff' : disabled ? '#CCC' : MUTED, fontSize:13, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: disabled ? 0.6 : 1, transition:'all 0.15s' }}>
                            {c}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <button onClick={() => setStage('done')} style={{ width:'100%', padding:'14px', background:INK, color:'#fff', fontSize:12, letterSpacing:'0.1em', border:'none', cursor:'pointer', fontFamily:'inherit', borderRadius:8, marginTop:6 }}>
                    ENTER YOUR DASHBOARD
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
