'use client'

import Link from 'next/link'

// ── Data ─────────────────────────────────────────────────────────
const SKINCARE_PRODUCTS = [
  { glyph:'Sk', tone:'c1', tag:'Serum',        brand:'Minimalist',       name:'10% Niacinamide',    price:'₹599'   },
  { glyph:'Sp', tone:'c2', tag:'SPF',           brand:'Dot & Key',        name:'UV Shield SPF 50',   price:'₹849'   },
  { glyph:'Cr', tone:'c3', tag:'Moisturiser',   brand:'Forest Essentials',name:'Daily Repair Creme', price:'₹1,200' },
  { glyph:'To', tone:'c4', tag:'Toner',         brand:'Plum',             name:'Glycolic Toner',     price:'₹449'   },
  { glyph:'Ey', tone:'c5', tag:'Eye Cream',     brand:'Kama Ayurveda',    name:'Radiant Eye Butter', price:'₹2,100' },
  { glyph:'Cl', tone:'c6', tag:'Cleanser',      brand:'Cetaphil',         name:'Gentle Skin Cleanser',price:'₹380'  },
]

const CURATORS = [
  { mono:'Ps', tone:'t1', badge:'Dermatologist', name:'Dr. Priya Sharma', role:'Dermatologist · Mumbai',         products:'84',  followers:'12.4K' },
  { mono:'Ak', tone:'t2', badge:'Fashion Editor', name:'Azra Khan',       role:'Fashion Editor · Delhi',          products:'127', followers:'38K'   },
  { mono:'Rk', tone:'t3', badge:'Wellness Coach', name:'Rohan Kapoor',    role:'Wellness & Nutrition · Bangalore',products:'56',  followers:'9.7K'  },
  { mono:'Mi', tone:'t4', badge:'Stylist',         name:'Mira Iyer',       role:'Celebrity Stylist · Mumbai',      products:'203', followers:'61K'   },
]

const MARQUEE_ITEMS = ['Skincare','Fashion','Wellness','Dermatologist Picks','Home & Living','Beauty','Nutrition','Fitness','Tech & Gadgets']

const CREATOR_STEPS = [
  { n:'01', t:'Apply & get verified',    b:'Anyone with a trusted point of view — creator, doctor, stylist, celebrity. Apply once, get your curator badge and storefront URL.' },
  { n:'02', t:'Add products you love',   b:'Add any product from any brand instantly. Write why you trust it. Group into collections. No approval process.' },
  { n:'03', t:'Earn 80% on every sale',  b:'When your followers shop through your storefront you earn 80% commission. Tracked automatically, paid monthly.' },
]

const SHOPPER_STEPS = [
  { n:'01', t:'Follow who you trust',      b:'Find the dermatologist you follow, the stylist you love, the chef you admire. All their picks in one place.' },
  { n:'02', t:'Discover with real context',b:'Every product has a curator note — why they use it, how long, what it does. No anonymous reviews.' },
  { n:'03', t:'Shop directly from brands', b:'Click through to the brand website. No middlemen, no markups. Trusted picks, straight to checkout.' },
]

const BRANDS = ['Forest Essentials','Sabyasachi','Minimalist','Nykaa','Mamaearth','Dot & Key','Kama Ayurveda']

const CURATOR_FEATS  = ['Your storefront at curatekin.com/you','Add any product from any brand instantly','Earn 80% commission on every sale','Direct brand collaboration opportunities']
const SHOPPER_FEATS  = ['Follow curators whose taste you trust','Verified picks from doctors & experts','Shop directly from brand websites','Save picks and build your wishlist']

const FOOTER_PLATFORM = [['Browse curators','/curators'],['Categories','/categories'],['For brands','/brands'],['About','/about']]
const FOOTER_CURATORS = [['Apply to join','/signup'],['Dashboard','/dashboard'],['Earnings','/earnings'],['Help','/help']]
const FOOTER_COMPANY  = [['Privacy','/privacy'],['Terms','/terms'],['Contact','mailto:hello@curatekin.com'],['Careers','/careers']]

// ─────────────────────────────────────────────────────────────────
export default function Home() {
  // All signup CTAs are plain <Link href="/signup"> — no JS needed
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --w:    #FAFAF8; --w2: #F4F2EE;
          --ink:  #141210; --ink2: #3A3630; --muted: #8C867E; --dim: #C4BEB6;
          --acc:  #B07D4A; --acc2: #C99A6A;
          --acc-bg: rgba(176,125,74,0.09); --acc-br: rgba(176,125,74,0.22);
          --br:   rgba(20,18,16,0.07);
          --serif:'Cormorant Garamond', Georgia, serif;
          --sans: 'DM Sans', system-ui, sans-serif;
        }
        html { scroll-behavior: smooth; }
        body { background:var(--w); color:var(--ink); font-family:var(--sans); -webkit-font-smoothing:antialiased; }

        /* ── Nav ── */
        nav { position:fixed; top:0; left:0; right:0; z-index:100; height:60px; display:flex; align-items:center; justify-content:space-between; padding:0 44px; background:rgba(250,250,248,0.94); backdrop-filter:blur(18px); border-bottom:0.5px solid var(--br); }
        .logo { font-family:var(--serif); font-size:21px; font-weight:300; color:var(--ink); text-decoration:none; letter-spacing:0.03em; }
        .logo em { font-style:italic; color:var(--acc); }
        .nav-mid { display:flex; gap:32px; }
        .nav-mid a { font-size:13px; color:var(--muted); text-decoration:none; letter-spacing:0.03em; transition:color .15s; }
        .nav-mid a:hover { color:var(--ink); }
        .nav-right { display:flex; gap:8px; align-items:center; }
        .btn-ghost { font-size:13px; color:var(--muted); background:none; border:none; cursor:pointer; font-family:var(--sans); padding:6px 12px; border-radius:100px; text-decoration:none; }
        .btn-dark  { font-size:13px; font-weight:500; font-family:var(--sans); background:var(--ink); color:var(--w); border:none; padding:8px 20px; border-radius:100px; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; }
        .btn-dark:hover { opacity:0.88; }

        /* ── Hero ── */
        .hero { min-height:100vh; display:grid; grid-template-columns:1fr 1fr; padding-top:60px; }
        .hero-left { display:flex; flex-direction:column; justify-content:center; padding:72px 56px 72px 44px; border-right:0.5px solid var(--br); }
        .hero-tag { display:inline-flex; align-items:center; gap:6px; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--acc); font-weight:500; margin-bottom:32px; }
        .hero-tag-dot { width:4px; height:4px; border-radius:50%; background:var(--acc); }
        h1 { font-family:var(--serif); font-size:clamp(52px,5vw,78px); font-weight:300; line-height:1.07; color:var(--ink); margin-bottom:24px; }
        h1 em { font-style:italic; color:var(--acc); }
        .hero-sub { font-size:15px; font-weight:300; color:var(--muted); line-height:1.8; max-width:380px; margin-bottom:44px; }
        .hero-btns { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:56px; }
        .btn-outline { font-size:13px; font-family:var(--sans); color:var(--ink2); border:0.5px solid var(--br); background:transparent; padding:10px 22px; border-radius:100px; text-decoration:none; display:inline-flex; align-items:center; }
        .hero-stats { display:flex; border-top:0.5px solid var(--br); padding-top:40px; }
        .hstat { flex:1; padding-right:24px; }
        .hstat + .hstat { padding-left:24px; border-left:0.5px solid var(--br); }
        .hstat-n { font-family:var(--serif); font-size:32px; font-weight:300; color:var(--ink); line-height:1; }
        .hstat-l { font-size:11px; color:var(--muted); letter-spacing:0.07em; margin-top:6px; }

        /* ── Hero right / storefront mock ── */
        .hero-right { background:var(--w2); position:relative; overflow:hidden; display:flex; flex-direction:column; }
        .storefront-mock { flex:1; display:flex; flex-direction:column; padding:32px 32px 0; overflow:hidden; }
        .sf-profile { display:flex; align-items:center; gap:14px; margin-bottom:28px; padding-bottom:28px; border-bottom:0.5px solid var(--br); }
        .sf-avatar { width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg,#D4B896,#B8956A); display:flex; align-items:center; justify-content:center; font-family:var(--serif); font-size:20px; font-style:italic; color:#fff; flex-shrink:0; }
        .sf-name { font-size:16px; font-weight:500; color:var(--ink); }
        .sf-role { font-size:12px; color:var(--muted); margin-top:3px; }
        .sf-verified { margin-left:auto; display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:100px; background:var(--acc-bg); border:0.5px solid var(--acc-br); font-size:10px; letter-spacing:0.07em; color:var(--acc); font-weight:500; }
        .sf-label { font-size:10px; letter-spacing:0.12em; text-transform:uppercase; color:var(--muted); margin-bottom:16px; font-weight:500; }
        .sf-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
        .sf-card { border-radius:12px; overflow:hidden; border:0.5px solid var(--br); background:var(--w); }
        .sf-card-img { aspect-ratio:3/4; display:flex; align-items:center; justify-content:center; position:relative; }
        .c1{background:linear-gradient(160deg,#EDE4D8,#D4C4B0)}.c2{background:linear-gradient(160deg,#E2DACE,#CABFB0)}
        .c3{background:linear-gradient(160deg,#E8E0D4,#D0C8B8)}.c4{background:linear-gradient(160deg,#DFE4DC,#C8D0C4)}
        .c5{background:linear-gradient(160deg,#E6DDD4,#D0C4B4)}.c6{background:linear-gradient(160deg,#EAE2D8,#D8CAB8)}
        .sf-glyph { font-family:var(--serif); font-size:28px; font-style:italic; color:rgba(20,18,16,0.15); }
        .sf-tag { position:absolute; bottom:8px; left:8px; padding:3px 9px; border-radius:100px; background:rgba(250,250,248,0.88); font-size:10px; color:var(--ink2); border:0.5px solid rgba(20,18,16,0.07); letter-spacing:0.04em; }
        .sf-card-body { padding:10px 12px 12px; }
        .sf-brand { font-size:10px; color:var(--muted); letter-spacing:0.06em; text-transform:uppercase; margin-bottom:3px; }
        .sf-pname { font-size:12px; font-weight:500; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sf-price { font-size:12px; color:var(--muted); margin-top:2px; }
        .sf-fade { height:80px; background:linear-gradient(to bottom,transparent,var(--w2)); margin-top:-80px; pointer-events:none; flex-shrink:0; }

        /* ── Marquee ── */
        .mq-wrap { border-top:0.5px solid var(--br); border-bottom:0.5px solid var(--br); padding:12px 0; overflow:hidden; background:var(--w); }
        .mq-track { display:inline-block; white-space:nowrap; animation:mq 30s linear infinite; }
        @keyframes mq { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .mq-item { display:inline-flex; align-items:center; gap:10px; margin-right:44px; font-family:var(--serif); font-style:italic; font-size:15px; color:var(--muted); }
        .mq-dot { color:var(--acc); font-style:normal; font-size:9px; }

        /* ── Sections ── */
        .section { max-width:1200px; margin:0 auto; padding:96px 44px; }
        .sec-tag { font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--acc); font-weight:500; margin-bottom:18px; display:flex; align-items:center; gap:10px; }
        .sec-tag::before { content:''; width:18px; height:0.5px; background:var(--acc); }
        .sec-h  { font-family:var(--serif); font-size:clamp(36px,3.5vw,52px); font-weight:300; line-height:1.1; color:var(--ink); margin-bottom:16px; }
        .sec-h em { font-style:italic; color:var(--acc); }
        .sec-p  { font-size:15px; font-weight:300; color:var(--muted); line-height:1.8; max-width:420px; margin-bottom:52px; }

        /* ── Curators ── */
        .curator-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        .c-card { border:0.5px solid var(--br); border-radius:18px; background:var(--w); overflow:hidden; transition:transform .2s,box-shadow .2s; text-decoration:none; display:block; color:inherit; }
        .c-card:hover { transform:translateY(-4px); box-shadow:0 16px 48px rgba(20,18,16,0.07); }
        .c-img { height:200px; display:flex; align-items:center; justify-content:center; position:relative; border-bottom:0.5px solid var(--br); }
        .t1{background:linear-gradient(150deg,#EDE5D8,#D8CAB4)}.t2{background:linear-gradient(150deg,#E2DDD5,#C8BFAF)}
        .t3{background:linear-gradient(150deg,#E5DFD8,#CEBFB0)}.t4{background:linear-gradient(150deg,#E0DDD6,#CAC4B8)}
        .c-mono  { font-family:var(--serif); font-size:48px; font-style:italic; font-weight:300; color:rgba(20,18,16,0.1); }
        .c-badge { position:absolute; bottom:10px; left:10px; padding:4px 10px; border-radius:100px; background:rgba(250,250,248,0.9); font-size:10px; color:var(--ink2); letter-spacing:0.05em; border:0.5px solid var(--br); font-weight:500; }
        .c-body  { padding:16px 18px 18px; }
        .c-name  { font-size:15px; font-weight:500; color:var(--ink); margin-bottom:3px; }
        .c-role  { font-size:12px; color:var(--muted); font-weight:300; margin-bottom:14px; }
        .c-stats { display:flex; gap:16px; padding-top:12px; border-top:0.5px solid var(--br); }
        .c-sv    { font-family:var(--serif); font-size:17px; font-weight:300; color:var(--ink); }
        .c-sl    { font-size:10px; color:var(--dim); letter-spacing:0.06em; margin-top:2px; }

        /* ── How it works ── */
        .hiw-wrap { border-top:0.5px solid var(--br); background:var(--w2); }
        .hiw-cols { display:grid; grid-template-columns:1fr 1fr; gap:80px; margin-top:64px; padding-top:56px; border-top:0.5px solid var(--br); }
        .hiw-role { font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--muted); font-weight:500; margin-bottom:36px; }
        .step    { display:flex; gap:20px; margin-bottom:36px; }
        .step-n  { font-family:var(--serif); font-size:12px; color:var(--acc); opacity:.6; padding-top:2px; width:16px; flex-shrink:0; }
        .step-t  { font-size:14px; font-weight:500; color:var(--ink); margin-bottom:6px; }
        .step-b  { font-size:13px; color:var(--muted); line-height:1.7; font-weight:300; }

        /* ── Brands ── */
        .brands-wrap { border-top:0.5px solid var(--br); padding:52px 44px; }
        .brands-label { font-size:11px; letter-spacing:0.13em; text-transform:uppercase; color:var(--dim); text-align:center; margin-bottom:32px; font-weight:500; }
        .brands-row { display:flex; align-items:center; justify-content:center; gap:52px; flex-wrap:wrap; }
        .brand-n { font-family:var(--serif); font-size:17px; font-weight:300; font-style:italic; color:var(--dim); }

        /* ── Join ── */
        .join-wrap { border-top:0.5px solid var(--br); }
        .join-grid { display:grid; grid-template-columns:1fr 1fr; }
        .join-col  { padding:88px 64px; display:flex; flex-direction:column; justify-content:center; }
        .join-col.dark { background:var(--ink); }
        .join-col.dark .sec-tag { color:var(--acc2); }
        .join-col.dark .sec-tag::before { background:var(--acc2); }
        .join-col.dark .sec-h  { color:var(--w); }
        .join-col.dark .sec-h em { color:var(--acc2); }
        .join-col.dark .sec-p  { color:rgba(250,250,248,.45); }
        .feats   { margin:28px 0 36px; }
        .feat    { display:flex; align-items:flex-start; gap:10px; margin-bottom:12px; font-size:13px; color:var(--muted); font-weight:300; line-height:1.5; }
        .join-col.dark .feat { color:rgba(250,250,248,.4); }
        .feat-d  { width:4px; height:4px; border-radius:50%; background:var(--acc); margin-top:5px; flex-shrink:0; }
        .join-col.dark .feat-d { background:var(--acc2); }
        /* Single shared CTA button — variant via class */
        .btn-cta { display:inline-flex; align-items:center; padding:12px 28px; border-radius:100px; font-size:13px; font-weight:500; font-family:var(--sans); cursor:pointer; text-decoration:none; align-self:flex-start; border:none; }
        .btn-cta.light { background:var(--ink); color:var(--w); }
        .btn-cta.cream { background:var(--w);   color:var(--ink); }
        .btn-cta:hover { opacity:0.88; }

        /* ── Footer ── */
        footer { background:var(--ink); color:var(--w); padding:64px 44px 40px; }
        .ft { display:grid; grid-template-columns:1.6fr 1fr 1fr 1fr; gap:48px; padding-bottom:48px; border-bottom:0.5px solid rgba(255,255,255,.07); margin-bottom:32px; }
        .ft-logo { font-family:var(--serif); font-size:24px; font-weight:300; color:var(--w); margin-bottom:12px; }
        .ft-logo em { font-style:italic; color:var(--acc2); }
        .ft-tag  { font-size:13px; color:rgba(250,250,248,.35); font-weight:300; line-height:1.65; max-width:190px; }
        .ft-col-h { font-size:10px; letter-spacing:0.13em; text-transform:uppercase; color:rgba(250,250,248,.25); margin-bottom:16px; font-weight:500; }
        .ft-links { display:flex; flex-direction:column; gap:10px; }
        .ft-links a { font-size:13px; color:rgba(250,250,248,.4); text-decoration:none; font-weight:300; }
        .ft-bottom { display:flex; align-items:center; justify-content:space-between; }
        .ft-copy { font-size:11px; color:rgba(250,250,248,.2); }
        .ft-bl { display:flex; gap:20px; }
        .ft-bl a { font-size:11px; color:rgba(250,250,248,.2); text-decoration:none; }

        /* ── Responsive ── */
        @media(max-width:1024px){
          nav { padding:0 24px; } .nav-mid { display:none; }
          .hero { grid-template-columns:1fr; min-height:auto; }
          .hero-left { padding:80px 24px 56px; border-right:none; }
          .hero-right { min-height:480px; }
          .section { padding:72px 24px; }
          .curator-row { grid-template-columns:1fr 1fr; }
          .hiw-cols { grid-template-columns:1fr; gap:48px; }
          .join-grid { grid-template-columns:1fr; }
          .join-col { padding:64px 32px; }
          .ft { grid-template-columns:1fr 1fr; gap:32px; }
        }
        @media(max-width:600px){
          .curator-row { grid-template-columns:1fr; }
          .sf-grid { grid-template-columns:1fr 1fr; }
          .ft { grid-template-columns:1fr; }
        }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

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
          <Link href="/signup" className="btn-dark">Get started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="hero">
        <div className="hero-left">
          <div className="hero-tag"><div className="hero-tag-dot" />Trusted curation · Real people</div>
          <h1>Shop what<br/>they <em>actually</em><br/>love</h1>
          <p className="hero-sub">The people you trust — creators, doctors, stylists, icons — curate the products they genuinely stand behind. Discover them all in one place.</p>
          <div className="hero-btns">
            <Link href="/signup" className="btn-dark">Start your storefront</Link>
            <a href="#curators" className="btn-outline">Browse curators</a>
          </div>
          <div className="hero-stats">
            {[['2,400+','Curators'],['48K+','Products curated'],['80%','Creator commission']].map(([n,l]) => (
              <div className="hstat" key={l}><div className="hstat-n">{n}</div><div className="hstat-l">{l}</div></div>
            ))}
          </div>
        </div>
        <div className="hero-right">
          <div className="storefront-mock">
            <div className="sf-profile">
              <div className="sf-avatar">Dr</div>
              <div><div className="sf-name">Dr. Priya Sharma</div><div className="sf-role">Dermatologist · Mumbai</div></div>
              <div className="sf-verified">✦ Verified</div>
            </div>
            <div className="sf-label">Skincare Essentials</div>
            <div className="sf-grid">
              {SKINCARE_PRODUCTS.map(p => (
                <div className="sf-card" key={p.name}>
                  <div className={`sf-card-img ${p.tone}`}><div className="sf-glyph">{p.glyph}</div><div className="sf-tag">{p.tag}</div></div>
                  <div className="sf-card-body"><div className="sf-brand">{p.brand}</div><div className="sf-pname">{p.name}</div><div className="sf-price">{p.price}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="sf-fade" />
        </div>
      </div>

      {/* ── Marquee ── */}
      <div className="mq-wrap" aria-hidden="true">
        {/* Duplicate array in JS so no manual copy-paste in markup */}
        <div className="mq-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="mq-item">{item} <span className="mq-dot">✦</span></span>
          ))}
        </div>
      </div>

      {/* ── Curators ── */}
      <div id="curators" className="section">
        <div className="sec-tag">Featured curators</div>
        <div className="sec-h">Tastemakers you can <em>trust</em></div>
        <p className="sec-p">From dermatologists to fashion editors — every curator on CurateKin vouches personally for every product they share.</p>
        <div className="curator-row">
          {CURATORS.map(c => (
            <a key={c.name} href={`/${c.name.toLowerCase().replace(/ /g,'-')}`} className="c-card">
              <div className={`c-img ${c.tone}`}><div className="c-mono">{c.mono}</div><div className="c-badge">{c.badge}</div></div>
              <div className="c-body">
                <div className="c-name">{c.name}</div>
                <div className="c-role">{c.role}</div>
                <div className="c-stats">
                  <div><div className="c-sv">{c.products}</div><div className="c-sl">Products</div></div>
                  <div><div className="c-sv">{c.followers}</div><div className="c-sl">Followers</div></div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="hiw-wrap" id="how">
        <div className="section">
          <div className="sec-tag">How it works</div>
          <div className="sec-h">Two audiences. One <em>platform.</em></div>
          <div className="hiw-cols">
            {[['For curators & creators', CREATOR_STEPS],['For shoppers & buyers', SHOPPER_STEPS]].map(([role, steps]) => (
              <div key={role as string}>
                <div className="hiw-role">{role as string}</div>
                {(steps as typeof CREATOR_STEPS).map(s => (
                  <div className="step" key={s.n}>
                    <div className="step-n">{s.n}</div>
                    <div><div className="step-t">{s.t}</div><div className="step-b">{s.b}</div></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Brands ── */}
      <div className="brands-wrap">
        <div className="brands-label">Curators share products from</div>
        <div className="brands-row">
          {BRANDS.map(b => <div key={b} className="brand-n">{b}</div>)}
        </div>
      </div>

      {/* ── Join ── */}
      <div className="join-wrap">
        <div className="join-grid">
          <div className="join-col">
            <div className="sec-tag">For curators</div>
            <div className="sec-h">Your taste is your <em>brand</em></div>
            <p className="sec-p">Turn products you already love into a storefront that earns. No follower minimum. No brand approvals.</p>
            <div className="feats">
              {CURATOR_FEATS.map(f => <div key={f} className="feat"><div className="feat-d" />{f}</div>)}
            </div>
            <Link href="/signup" className="btn-cta light">Apply as a curator</Link>
          </div>
          <div className="join-col dark">
            <div className="sec-tag">For shoppers</div>
            <div className="sec-h">Discover products with <em>real context</em></div>
            <p className="sec-p">Shop what the people you trust actually use. Every product comes with a personal note — not a sponsored caption.</p>
            <div className="feats">
              {SHOPPER_FEATS.map(f => <div key={f} className="feat"><div className="feat-d" />{f}</div>)}
            </div>
            <Link href="/signup" className="btn-cta cream">Join as a shopper</Link>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer>
        <div className="ft">
          <div>
            <div className="ft-logo">Curate<em>Kin</em></div>
            <div className="ft-tag">Where trusted tastemakers meet the products they love.</div>
          </div>
          {[['Platform', FOOTER_PLATFORM],['Curators', FOOTER_CURATORS],['Company', FOOTER_COMPANY]].map(([heading, links]) => (
            <div key={heading as string}>
              <div className="ft-col-h">{heading as string}</div>
              <div className="ft-links">
                {(links as string[][]).map(([label, href]) => <a key={label} href={href}>{label}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="ft-bottom">
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