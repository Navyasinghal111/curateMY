'use client'

import Link from 'next/link'

// ── Data ─────────────────────────────────────────────────────────
const CURATORS = [
  { initials:'PS', name:'Dr. Priya Sharma', role:'Dermatologist · Mumbai',          badge:'Verified Doctor',   products:'84',  followers:'12.4K', size:'large'  },
  { initials:'AK', name:'Azra Khan',        role:'Fashion Editor · Delhi',           badge:'Fashion Editor',    products:'127', followers:'38K',   size:'small'  },
  { initials:'MI', name:'Mira Iyer',        role:'Celebrity Stylist · Mumbai',       badge:'Celebrity Stylist', products:'203', followers:'61K',   size:'small'  },
  { initials:'RK', name:'Rohan Kapoor',     role:'Wellness Coach · Bangalore',       badge:'Wellness',          products:'56',  followers:'9.7K',  size:'small'  },
  { initials:'SB', name:'Sanya Bahl',       role:'Skincare Creator · Hyderabad',     badge:'Skincare',          products:'91',  followers:'22K',   size:'small'  },
]

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

// Placeholder tones for curator cards until real photos
const TONES = [
  'linear-gradient(160deg,#2A2420,#1A1410)',
  'linear-gradient(160deg,#1E1E2A,#141420)',
  'linear-gradient(160deg,#1A2020,#101818)',
  'linear-gradient(160deg,#24201A,#18140E)',
  'linear-gradient(160deg,#20181E,#180E18)',
]

export default function Home() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
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
          --serif: 'Cormorant Garamond', Georgia, serif;
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
        /* Decorative editorial lines */
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
        .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 64px; }
        .btn-gold  { font-size: 12px; letter-spacing: 0.08em; font-family: var(--sans); font-weight: 500; background: var(--gold); color: #fff; border: none; padding: 12px 28px; cursor: pointer; text-decoration: none; }
        .btn-gold:hover { background: var(--gold2); }
        .btn-ghost-dark { font-size: 12px; letter-spacing: 0.08em; font-family: var(--sans); color: rgba(255,255,255,0.5); background: none; border: 0.5px solid rgba(255,255,255,0.2); padding: 12px 28px; text-decoration: none; }
        .btn-ghost-dark:hover { border-color: rgba(255,255,255,0.4); color: rgba(255,255,255,0.8); }
        .hero-stats { display: flex; gap: 0; border-top: 0.5px solid rgba(255,255,255,0.08); padding-top: 40px; }
        .hstat { flex: 1; padding-right: 32px; }
        .hstat + .hstat { padding-left: 32px; border-left: 0.5px solid rgba(255,255,255,0.08); }
        .hstat-n { font-family: var(--serif); font-size: 34px; font-weight: 300; color: #fff; line-height: 1; }
        .hstat-l { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 6px; }

        /* ── Marquee ── */
        .mq-wrap { border-top: 0.5px solid var(--br); border-bottom: 0.5px solid var(--br); padding: 14px 0; overflow: hidden; background: var(--cream); }
        .mq-track { display: inline-block; white-space: nowrap; animation: mq 32s linear infinite; }
        @keyframes mq { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .mq-item { display: inline-flex; align-items: center; gap: 12px; margin-right: 48px; font-family: var(--serif); font-style: italic; font-size: 16px; color: var(--muted); }
        .mq-sep { color: var(--gold); font-style: normal; font-size: 8px; }

        /* ── Section shell ── */
        .section { max-width: 1200px; margin: 0 auto; padding: 96px 48px; }

        /* ── "Shop by" display type ── */
        .display-eyebrow { font-family: var(--serif); font-style: italic; font-size: 16px; color: var(--muted); margin-bottom: 4px; }
        .display-heading { font-family: var(--serif); font-size: clamp(48px,5vw,80px); font-weight: 300; color: var(--ink); line-height: 1; margin-bottom: 48px; }

        /* ── Curator grid — asymmetric masonry ── */
        .curator-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          grid-template-rows: 460px 300px;
          gap: 3px;
          width: 100vw;
          max-width: 100%;
        }
        .curator-card {
          position: relative; overflow: hidden; cursor: pointer;
          text-decoration: none; display: block; min-width: 0;
        }
        .curator-card.large {
          grid-column: 1;
          grid-row: 1 / 3;
        }
        .curator-card.small-1 { grid-column: 2; grid-row: 1; }
        .curator-card.small-2 { grid-column: 3; grid-row: 1; }
        .curator-card.small-3 { grid-column: 2; grid-row: 2; }
        .curator-card.small-4 { grid-column: 3; grid-row: 2; }
        .curator-bg {
          position: absolute; inset: 0;
          transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .curator-card:hover .curator-bg { transform: scale(1.04); }
        .curator-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%);
        }
        .curator-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 16px 16px;
        }
        .curator-badge {
          display: inline-block; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--gold2); border: 0.5px solid rgba(176,125,74,0.4);
          padding: 3px 8px; margin-bottom: 6px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
        }
        .curator-name {
          font-family: var(--serif); font-weight: 300; color: #fff;
          line-height: 1.1; word-break: break-word;
        }
        .curator-card.large .curator-name { font-size: 36px; }
        .curator-card:not(.large) .curator-name { font-size: 20px; }
        .curator-eyebrow {
          font-family: var(--serif); font-style: italic; font-size: 11px;
          color: rgba(255,255,255,0.45); margin-bottom: 3px;
        }
        .curator-role {
          font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 4px; line-height: 1.4;
        }
        .curator-card.large .curator-role { font-size: 13px; }

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
          .curator-grid {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 300px 220px 220px;
          }
          .curator-card.large  { grid-column: 1 / 3; grid-row: 1; }
          .curator-card.small-1{ grid-column: 1; grid-row: 2; }
          .curator-card.small-2{ grid-column: 2; grid-row: 2; }
          .curator-card.small-3{ grid-column: 1; grid-row: 3; }
          .curator-card.small-4{ grid-column: 2; grid-row: 3; }
          .hiw-cols { grid-template-columns: 1fr; gap: 48px; }
          .join-grid { grid-template-columns: 1fr; }
          .join-col { padding: 64px 32px; }
          .dark-break { padding: 72px 24px; }
          .ft { grid-template-columns: 1fr 1fr; gap: 32px; }
        }

        @media (max-width: 640px) {
          .hero-content { padding: 72px 20px; }
          h1 { font-size: 44px; }
          .curator-grid {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 200px 160px 160px;
          }
          .curator-card.large .curator-name { font-size: 24px; }
          .curator-card:not(.large) .curator-name { font-size: 16px; }
          .display-heading { font-size: 40px; }
          .section { padding: 60px 20px; }
          .ft { grid-template-columns: 1fr; }
          .join-col { padding: 52px 20px; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav>
        <a href="/" className="logo">Curate<em>Kin</em></a>
        <div className="nav-mid">
          <a href="#curators">Curators</a>
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
            <a href="#curators" className="btn-ghost-dark">Browse curators</a>
          </div>
          <div className="hero-stats">
            {[['2,400+','Curators'],['48K+','Products curated'],['80%','Creator commission']].map(([n,l]) => (
              <div className="hstat" key={l}>
                <div className="hstat-n">{n}</div>
                <div className="hstat-l">{l}</div>
              </div>
            ))}
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

      {/* ── Curators — asymmetric editorial grid ── */}
      <div id="curators">
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'96px 48px 48px' }}>
          <div className="display-eyebrow">Shop by</div>
          <div className="display-heading">Curator</div>
        </div>
        <div className="curator-grid">
          {CURATORS.map((c, i) => {
            const sizeClass = i === 0 ? 'large' : `small-${i}`
            return (
            <a key={c.name} href={`/${c.name.toLowerCase().replace(/ \./g,'').replace(/ /g,'-')}`} className={`curator-card ${sizeClass}`}>
              <div className="curator-bg" style={{ background: TONES[i] }} />
              <div className="curator-overlay" />
              <div className="curator-info">
                <div className="curator-badge">{c.badge}</div>
                <div className="curator-eyebrow">Curated by</div>
                <div className="curator-name">{c.name}</div>
                {i === 0 && <div className="curator-role">{c.role} · {c.products} products · {c.followers} followers</div>}
                {i !== 0 && <div className="curator-role">{c.products} products</div>}
              </div>
            </a>
            )
          })}
        </div>
      </div>

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