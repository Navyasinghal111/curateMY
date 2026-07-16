'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { logEvent } from '@/lib/logEvent'

// ── Data ─────────────────────────────────────────────────────────
type FoundingProduct = { id:string; title:string; brand:string; price:string; image_url:string }
type FoundingCurator  = { id:string; username:string; display_name:string; avatar_url:string; bio:string; city?:string }

const SHOPPER_STEPS = [
  { n:'01', t:'Find curators you trust',                    b:'Search for the creators, doctors, and stylists whose taste you already follow.' },
  { n:'02', t:'Browse their real recommendations',           b:'See what they actually use, in their own words — not a sponsored feed.' },
  { n:'03', t:'Click through to shop from the original source', b:'Every product links straight to where it’s sold. No CurateKin checkout, no markup.' },
]

const CREATOR_STEPS = [
  { n:'01', t:'Apply to join',                                        b:'Tell us about your platforms and the kind of taste you bring.' },
  { n:'02', t:'Build your curated storefront',                        b:'Add products you already recommend, organized the way you’d want to browse them.' },
  { n:'03', t:'Share products you genuinely use',                     b:'Write why you trust each pick — that context is the whole point.' },
  { n:'04', t:'Earn commission on eligible purchases when tracking is active', b:'Commission tracking rolls out as affiliate partnerships come online for your storefront.' },
]

const WHY_POINTS = [
  { t:'Human taste over algorithmic feeds',       b:'Every pick comes from a real person’s judgment, not a recommendation engine.' },
  { t:'Quality over quantity',                    b:'A smaller, curated collection beats an endless scroll.' },
  { t:'Real context, not anonymous reviews',      b:'Each product carries a name and a reason — never a star rating from a stranger.' },
  { t:'Premium storefronts for trusted creators', b:'A storefront that looks and feels as considered as the taste behind it.' },
]

export default function Home() {
  // Founding curator spotlight — pulls one real creator + their real
  // products, rather than showing invented names and numbers.
  const [founder, setFounder] = useState<FoundingCurator | null>(null)
  const [founderProducts, setFounderProducts] = useState<FoundingProduct[]>([])
  const [founderLoaded, setFounderLoaded] = useState(false)

  useEffect(() => {
    logEvent(createClient(), 'homepage_visit')
  }, [])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: creator } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, city')
        .eq('username', 'navya')
        .eq('status', 'approved')
        .maybeSingle()

      if (!creator) { setFounderLoaded(true); return }
      setFounder(creator)

      const { data: products } = await supabase
        .from('storefront_products')
        .select('id, title, brand, price, image_url')
        .eq('creator_id', creator.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(5)

      setFounderProducts(products ?? [])
      setFounderLoaded(true)
    }
    load()
  }, [])

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fanwood+Text:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --cream:  #F0EDE8;
          --cream2: #E8E4DE;
          --ink:    #141210;
          --ink2:   #3A3630;
          --muted:  #8C867E;
          --gold:   #B07D4A;
          --gold2:  #C99A6A;
          --br:     rgba(20,18,16,0.08);
          --serif:  'Fanwood Text', 'Cormorant Garamond', Georgia, serif;
          --sans:   'DM Sans', system-ui, sans-serif;
        }
        html  { scroll-behavior: smooth; }
        body  { background: var(--cream); color: var(--ink); font-family: var(--sans); -webkit-font-smoothing: antialiased; }

        /* ── Nav ── */
        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
          padding: 0 48px;
          background: rgba(240,237,232,0.92); backdrop-filter: blur(20px);
          border-bottom: 0.5px solid var(--br);
        }
        .logo     { font-family: var(--serif); font-size: 22px; font-weight: 400; color: var(--ink); text-decoration: none; }
        .logo em  { font-style: italic; color: var(--gold); }
        .nav-mid  { display: flex; gap: 36px; }
        .nav-mid a{ font-size: 13px; color: var(--muted); text-decoration: none; transition: color .15s; }
        .nav-mid a:hover { color: var(--ink); }
        .nav-right{ display: flex; gap: 8px; align-items: center; }
        .btn-ghost{ font-size: 13px; color: var(--muted); background: none; border: none; cursor: pointer; font-family: var(--sans); padding: 6px 14px; text-decoration: none; }
        .btn-ghost:hover { color: var(--ink); }
        .btn-ink  { font-size: 12px; font-weight: 500; font-family: var(--sans); background: var(--ink); color: var(--cream); border: none; padding: 10px 22px; cursor: pointer; text-decoration: none; letter-spacing: 0.06em; }
        .btn-ink:hover { opacity: 0.85; }
        .btn-gold { font-size: 12px; letter-spacing: 0.06em; font-family: var(--sans); font-weight: 500; background: var(--gold); color: #fff; border: none; padding: 12px 28px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn-gold:hover { background: var(--gold2); }
        .btn-outline { font-size: 12px; letter-spacing: 0.06em; font-family: var(--sans); font-weight: 500; color: var(--ink); background: none; border: 1px solid var(--ink); padding: 11px 27px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn-outline:hover { background: var(--ink); color: var(--cream); }

        /* ── Hero — editorial, cream, no dark gradient ── */
        .hero {
          padding: 148px 48px 96px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
          max-width: 1280px; margin: 0 auto;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--gold); font-weight: 500; margin-bottom: 32px;
        }
        .hero-eyebrow-line { width: 24px; height: 0.5px; background: var(--gold); }
          h1 {
            font-family: 'Cormorant Garamond', var(--serif); font-size: clamp(50px, 6vw, 82px);
            font-weight: 300; line-height: 0.96; color: var(--ink);
            margin-bottom: 28px; letter-spacing: 0;
          }
          h1 em { display: inline-block; margin-top: 12px; font-style: italic; color: var(--gold); }
        .hero-sub {
          font-size: 15px; font-weight: 300; color: var(--ink2);
          line-height: 1.8; max-width: 440px; margin-bottom: 40px;
        }
        .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }
        .hero-visual {
          position: relative; aspect-ratio: 4/5; border: 1px solid var(--br);
          background: var(--cream2); overflow: hidden;
        }

        /* ── Section shell ── */
        .section { max-width: 1200px; margin: 0 auto; padding: 96px 48px; }
        .display-eyebrow { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold); font-weight: 500; margin-bottom: 20px; }
        .display-heading { font-family: var(--serif); font-size: clamp(36px,4vw,56px); font-weight: 300; color: var(--ink); line-height: 1.1; margin-bottom: 48px; }
        .display-heading em { font-style: italic; color: var(--gold); }

        /* ── Founding curator spotlight ── */
        .spotlight-wrap { background: var(--cream2); border-top: 0.5px solid var(--br); border-bottom: 0.5px solid var(--br); }
        .spotlight-inner { max-width: 1200px; margin: 0 auto; padding: 96px 48px; }
        .spotlight-head { display: flex; gap: 48px; align-items: flex-start; margin-bottom: 56px; }
        .spotlight-portrait {
          width: 220px; height: 290px; flex-shrink: 0;
          border: 1px solid var(--br); background: #fff;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .spotlight-portrait img { width: 100%; height: 100%; object-fit: cover; }
        .spotlight-portrait span { font-family: var(--serif); font-style: italic; font-size: 56px; color: var(--gold); }
        .spotlight-kicker { font-family: var(--serif); font-style: italic; font-size: 15px; color: var(--muted); margin-bottom: 6px; }
        .spotlight-name   { font-family: var(--serif); font-weight: 300; font-size: clamp(32px,3.6vw,48px); color: var(--ink); line-height: 1.1; margin-bottom: 14px; }
        .spotlight-meta   { display: flex; gap: 14px; font-size: 12px; color: var(--muted); margin-bottom: 16px; }
        .spotlight-meta span + span { padding-left: 14px; border-left: 0.5px solid var(--br); }
        .spotlight-bio    { font-size: 14px; color: var(--ink2); line-height: 1.8; font-weight: 300; max-width: 420px; margin-bottom: 22px; }
        .spotlight-cta    { font-size: 12px; letter-spacing: 0.04em; color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--gold); padding-bottom: 2px; }
        .spotlight-cta:hover { color: var(--gold); }

        .spotlight-rail-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 18px; }
        .spotlight-rail { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 4px; }
        .rail-item { flex-shrink: 0; width: 170px; text-decoration: none; color: inherit; }
        .rail-img { aspect-ratio: 3/4; background: #fff; border: 0.5px solid var(--br); display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 8px; transition: box-shadow 0.2s; }
        .rail-item:hover .rail-img { box-shadow: 0 8px 24px rgba(20,18,16,0.1); }
        .rail-img img { width: 100%; height: 100%; object-fit: contain; padding: 10px; }
        .rail-ph { font-family: var(--serif); font-style: italic; font-size: 30px; color: rgba(20,18,16,0.1); }
        .rail-brand { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 2px; }
        .rail-price { font-family: var(--serif); font-size: 15px; color: var(--ink); }

        .spotlight-empty { text-align: center; padding: 40px 20px; }
        .spotlight-empty-line { font-family: var(--serif); font-size: 26px; font-weight: 300; color: var(--ink); margin-bottom: 8px; }
        .spotlight-empty-sub  { font-size: 13px; color: var(--muted); margin-bottom: 28px; }

        /* ── How it works ── */
        .hiw-wrap { background: var(--cream); }
        .hiw-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }
        .hiw-role { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); font-weight: 500; margin-bottom: 32px; }
        .step   { display: flex; gap: 20px; margin-bottom: 30px; }
        .step-n { font-family: var(--serif); font-size: 12px; color: var(--gold); width: 20px; flex-shrink: 0; padding-top: 3px; }
        .step-t { font-size: 14px; font-weight: 500; color: var(--ink); margin-bottom: 6px; line-height: 1.5; }
        .step-b { font-size: 13px; color: var(--muted); line-height: 1.7; font-weight: 300; }

        /* ── Why CurateKin ── */
        .why-wrap { background: var(--cream2); border-top: 0.5px solid var(--br); border-bottom: 0.5px solid var(--br); }
        .why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px 64px; }
        .why-item { padding-top: 20px; border-top: 1px solid var(--gold); }
        .why-t { font-family: var(--serif); font-size: 22px; font-weight: 300; color: var(--ink); margin-bottom: 8px; line-height: 1.3; }
        .why-b { font-size: 13px; color: var(--muted); line-height: 1.7; font-weight: 300; max-width: 340px; }

        /* ── CTA bands (creator + shopper) ── */
        .cta-wrap { border-top: 0.5px solid var(--br); }
        .cta-band { max-width: 1200px; margin: 0 auto; padding: 88px 48px; }
        .cta-band.split { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; flex-wrap: wrap; }
        .cta-h { font-family: var(--serif); font-size: clamp(30px,3.4vw,48px); font-weight: 300; color: var(--ink); line-height: 1.1; margin-bottom: 16px; max-width: 520px; }
        .cta-p { font-size: 14px; color: var(--muted); line-height: 1.8; font-weight: 300; max-width: 420px; margin-bottom: 32px; }
        .cta-band.center { text-align: center; }
        .cta-band.center .cta-h { max-width: none; margin-left: auto; margin-right: auto; }

        /* ── Footer ── */
        footer { background: var(--ink); color: #fff; padding: 48px 48px 32px; }
        .ft-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
        .ft-logo { font-family: var(--serif); font-size: 18px; font-weight: 400; color: #fff; }
        .ft-logo em { font-style: italic; color: var(--gold2); }
        .ft-links { display: flex; gap: 28px; flex-wrap: wrap; }
        .ft-links a { font-size: 12px; color: rgba(255,255,255,0.4); text-decoration: none; transition: color .15s; }
        .ft-links a:hover { color: #fff; }
        .ft-copy { font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 24px; }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          nav { padding: 0 24px; }
          .nav-mid { display: none; }
          .hero { grid-template-columns: 1fr; padding: 128px 24px 64px; gap: 40px; }
          .hero-visual { order: -1; aspect-ratio: 16/10; }
          .section { padding: 72px 24px; }
          .spotlight-inner { padding: 72px 24px; }
          .spotlight-head { flex-direction: column; gap: 28px; }
          .spotlight-portrait { width: 160px; height: 210px; }
          .hiw-cols { grid-template-columns: 1fr; gap: 48px; }
          .why-grid { grid-template-columns: 1fr; gap: 32px; }
          .cta-band { padding: 64px 24px; }
          .cta-band.split { flex-direction: column; align-items: flex-start; }
        }

        @media (max-width: 640px) {
          .display-heading { font-size: 34px; }
          .section { padding: 56px 20px; }
          .spotlight-inner { padding: 56px 20px; }
          .rail-item { width: 140px; }
          .ft-inner { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* ── 1. Navigation ── */}
      <nav>
        <Link href="/" className="logo">Curate<em>Kin</em></Link>
        <div className="nav-mid">
          <Link href="/creators">Curators</Link>
          <a href="#how">How it works</a>
          <Link href="/brands">For brands</Link>
        </div>
        <div className="nav-right">
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/signup" className="btn-ink">Get started</Link>
        </div>
      </nav>

      {/* ── 2. Hero ── */}
      <div className="hero">
        <div>
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-line" />
            Trusted curation · Real people
          </div>
          <h1>Curated by creators<br/><em>you trust.</em></h1>
          <p className="hero-sub">
            The creators, doctors, stylists, and tastemakers you trust — sharing the products they genuinely use.
          </p>
          <div className="hero-btns">
            <Link href="/creators" className="btn-gold">Browse curators</Link>
            <Link href="/signup" className="btn-outline">Apply as a creator</Link>
          </div>
        </div>
        <div className="hero-visual">
          <Image
            src="/images/p2.jpg"
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      </div>

      {/* ── 3. Founding curator / real curation section ── */}
      <div id="curators" className="spotlight-wrap">
        <div className="spotlight-inner">
          <div className="display-eyebrow">Founding Curator</div>
          {founder ? (
            <>
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
            </>
          ) : founderLoaded ? (
            <div className="spotlight-empty">
              <p className="spotlight-empty-line">Our first curators are building their storefronts.</p>
              <p className="spotlight-empty-sub">Check back soon — or be one of the first to apply.</p>
              <Link href="/signup" className="btn-outline">Apply as a creator</Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── 4. How it works ── */}
      <div className="hiw-wrap" id="how">
        <div className="section">
          <div className="display-eyebrow">Simple by design</div>
          <div className="display-heading">How it works</div>
          <div className="hiw-cols">
            <div>
              <div className="hiw-role">For shoppers</div>
              {SHOPPER_STEPS.map(s => (
                <div className="step" key={s.n}>
                  <div className="step-n">{s.n}</div>
                  <div>
                    <div className="step-t">{s.t}</div>
                    <div className="step-b">{s.b}</div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="hiw-role">For creators</div>
              {CREATOR_STEPS.map(s => (
                <div className="step" key={s.n}>
                  <div className="step-n">{s.n}</div>
                  <div>
                    <div className="step-t">{s.t}</div>
                    <div className="step-b">{s.b}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Why CurateKin ── */}
      <div className="why-wrap">
        <div className="section">
          <div className="display-eyebrow">Why CurateKin</div>
          <div className="display-heading">A different kind<br/>of <em>discovery.</em></div>
          <div className="why-grid">
            {WHY_POINTS.map(w => (
              <div className="why-item" key={w.t}>
                <div className="why-t">{w.t}</div>
                <div className="why-b">{w.b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. Creator CTA ── */}
      <div className="cta-wrap">
        <div className="cta-band split">
          <div>
            <div className="cta-h">Your taste deserves a home.</div>
            <p className="cta-p">Apply to build a curated storefront around the products you actually use, recommend, and stand behind.</p>
          </div>
          <Link href="/signup" className="btn-gold">Apply as a creator</Link>
        </div>
      </div>

      {/* ── 7. Shopper CTA ── */}
      <div className="cta-wrap">
        <div className="cta-band center">
          <div className="cta-h">Shop through people you trust.</div>
          <Link href="/creators" className="btn-outline">Browse curators</Link>
        </div>
      </div>

      {/* ── 8. Footer ── */}
      <footer>
        <div className="ft-inner">
          <div className="ft-logo">Curate<em>Kin</em></div>
          <div className="ft-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href="mailto:hello@curatekin.com">Contact</a>
          </div>
        </div>
        <div className="ft-inner">
          <div className="ft-copy">© 2026 CurateKin. All rights reserved.</div>
        </div>
      </footer>
    </>
  )
}
