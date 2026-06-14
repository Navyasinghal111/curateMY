export default function Home() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --w: #FAFAF8; --w2: #F4F2EE; --w3: #EDEAE4;
          --ink: #141210; --ink2: #3A3630; --muted: #8C867E; --dim: #C4BEB6;
          --acc: #B07D4A; --acc2: #C99A6A;
          --acc-bg: rgba(176,125,74,0.09); --acc-br: rgba(176,125,74,0.22);
          --br: rgba(20,18,16,0.07);
          --serif: 'Cormorant Garamond', Georgia, serif;
          --sans: 'DM Sans', system-ui, sans-serif;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--w); color: var(--ink); font-family: var(--sans); -webkit-font-smoothing: antialiased; }
        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 200; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 44px; background: rgba(250,250,248,0.94); backdrop-filter: blur(18px); border-bottom: 0.5px solid var(--br); }
        .logo { font-family: var(--serif); font-size: 21px; font-weight: 300; color: var(--ink); text-decoration: none; letter-spacing: 0.03em; }
        .logo em { font-style: italic; color: var(--acc); }
        .nav-mid { display: flex; gap: 32px; }
        .nav-mid a { font-size: 13px; color: var(--muted); text-decoration: none; letter-spacing: 0.03em; transition: color .15s; }
        .nav-mid a:hover { color: var(--ink); }
        .nav-right { display: flex; gap: 8px; align-items: center; }
        .btn-text { font-size: 13px; color: var(--muted); background: none; border: none; cursor: pointer; font-family: var(--sans); padding: 6px 12px; border-radius: 100px; }
        .btn-dark { font-size: 13px; font-weight: 500; font-family: var(--sans); background: var(--ink); color: var(--w); border: none; padding: 8px 20px; border-radius: 100px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
        .hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; padding-top: 60px; }
        .hero-left { display: flex; flex-direction: column; justify-content: center; padding: 72px 56px 72px 44px; border-right: 0.5px solid var(--br); }
        .hero-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--acc); font-weight: 500; margin-bottom: 32px; }
        .hero-tag-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--acc); }
        h1 { font-family: var(--serif); font-size: clamp(52px, 5vw, 78px); font-weight: 300; line-height: 1.07; color: var(--ink); margin-bottom: 24px; }
        h1 em { font-style: italic; color: var(--acc); }
        .hero-sub { font-size: 15px; font-weight: 300; color: var(--muted); line-height: 1.8; max-width: 380px; margin-bottom: 44px; }
        .hero-btns { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 56px; }
        .btn-outline { font-size: 13px; font-family: var(--sans); color: var(--ink2); border: 0.5px solid var(--br); background: transparent; padding: 10px 22px; border-radius: 100px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
        .hero-stats { display: flex; gap: 0; border-top: 0.5px solid var(--br); padding-top: 40px; }
        .hstat { flex: 1; padding-right: 24px; }
        .hstat + .hstat { padding-left: 24px; border-left: 0.5px solid var(--br); }
        .hstat-n { font-family: var(--serif); font-size: 32px; font-weight: 300; color: var(--ink); line-height: 1; }
        .hstat-l { font-size: 11px; color: var(--muted); letter-spacing: 0.07em; margin-top: 6px; }
        .hero-right { background: var(--w2); position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .storefront-mock { flex: 1; display: flex; flex-direction: column; padding: 32px 32px 0; overflow: hidden; }
        .sf-profile { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; padding-bottom: 28px; border-bottom: 0.5px solid var(--br); }
        .sf-avatar { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg,#D4B896,#B8956A); display: flex; align-items: center; justify-content: center; font-family: var(--serif); font-size: 20px; font-style: italic; color: #fff; flex-shrink: 0; }
        .sf-name { font-size: 16px; font-weight: 500; color: var(--ink); }
        .sf-role { font-size: 12px; color: var(--muted); margin-top: 3px; }
        .sf-verified { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 100px; background: var(--acc-bg); border: 0.5px solid var(--acc-br); font-size: 10px; letter-spacing: 0.07em; color: var(--acc); font-weight: 500; }
        .sf-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 16px; font-weight: 500; }
        .sf-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .sf-card { border-radius: 12px; overflow: hidden; border: 0.5px solid var(--br); background: var(--w); }
        .sf-card-img { aspect-ratio: 3/4; display: flex; align-items: center; justify-content: center; position: relative; }
        .c1 { background: linear-gradient(160deg,#EDE4D8,#D4C4B0); }
        .c2 { background: linear-gradient(160deg,#E2DACE,#CABFB0); }
        .c3 { background: linear-gradient(160deg,#E8E0D4,#D0C8B8); }
        .c4 { background: linear-gradient(160deg,#DFE4DC,#C8D0C4); }
        .c5 { background: linear-gradient(160deg,#E6DDD4,#D0C4B4); }
        .c6 { background: linear-gradient(160deg,#EAE2D8,#D8CAB8); }
        .sf-glyph { font-family: var(--serif); font-size: 28px; font-style: italic; color: rgba(20,18,16,0.15); }
        .sf-tag { position: absolute; bottom: 8px; left: 8px; padding: 3px 9px; border-radius: 100px; background: rgba(250,250,248,0.88); font-size: 10px; color: var(--ink2); border: 0.5px solid rgba(20,18,16,0.07); letter-spacing: 0.04em; }
        .sf-card-body { padding: 10px 12px 12px; }
        .sf-brand { font-size: 10px; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 3px; }
        .sf-pname { font-size: 12px; font-weight: 500; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sf-price { font-size: 12px; color: var(--muted); margin-top: 2px; }
        .sf-fade { height: 80px; background: linear-gradient(to bottom,transparent,var(--w2)); margin-top: -80px; pointer-events: none; flex-shrink: 0; }
        .mq-wrap { border-top: 0.5px solid var(--br); border-bottom: 0.5px solid var(--br); padding: 12px 0; overflow: hidden; background: var(--w); }
        .mq-track { display: inline-block; white-space: nowrap; animation: mq 30s linear infinite; }
        @keyframes mq { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .mq-item { display: inline-flex; align-items: center; gap: 10px; margin-right: 44px; font-family: var(--serif); font-style: italic; font-size: 15px; color: var(--muted); }
        .mq-dot { color: var(--acc); font-style: normal; font-family: var(--sans); font-size: 9px; }
        .section { max-width: 1200px; margin: 0 auto; padding: 96px 44px; }
        .sec-tag { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--acc); font-weight: 500; margin-bottom: 18px; display: flex; align-items: center; gap: 10px; }
        .sec-tag::before { content: ''; width: 18px; height: 0.5px; background: var(--acc); }
        .sec-h { font-family: var(--serif); font-size: clamp(36px,3.5vw,52px); font-weight: 300; line-height: 1.1; color: var(--ink); margin-bottom: 16px; }
        .sec-h em { font-style: italic; color: var(--acc); }
        .sec-p { font-size: 15px; font-weight: 300; color: var(--muted); line-height: 1.8; max-width: 420px; margin-bottom: 52px; }
        .curator-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .c-card { border: 0.5px solid var(--br); border-radius: 18px; background: var(--w); overflow: hidden; transition: transform .2s, box-shadow .2s; cursor: pointer; text-decoration: none; display: block; color: inherit; }
        .c-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(20,18,16,0.07); }
        .c-img { height: 200px; display: flex; align-items: center; justify-content: center; position: relative; border-bottom: 0.5px solid var(--br); }
        .t1 { background: linear-gradient(150deg,#EDE5D8,#D8CAB4); }
        .t2 { background: linear-gradient(150deg,#E2DDD5,#C8BFAF); }
        .t3 { background: linear-gradient(150deg,#E5DFD8,#CEBFB0); }
        .t4 { background: linear-gradient(150deg,#E0DDD6,#CAC4B8); }
        .c-mono { font-family: var(--serif); font-size: 48px; font-style: italic; font-weight: 300; color: rgba(20,18,16,0.1); }
        .c-badge { position: absolute; bottom: 10px; left: 10px; padding: 4px 10px; border-radius: 100px; background: rgba(250,250,248,0.9); font-size: 10px; color: var(--ink2); letter-spacing: 0.05em; border: 0.5px solid var(--br); font-weight: 500; }
        .c-body { padding: 16px 18px 18px; }
        .c-name { font-size: 15px; font-weight: 500; color: var(--ink); margin-bottom: 3px; }
        .c-role { font-size: 12px; color: var(--muted); font-weight: 300; margin-bottom: 14px; }
        .c-stats { display: flex; gap: 16px; padding-top: 12px; border-top: 0.5px solid var(--br); }
        .c-sv { font-family: var(--serif); font-size: 17px; font-weight: 300; color: var(--ink); }
        .c-sl { font-size: 10px; color: var(--dim); letter-spacing: 0.06em; margin-top: 2px; }
        .hiw-wrap { border-top: 0.5px solid var(--br); background: var(--w2); }
        .hiw-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-top: 64px; padding-top: 56px; border-top: 0.5px solid var(--br); }
        .hiw-role { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); font-weight: 500; margin-bottom: 36px; }
        .step { display: flex; gap: 20px; margin-bottom: 36px; }
        .step-n { font-family: var(--serif); font-size: 12px; color: var(--acc); opacity: .6; padding-top: 2px; width: 16px; flex-shrink: 0; }
        .step-t { font-size: 14px; font-weight: 500; color: var(--ink); margin-bottom: 6px; }
        .step-b { font-size: 13px; color: var(--muted); line-height: 1.7; font-weight: 300; }
        .brands-wrap { border-top: 0.5px solid var(--br); padding: 52px 44px; }
        .brands-label { font-size: 11px; letter-spacing: 0.13em; text-transform: uppercase; color: var(--dim); text-align: center; margin-bottom: 32px; font-weight: 500; }
        .brands-row { display: flex; align-items: center; justify-content: center; gap: 52px; flex-wrap: wrap; }
        .brand-n { font-family: var(--serif); font-size: 17px; font-weight: 300; font-style: italic; color: var(--dim); }
        .join-wrap { border-top: 0.5px solid var(--br); }
        .join-grid { display: grid; grid-template-columns: 1fr 1fr; }
        .join-col { padding: 88px 64px; display: flex; flex-direction: column; justify-content: center; }
        .join-col.dark { background: var(--ink); }
        .join-col.dark .sec-tag { color: var(--acc2); }
        .join-col.dark .sec-tag::before { background: var(--acc2); }
        .join-col.dark .sec-h { color: var(--w); }
        .join-col.dark .sec-h em { color: var(--acc2); }
        .join-col.dark .sec-p { color: rgba(250,250,248,.45); }
        .feats { margin: 28px 0 36px; }
        .feat { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; font-size: 13px; color: var(--muted); font-weight: 300; line-height: 1.5; }
        .join-col.dark .feat { color: rgba(250,250,248,.4); }
        .feat-d { width: 4px; height: 4px; border-radius: 50%; background: var(--acc); margin-top: 5px; flex-shrink: 0; }
        .join-col.dark .feat-d { background: var(--acc2); }
        .btn-cream { display: inline-flex; align-items: center; padding: 12px 28px; border-radius: 100px; background: var(--w); border: none; color: var(--ink); font-size: 13px; font-weight: 500; font-family: var(--sans); cursor: pointer; text-decoration: none; align-self: flex-start; }
        .btn-dark2 { display: inline-flex; align-items: center; padding: 12px 28px; border-radius: 100px; background: var(--ink); border: none; color: var(--w); font-size: 13px; font-weight: 500; font-family: var(--sans); cursor: pointer; text-decoration: none; align-self: flex-start; }
        footer { background: var(--ink); color: var(--w); padding: 64px 44px 40px; }
        .ft { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 48px; padding-bottom: 48px; border-bottom: 0.5px solid rgba(255,255,255,.07); margin-bottom: 32px; }
        .ft-logo { font-family: var(--serif); font-size: 24px; font-weight: 300; color: var(--w); margin-bottom: 12px; }
        .ft-logo em { font-style: italic; color: var(--acc2); }
        .ft-tag { font-size: 13px; color: rgba(250,250,248,.35); font-weight: 300; line-height: 1.65; max-width: 190px; }
        .ft-col-h { font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: rgba(250,250,248,.25); margin-bottom: 16px; font-weight: 500; }
        .ft-links { display: flex; flex-direction: column; gap: 10px; }
        .ft-links a { font-size: 13px; color: rgba(250,250,248,.4); text-decoration: none; font-weight: 300; }
        .ft-bottom { display: flex; align-items: center; justify-content: space-between; }
        .ft-copy { font-size: 11px; color: rgba(250,250,248,.2); }
        .ft-bl { display: flex; gap: 20px; }
        .ft-bl a { font-size: 11px; color: rgba(250,250,248,.2); text-decoration: none; }
        @media(max-width:1024px) {
          nav { padding: 0 24px; }
          .nav-mid { display: none; }
          .hero { grid-template-columns: 1fr; min-height: auto; }
          .hero-left { padding: 80px 24px 56px; border-right: none; }
          .hero-right { min-height: 480px; }
          .section { padding: 72px 24px; }
          .curator-row { grid-template-columns: 1fr 1fr; }
          .hiw-cols { grid-template-columns: 1fr; gap: 48px; }
          .join-grid { grid-template-columns: 1fr; }
          .join-col { padding: 64px 32px; }
          .ft { grid-template-columns: 1fr 1fr; gap: 32px; }
        }
        @media(max-width:600px) {
          .curator-row { grid-template-columns: 1fr; }
          .sf-grid { grid-template-columns: 1fr 1fr; }
          .ft { grid-template-columns: 1fr; }
        }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <nav>
        <a href="/" className="logo">Curate<em>Kin</em></a>
        <div className="nav-mid">
          <a href="#curators">Curators</a>
          <a href="#how">How it works</a>
          <a href="/brands">For brands</a>
        </div>
        <div className="nav-right">
          <a href="/login" className="btn-text">Sign in</a>
          <a href="/signup" className="btn-dark">Get started</a>
        </div>
      </nav>

      <div className="hero">
        <div className="hero-left">
          <div className="hero-tag"><div className="hero-tag-dot"></div>Trusted curation · Real people</div>
          <h1>Shop what<br/>they <em>actually</em><br/>love</h1>
          <p className="hero-sub">The people you trust — creators, doctors, stylists, icons — curate the products they genuinely stand behind. Discover them all in one place.</p>
          <div className="hero-btns">
            <a href="/signup?role=curator" className="btn-dark">Start your storefront</a>
            <a href="#curators" className="btn-outline">Browse curators</a>
          </div>
          <div className="hero-stats">
            <div className="hstat"><div className="hstat-n">2,400+</div><div className="hstat-l">Curators</div></div>
            <div className="hstat"><div className="hstat-n">48K+</div><div className="hstat-l">Products curated</div></div>
            <div className="hstat"><div className="hstat-n">80%</div><div className="hstat-l">Creator commission</div></div>
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
              <div className="sf-card"><div className="sf-card-img c1"><div className="sf-glyph">Sk</div><div className="sf-tag">Serum</div></div><div className="sf-card-body"><div className="sf-brand">Minimalist</div><div className="sf-pname">10% Niacinamide</div><div className="sf-price">₹599</div></div></div>
              <div className="sf-card"><div className="sf-card-img c2"><div className="sf-glyph">Sp</div><div className="sf-tag">SPF</div></div><div className="sf-card-body"><div className="sf-brand">Dot & Key</div><div className="sf-pname">UV Shield SPF 50</div><div className="sf-price">₹849</div></div></div>
              <div className="sf-card"><div className="sf-card-img c3"><div className="sf-glyph">Cr</div><div className="sf-tag">Moisturiser</div></div><div className="sf-card-body"><div className="sf-brand">Forest Essentials</div><div className="sf-pname">Daily Repair Creme</div><div className="sf-price">₹1,200</div></div></div>
              <div className="sf-card"><div className="sf-card-img c4"><div className="sf-glyph">To</div><div className="sf-tag">Toner</div></div><div className="sf-card-body"><div className="sf-brand">Plum</div><div className="sf-pname">Glycolic Toner</div><div className="sf-price">₹449</div></div></div>
              <div className="sf-card"><div className="sf-card-img c5"><div className="sf-glyph">Ey</div><div className="sf-tag">Eye Cream</div></div><div className="sf-card-body"><div className="sf-brand">Kama Ayurveda</div><div className="sf-pname">Radiant Eye Butter</div><div className="sf-price">₹2,100</div></div></div>
              <div className="sf-card"><div className="sf-card-img c6"><div className="sf-glyph">Cl</div><div className="sf-tag">Cleanser</div></div><div className="sf-card-body"><div className="sf-brand">Cetaphil</div><div className="sf-pname">Gentle Skin Cleanser</div><div className="sf-price">₹380</div></div></div>
            </div>
          </div>
          <div className="sf-fade"></div>
        </div>
      </div>

      <div className="mq-wrap" aria-hidden="true">
        <div className="mq-track">
          {["Skincare","Fashion","Wellness","Dermatologist Picks","Home & Living","Beauty","Nutrition","Fitness","Tech & Gadgets","Skincare","Fashion","Wellness","Dermatologist Picks","Home & Living","Beauty","Nutrition","Fitness","Tech & Gadgets"].map((item, i) => (
            <span key={i} className="mq-item">{item} <span className="mq-dot">✦</span></span>
          ))}
        </div>
      </div>

      <div id="curators" className="section">
        <div className="sec-tag">Featured curators</div>
        <div className="sec-h">Tastemakers you can <em>trust</em></div>
        <p className="sec-p">From dermatologists to fashion editors — every curator on CurateKin vouches personally for every product they share.</p>
        <div className="curator-row">
          {[{mono:"Ps",tone:"t1",badge:"Dermatologist",name:"Dr. Priya Sharma",role:"Dermatologist · Mumbai",products:"84",followers:"12.4K"},{mono:"Ak",tone:"t2",badge:"Fashion Editor",name:"Azra Khan",role:"Fashion Editor · Delhi",products:"127",followers:"38K"},{mono:"Rk",tone:"t3",badge:"Wellness Coach",name:"Rohan Kapoor",role:"Wellness & Nutrition · Bangalore",products:"56",followers:"9.7K"},{mono:"Mi",tone:"t4",badge:"Stylist",name:"Mira Iyer",role:"Celebrity Stylist · Mumbai",products:"203",followers:"61K"}].map((c,i) => (
            <a key={i} href={`/${c.name.toLowerCase().replace(/ /g,'-')}`} className="c-card">
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

      <div className="hiw-wrap" id="how">
        <div className="section">
          <div className="sec-tag">How it works</div>
          <div className="sec-h">Two audiences. One <em>platform.</em></div>
          <div className="hiw-cols">
            <div>
              <div className="hiw-role">For curators & creators</div>
              <div className="step"><div className="step-n">01</div><div><div className="step-t">Apply & get verified</div><div className="step-b">Anyone with a trusted point of view — creator, doctor, stylist, celebrity. Apply once, get your curator badge and storefront URL.</div></div></div>
              <div className="step"><div className="step-n">02</div><div><div className="step-t">Add products you love</div><div className="step-b">Add any product from any brand instantly. Write why you trust it. Group into collections. No approval process.</div></div></div>
              <div className="step"><div className="step-n">03</div><div><div className="step-t">Earn 80% on every sale</div><div className="step-b">When your followers shop through your storefront you earn 80% commission. Tracked automatically, paid monthly.</div></div></div>
            </div>
            <div>
              <div className="hiw-role">For shoppers & buyers</div>
              <div className="step"><div className="step-n">01</div><div><div className="step-t">Follow who you trust</div><div className="step-b">Find the dermatologist you follow, the stylist you love, the chef you admire. All their picks in one place.</div></div></div>
              <div className="step"><div className="step-n">02</div><div><div className="step-t">Discover with real context</div><div className="step-b">Every product has a curator note — why they use it, how long, what it does. No anonymous reviews.</div></div></div>
              <div className="step"><div className="step-n">03</div><div><div className="step-t">Shop directly from brands</div><div className="step-b">Click through to the brand website. No middlemen, no markups. Trusted picks, straight to checkout.</div></div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="brands-wrap">
        <div className="brands-label">Curators share products from</div>
        <div className="brands-row">
          {["Forest Essentials","Sabyasachi","Minimalist","Nykaa","Mamaearth","Dot & Key","Kama Ayurveda"].map((b,i) => <div key={i} className="brand-n">{b}</div>)}
        </div>
      </div>

      <div className="join-wrap">
        <div className="join-grid">
          <div className="join-col">
            <div className="sec-tag">For curators</div>
            <div className="sec-h">Your taste is your <em>brand</em></div>
            <p className="sec-p">Turn products you already love into a storefront that earns. No follower minimum. No brand approvals.</p>
            <div className="feats">
              <div className="feat"><div className="feat-d"></div>Your storefront at curatekin.com/you</div>
              <div className="feat"><div className="feat-d"></div>Add any product from any brand instantly</div>
              <div className="feat"><div className="feat-d"></div>Earn 80% commission on every sale</div>
              <div className="feat"><div className="feat-d"></div>Direct brand collaboration opportunities</div>
            </div>
            <a href="/signup?role=curator" className="btn-dark2">Apply as a curator</a>
          </div>
          <div className="join-col dark">
            <div className="sec-tag">For shoppers</div>
            <div className="sec-h">Discover products with <em>real context</em></div>
            <p className="sec-p">Shop what the people you trust actually use. Every product comes with a personal note — not a sponsored caption.</p>
            <div className="feats">
              <div className="feat"><div className="feat-d"></div>Follow curators whose taste you trust</div>
              <div className="feat"><div className="feat-d"></div>Verified picks from doctors & experts</div>
              <div className="feat"><div className="feat-d"></div>Shop directly from brand websites</div>
              <div className="feat"><div className="feat-d"></div>Save picks and build your wishlist</div>
            </div>
            <a href="/signup?role=buyer" className="btn-cream">Join as a shopper</a>
          </div>
        </div>
      </div>

      <footer>
        <div className="ft">
          <div><div className="ft-logo">Curate<em>Kin</em></div><div className="ft-tag">Where trusted tastemakers meet the products they love.</div></div>
          <div><div className="ft-col-h">Platform</div><div className="ft-links"><a href="/curators">Browse curators</a><a href="/categories">Categories</a><a href="/brands">For brands</a><a href="/about">About</a></div></div>
          <div><div className="ft-col-h">Curators</div><div className="ft-links"><a href="/apply">Apply to join</a><a href="/dashboard">Dashboard</a><a href="/earnings">Earnings</a><a href="/help">Help</a></div></div>
          <div><div className="ft-col-h">Company</div><div className="ft-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:hello@curatekin.com">Contact</a><a href="/careers">Careers</a></div></div>
        </div>
        <div className="ft-bottom">
          <div className="ft-copy">© 2026 CurateKin. All rights reserved.</div>
          <div className="ft-bl"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:hello@curatekin.com">Contact</a></div>
        </div>
      </footer>
    </>
  );
}
