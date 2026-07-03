'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

// ── Data ─────────────────────────────────────────────────────────
type FoundingProduct = { id:string; title:string; brand:string; price:string; image_url:string }
type FoundingCurator  = { id:string; username:string; display_name:string; avatar_url:string; bio:string; city?:string }

const CREATOR_STEPS = [
  { n:'01', t:'Apply & get verified',   b:'Anyone with a trusted point of view — creator, doctor, stylist, icon. Apply once, get your curator badge and storefront URL.' },
  { n:'02', t:'Add products you love',  b:'Add any product from any brand instantly. Write why you trust it. Group into collections. No approval process.' },
  { n:'03', t:'Earn 80% on every sale', b:'When your followers shop through your storefront you earn 80% commission. Tracked automatically, paid monthly.' },
]

const SHOPPER_STEPS = [
  { n:'01', t:'Follow who you trust',       b:'Find the dermatologist you follow, the stylist you love, the chef you admire. All their picks in one place.' },
  { n:'02', t:'Discover with real context', b:'Every product has a curator note — why they use it, how long, what it does. No anonymous reviews.' },
  { n:'03', t:'Shop directly from brands',  b:'Click through to the brand website. No middlemen, no markups. Trusted picks, straight to checkout.' },
]

const MARQUEE_ITEMS = ['Skincare','Fashion','Wellness','Dermatologist Picks','Home & Living','Beauty','Nutrition','Fitness','Jewellery','Tech']

const CURATOR_FEATS = ['Your storefront at curatekin.com/you','Add any product from any brand instantly','Earn 80% commission on every sale','Direct brand collaboration opportunities']
const SHOPPER_FEATS = ['Follow curators whose taste you trust','Verified picks from doctors & experts','Shop directly from brand websites','Save picks and build your wishlist']

const FOOTER_PLATFORM = [['Browse curators','/curators'],['Categories','/categories'],['For brands','/brands'],['About','/about']]
const FOOTER_CURATORS = [['Apply to join','/signup'],['Dashboard','/dashboard'],['Earnings','/dashboard/earnings'],['Help','/help']]
const FOOTER_COMPANY  = [['Privacy','/privacy'],['Terms','/terms'],['Contact','mailto:hello@curatekin.com'],['Affiliate policy','/affiliate-policy']]

export default function Home() {
  // Founding curator spotlight — pulls one real creator + their real
  // products, rather than showing invented names and numbers.
  const [founder, setFounder] = useState<FoundingCurator | null>(null)
  const [founderProducts, setFounderProducts] = useState<FoundingProduct[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: creator } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, city')
        .eq('username', 'navya')
        .maybeSingle()

      if (!creator) return
      setFounder(creator)

      const { data: products } = await supabase
        .from('storefront_products')
        .select('id, title, brand, price, image_url')
        .eq('creator_id', creator.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(5)

      setFounderProducts(products ?? [])
    }
    load()
  }, [])

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fanwood+Text:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --cream: #F0EDE8;
          --cream2: #E8E4DE;
          --ink:   #141210;
          --ink2:  #3A3630;
          --muted: #8C867E;
          --dim:   #B4AEA8;
          --gold:  #B07D4A;
          --gold2: #C99A6A;
          --burg:  #8B1A1A;
          --br:    rgba(20,18,16,0.08);
          --br-w:  rgba(255,255,255,0.1);
          --serif: 'Fanwood Text', 'Cormorant Garamond', Georgia, serif;
          --sans:  'DM Sans', system-ui, sans-serif;
        }
        html  { scroll-behavior: smooth; }
        body  { background: var(--cream); color: var(--ink); font-family: var(--sans); -webkit-font-smoothing: antialiased; }

        /* ── Nav ── */
        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 60px; display: flex; align-items: center; justify-content: space-between;
          padding: 0 48px;
          background: rgba(240,237,232,0.92); backdrop-filter: blur(20px);
          border-bottom: 0.5px solid var(--br);
        }
        .logo     { font-family: var(--serif); font-size: 22px; font-weight: 300; color: var(--ink); text-decoration: none; }
        .logo em  { font-style: italic; color: var(--burg); }
        .nav-mid  { display: flex; gap: 36px; }
        .nav-mid a{ font-size: 13px; color: var(--muted); text-decoration: none; transition: color .15s; }
        .nav-mid a:hover { color: var(--ink); }
        .nav-right{ display: flex; gap: 8px; align-items: center; }
        .btn-ghost{ font-size: 13px; color: var(--muted); background: none; border: none; cursor: pointer; font-family: var(--sans); padding: 6px 14px; text-decoration: none; }
        .btn-ink  { font-size: 12px; font-weight: 500; font-family: var(--sans); background: var(--ink); color: var(--cream); border: none; padding: 9px 22px; cursor: pointer; text-decoration: none; letter-spacing: 0.06em; }
        .btn-ink:hover { opacity: 0.85; }

        /* ── Hero — full bleed dark ── */
        .hero {
          min-height: 100vh; padding-top: 60px;
          position: relative; display: flex; align-items: center;
          background: var(--ink);
          overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 70% 50%, rgba(176,125,74,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 40% 80% at 20% 30%, rgba(139,26,26,0.06) 0%, transparent 60%);
        }
        .hero-line {
          position: absolute; right: 0; top: 0; bottom: 0; width: 45%;
          border-left: 0.5px solid rgba(255,255,255,0.06);
        }
        .hero-content {
          position: relative; z-index: 2;
          padding: 80px 48px;
          max-width: 680px;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--gold); font-weight: 500; margin-bottom: 36px;
        }
        .hero-eyebrow-line { width: 24px; height: 0.5px; background: var(--gold); }
        h1 {
          font-family: var(--serif); font-size: clamp(52px, 6vw, 88px);
          font-weight: 300; line-height: 1.04; color: #fff;
          margin-bottom: 28px; letter-spacing: -0.01em;
        }
        h1 em { font-style: italic; color: var(--gold2); }
        .hero-sub {
          font-size: 15px; font-weight: 300; color: rgba(255,255,255,0.45);
          line-height: 1.8; max-width: 440px; margin-bottom: 48px;
        }
        .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 56px; }
        .btn-gold  { font-size: 12px; letter-spacing: 0.08em; font-family: var(--sans); font-weight: 500; background: var(--gold); color: #fff; border: none; padding: 12px 28px; cursor: pointer; text-decoration: none; }
        .btn-gold:hover { background: var(--gold2); }
        .btn-ghost-dark { font-size: 12px; letter-spacing: 0.08em; font-family: var(--sans); color: rgba(255,255,255,0.5); background: none; border: 0.5px solid rgba(255,255,255,0.2); padding: 12px 28px; text-decoration: none; }
        .btn-ghost-dark:hover { border-color: rgba(255,255,255,0.4); color: rgba(255,255,255,0.8); }

        /* Honest founding-curator credit line — replaces invented stats */
        .hero-credit { display: flex; align-items: center; gap: 14px; padding-top: 32px; border-top: 0.5px solid rgba(255,255,255,0.08); }
        .hero-credit-line  { width: 24px; height: 0.5px; background: var(--gold); flex-shrink: 0; }
        .hero-credit-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.32); }
        .hero-credit-name  { font-family: var(--serif); font-style: italic; font-size: 15px; color: var(--gold2); text-decoration: none; }
        .hero-credit-name:hover { color: #fff; }

        /* ── Marquee ── */
        .mq-wrap { border-top: 0.5px solid var(--br); border-bottom: 0.5px solid var(--br); padding: 14px 0; overflow: hidden; background: var(--cream); }
        .mq-track { display: inline-block; white-space: nowrap; animation: mq 32s linear infinite; }
        @keyframes mq { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .mq-item { display: inline-flex; align-items: center; gap: 12px; margin-right: 48px; font-family: var(--serif); font-style: italic; font-size: 16px; color: var(--muted); }
        .mq-sep { color: var(--gold); font-style: normal; font-size: 8px; }

        /* ── Section shell ── */
        .section { max-width: 1200px; margin: 0 auto; padding: 96px 48px; }
        .display-eyebrow { font-family: var(--serif); font-style: italic; font-size: 16px; color: var(--muted); margin-bottom: 4px; }
        .display-heading { font-family: var(--serif); font-size: clamp(48px,5vw,80px); font-weight: 300; color: var(--ink); line-height: 1; margin-bottom: 48px; }

        /* ── Founding curator spotlight — one real feature, not a grid ── */
        .spotlight-wrap {
          background: var(--cream2);
          border-top: 0.5px solid var(--br); border-bottom: 0.5px solid var(--br);
          animation: spotFade 0.7s ease;
        }
        @media (prefers-reduced-motion: reduce) { .spotlight-wrap { animation: none; } }
        @keyframes spotFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .spotlight-inner { max-width: 1200px; margin: 0 auto; padding: 96px 48px; }
        .spotlight-eyebrow {
          font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--gold); font-weight: 500; margin-bottom: 28px;
        }
        .spotlight-head { display: flex; gap: 48px; align-items: flex-start; margin-bottom: 56px; }
        .spotlight-portrait {
          width: 240px; height: 320px; flex-shrink: 0;
          border: 1px solid rgba(176,125,74,0.35);
          background: linear-gradient(160deg,#2A2420,#1A1410);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .spotlight-portrait img { width: 100%; height: 100%; object-fit: cover; }
        .spotlight-portrait span { font-family: var(--serif); font-style: italic; font-size: 56px; color: rgba(255,255,255,0.4); }
        .spotlight-kicker { font-family: var(--serif); font-style: italic; font-size: 16px; color: var(--muted); margin-bottom: 6px; }
        .spotlight-name   { font-family: var(--serif); font-weight: 300; font-size: clamp(40px,4.2vw,64px); color: var(--ink); line-height: 1.05; margin-bottom: 16px; }
        .spotlight-meta   { display: flex; gap: 14px; font-size: 12px; color: var(--muted); letter-spacing: 0.03em; margin-bottom: 18px; }
        .spotlight-meta span + span { padding-left: 14px; border-left: 0.5px solid var(--br); }
        .spotlight-bio    { font-size: 14px; color: var(--ink2); line-height: 1.8; font-weight: 300; max-width: 420px; margin-bottom: 24px; }
        .spotlight-cta    { font-size: 12px; letter-spacing: 0.06em; color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--gold); padding-bottom: 2px; }
        .spotlight-cta:hover { color: var(--gold); }

        .spotlight-rail-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 18px; }
        .spotlight-rail { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 4px; }
        .rail-item { flex-shrink: 0; width: 180px; text-decoration: none; color: inherit; }
        .rail-img { aspect-ratio: 3/4; background: #fff; border: 0.5px solid var(--br); display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 8px; transition: box-shadow 0.2s; }
        .rail-item:hover .rail-img { box-shadow: 0 8px 24px rgba(20,18,16,0.12); }
        .rail-img img { width: 100%; height: 100%; object-fit: contain; padding: 10px; }
        .rail-ph { font-family: var(--serif); font-style: italic; font-size: 32px; color: rgba(20,18,16,0.1); }
        .rail-brand { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 2px; }
        .rail-price { font-family: var(--serif); font-size: 15px; color: var(--ink); }

        /* ── Mid-page dark editorial break ── */
        .dark-break {
          position: relative; overflow: hidden;
          background: var(--ink); padding: 96px 48px;
          text-align: center;
        }
        .dark-break-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(176,125,74,0.07) 0%, transparent 70%);
        }
        .dark-break-content { position: relative; z-index: 2; max-width: 600px; margin: 0 auto; }
        .dark-break h2 {
          font-family: var(--serif); font-size: clamp(36px, 4vw, 60px);
          font-weight: 300; color: #fff; line-height: 1.1; margin-bottom: 12px;
        }
        .dark-break h2 em { font-style: italic; color: var(--gold2); }
        .dark-break p { font-size: 14px; color: rgba(255,255,255,0.35); margin-bottom: 36px; font-weight: 300; }
        .dark-break-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        /* ── How it works ── */
        .hiw-wrap { background: var(--cream2); border-top: 0.5px solid var(--br); border-bottom: 0.5px solid var(--br); }
        .hiw-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; padding-top: 48px; border-top: 0.5px solid var(--br); }
        .hiw-role { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); font-weight: 500; margin-bottom: 32px; }
        .step      { display: flex; gap: 20px; margin-bottom: 32px; }
        .step-n    { font-family: var(--serif); font-size: 11px; color: var(--gold); width: 18px; flex-shrink: 0; padding-top: 3px; }
        .step-t    { font-size: 14px; font-weight: 500; color: var(--ink); margin-bottom: 6px; }
        .step-b    { font-size: 13px; color: var(--muted); line-height: 1.7; font-weight: 300; }

        /* ── Join section — dark/light split ── */
        .join-wrap { border-top: 0.5px solid var(--br); }
        .join-grid { display: grid; grid-template-columns: 1fr 1fr; }
        .join-col  { padding: 88px 64px; display: flex; flex-direction: column; }
        .join-col.dark { background: var(--ink); }
        .join-h    { font-family: var(--serif); font-size: clamp(32px,3vw,48px); font-weight: 300; line-height: 1.1; color: var(--ink); margin-bottom: 16px; }
        .join-h em { font-style: italic; color: var(--gold); }
        .join-col.dark .join-h { color: #fff; }
        .join-col.dark .join-h em { color: var(--gold2); }
        .join-p    { font-size: 14px; color: var(--muted); line-height: 1.8; font-weight: 300; margin-bottom: 36px; max-width: 360px; }
        .join-col.dark .join-p { color: rgba(255,255,255,0.35); }
        .feats     { margin-bottom: 40px; }
        .feat      { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; font-size: 13px; color: var(--muted); font-weight: 300; line-height: 1.5; }
        .join-col.dark .feat { color: rgba(255,255,255,0.35); }
        .feat-dot  { width: 3px; height: 3px; border-radius: 50%; background: var(--gold); margin-top: 7px; flex-shrink: 0; }
        .join-col.dark .feat-dot { background: var(--gold2); }

        /* ── Footer ── */
        footer { background: var(--ink); color: #fff; padding: 64px 48px 40px; }
        .ft     { display: grid; grid-template-columns: 1.8fr 1fr 1fr 1fr; gap: 48px; padding-bottom: 48px; border-bottom: 0.5px solid rgba(255,255,255,0.06); margin-bottom: 28px; }
        .ft-logo{ font-family: var(--serif); font-size: 22px; font-weight: 300; color: #fff; margin-bottom: 10px; }
        .ft-logo em { font-style: italic; color: var(--gold2); }
        .ft-tag { font-size: 13px; color: rgba(255,255,255,0.25); font-weight: 300; line-height: 1.65; max-width: 180px; }
        .ft-h   { font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: rgba(255,255,255,0.2); margin-bottom: 16px; font-weight: 500; }
        .ft-lks { display: flex; flex-direction: column; gap: 10px; }
        .ft-lks a { font-size: 13px; color: rgba(255,255,255,0.35); text-decoration: none; font-weight: 300; transition: color .15s; }
        .ft-lks a:hover { color: rgba(255,255,255,0.7); }
        .ft-btm { display: flex; align-items: center; justify-content: space-between; }
        .ft-copy{ font-size: 11px; color: rgba(255,255,255,0.15); }
        .ft-bl  { display: flex; gap: 20px; }
        .ft-bl a{ font-size: 11px; color: rgba(255,255,255,0.15); text-decoration: none; }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          nav { padding: 0 24px; }
          .nav-mid { display: none; }
          .hero-content { padding: 80px 24px; }
          .section { padding: 72px 24px; }
          .spotlight-inner { padding: 72px 24px; }
          .spotlight-head { flex-direction: column; gap: 28px; }
          .spotlight-portrait { width: 160px; height: 210px; }
          .hiw-cols { grid-template-columns: 1fr; gap: 48px; }
          .join-grid { grid-template-columns: 1fr; }
          .join-col { padding: 64px 32px; }
          .dark-break { padding: 72px 24px; }
          .ft { grid-template-columns: 1fr 1fr; gap: 32px; }
        }

        @media (max-width: 640px) {
          .hero-content { padding: 72px 20px; }
          h1 { font-size: 44px; }
          .display-heading { font-size: 40px; }
          .section { padding: 60px 20px; }
          .spotlight-inner { padding: 60px 20px; }
          .rail-item { width: 140px; }
          .ft { grid-template-columns: 1fr; }
          .join-col { padding: 52px 20px; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav>
        <a href="/" className="logo">Curate<em>Kin</em></a>
        <div className="nav-mid">
          <a href="/creators">Curators</a>
          <a href="#how">How it works</a>
          <a href="/brands">For brands</a>
        </div>
        <div className="nav-right">
          <a href="/login" className="btn-ghost">Sign in</a>
          <Link href="/signup" className="btn-ink">Get started</Link>
        </div>
      </nav>

      {/* ── Hero — full bleed dark ── */}
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-line" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-line" />
            Trusted curation · Real people
          </div>
          <h1>Curated by<br/>people, not<br/><em>algorithms.</em></h1>
          <p className="hero-sub">
            The creators, doctors, and stylists you follow — sharing the products they genuinely use.
            Discover everything in one place, and shop with real context.
          </p>
          <div className="hero-btns">
            <Link href="/signup" className="btn-gold">Start your storefront</Link>
            <a href="/creators" className="btn-ghost-dark">Browse curators</a>
          </div>
          <div className="hero-credit">
            <div className="hero-credit-line" />
            <span className="hero-credit-label">Founding Curator</span>
            <a href="/navya" className="hero-credit-name">Navya — Delhi</a>
          </div>
        </div>
      </div>

      {/* ── Marquee ── */}
      <div className="mq-wrap" aria-hidden="true">
        <div className="mq-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="mq-item">
              {item} <span className="mq-sep">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Founding curator spotlight — real data, one real feature ── */}
      {founder && (
        <div id="curators" className="spotlight-wrap">
          <div className="spotlight-inner">
            <div className="spotlight-eyebrow">Founding Curator</div>
            <div className="spotlight-head">
              <div className="spotlight-portrait">
                {founder.avatar_url
                  ? <img src={founder.avatar_url} alt={founder.display_name} />
                  : <span>{founder.display_name?.[0]?.toUpperCase()}</span>}
              </div>
              <div>
                <div className="spotlight-kicker">Curated by</div>
                <h2 className="spotlight-name">{founder.display_name}</h2>
                <div className="spotlight-meta">
                  {founder.city && <span>{founder.city}</span>}
                  {founderProducts.length > 0 && <span>{founderProducts.length} pieces curated</span>}
                </div>
                {founder.bio && <p className="spotlight-bio">{founder.bio}</p>}
                <Link href={`/${founder.username}`} className="spotlight-cta">Visit the storefront →</Link>
              </div>
            </div>

            {founderProducts.length > 0 && (
              <>
                <div className="spotlight-rail-label">The current edit</div>
                <div className="spotlight-rail">
                  {founderProducts.map(p => (
                    <a key={p.id} href={`/r/${p.id}`} target="_blank" rel="noopener noreferrer" className="rail-item">
                      <div className="rail-img">
                        {p.image_url
                          ? <img src={p.image_url} alt={p.title} />
                          : <div className="rail-ph">{p.title?.[0]}</div>}
                      </div>
                      <div className="rail-brand">{p.brand}</div>
                      <div className="rail-price">{p.price}</div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Mid-page dark editorial break ── */}
      <div className="dark-break">
        <div className="dark-break-bg" />
        <div className="dark-break-content">
          <h2>Your taste is<br/>worth <em>sharing.</em></h2>
          <p>Join India's first creator-led affiliate platform. Build your storefront in minutes.</p>
          <div className="dark-break-btns">
            <Link href="/signup" className="btn-gold">Apply as a creator</Link>
            <Link href="/signup" className="btn-ghost-dark">Join as a shopper</Link>
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="hiw-wrap" id="how">
        <div className="section">
          <div className="display-eyebrow">Simple by design</div>
          <div className="display-heading">How it works</div>
          <div className="hiw-cols">
            {([['For curators & creators', CREATOR_STEPS], ['For shoppers & buyers', SHOPPER_STEPS]] as const).map(([role, steps]) => (
              <div key={role}>
                <div className="hiw-role">{role}</div>
                {steps.map(s => (
                  <div className="step" key={s.n}>
                    <div className="step-n">{s.n}</div>
                    <div>
                      <div className="step-t">{s.t}</div>
                      <div className="step-b">{s.b}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Join — dark / light split ── */}
      <div className="join-wrap">
        <div className="join-grid">
          <div className="join-col">
            <div className="display-eyebrow" style={{color:'var(--muted)'}}>For curators</div>
            <div className="join-h">Your taste<br/>is your <em>brand</em></div>
            <p className="join-p">Turn products you already love into a storefront that earns. No follower minimum. No brand approvals.</p>
            <div className="feats">
              {CURATOR_FEATS.map(f => (
                <div key={f} className="feat"><div className="feat-dot" />{f}</div>
              ))}
            </div>
            <Link href="/signup" className="btn-ink" style={{alignSelf:'flex-start',letterSpacing:'0.06em',padding:'11px 28px'}}>
              Apply as a curator
            </Link>
          </div>
          <div className="join-col dark">
            <div className="display-eyebrow" style={{color:'rgba(255,255,255,0.3)'}}>For shoppers</div>
            <div className="join-h">Discover with<br/><em>real context</em></div>
            <p className="join-p">Shop what the people you trust actually use. Every product comes with a personal note — not a sponsored caption.</p>
            <div className="feats">
              {SHOPPER_FEATS.map(f => (
                <div key={f} className="feat"><div className="feat-dot" />{f}</div>
              ))}
            </div>
            <Link href="/signup" className="btn-gold" style={{alignSelf:'flex-start'}}>
              Join as a shopper
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer>
        <div className="ft">
          <div>
            <div className="ft-logo">Curate<em>Kin</em></div>
            <div className="ft-tag">Where India's tastemakers meet the products they love.</div>
          </div>
          {([['Platform', FOOTER_PLATFORM], ['Curators', FOOTER_CURATORS], ['Company', FOOTER_COMPANY]] as const).map(([heading, links]) => (
            <div key={heading}>
              <div className="ft-h">{heading}</div>
              <div className="ft-lks">
                {(links as string[][]).map(([label, href]) => (
                  <a key={label} href={href}>{label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="ft-btm">
          <div className="ft-copy">© 2026 CurateKin. All rights reserved.</div>
          <div className="ft-bl">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="mailto:hello@curatekin.com">Contact</a>
          </div>
        </div>
      </footer>
    </>
  )
}