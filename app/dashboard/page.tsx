'use client'

export default function Dashboard() {
  const profile = {
    display_name: 'Navya Singh',
    username: 'navya',
    status: 'approved',
    role: 'creator',
  }

  const stats = [
    { label: 'Total Earnings', value: '₹0', sub: 'All time' },
    { label: 'Link Clicks', value: '0', sub: 'This month' },
    { label: 'Products Added', value: '0', sub: 'In your storefront' },
    { label: 'Orders', value: '0', sub: 'This month' },
  ]

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --w: #FAFAF8; --w2: #F4F2EE;
          --ink: #141210; --muted: #8C867E; --dim: #C4BEB6;
          --acc: #B07D4A; --acc2: #C99A6A;
          --br: rgba(20,18,16,0.07);
          --serif: 'Cormorant Garamond', Georgia, serif;
          --sans: 'DM Sans', system-ui, sans-serif;
        }
        body { background: var(--w); color: var(--ink); font-family: var(--sans); -webkit-font-smoothing: antialiased; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <div style={{ display:'flex', minHeight:'100vh' }}>

        {/* Sidebar */}
        <div style={{ width:220, background:'#141210', display:'flex', flexDirection:'column', padding:'32px 0', flexShrink:0, position:'fixed', top:0, left:0, bottom:0 }}>
          <div style={{ padding:'0 24px 32px', borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
            <a href="/" style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'#fff', textDecoration:'none' }}>
              Curate<em style={{ fontStyle:'italic', color:'#C99A6A' }}>Kin</em>
            </a>
          </div>

          <nav style={{ flex:1, padding:'24px 0' }}>
            {[
              { label: 'Dashboard', href: '/dashboard', active: true },
              { label: 'My Products', href: '/dashboard/products', active: false },
              { label: 'Storefront', href: '/dashboard/storefront', active: false },
              { label: 'Earnings', href: '/dashboard/earnings', active: false },
              { label: 'Analytics', href: '/dashboard/analytics', active: false },
              { label: 'Settings', href: '/dashboard/settings', active: false },
            ].map((item) => (
              <a key={item.label} href={item.href} style={{
                display:'block', padding:'10px 24px', fontSize:13,
                color: item.active ? '#fff' : 'rgba(255,255,255,0.4)',
                textDecoration:'none', fontWeight: item.active ? 500 : 300,
                background: item.active ? 'rgba(255,255,255,0.06)' : 'transparent',
                borderLeft: item.active ? '2px solid #B07D4A' : '2px solid transparent',
              }}>
                {item.label}
              </a>
            ))}
          </nav>

          <div style={{ padding:'24px', borderTop:'0.5px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:4 }}>{profile.display_name}</div>
            <div style={{ fontSize:10, color:'#B07D4A', letterSpacing:'0.1em', marginBottom:16 }}>CREATOR</div>
            <button style={{ fontSize:11, color:'rgba(255,255,255,0.3)', background:'none', border:'none', cursor:'pointer', padding:0 }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{ marginLeft:220, flex:1, padding:'48px' }}>

          {/* Header */}
          <div style={{ marginBottom:48 }}>
            <p style={{ fontSize:11, letterSpacing:'0.14em', color:'#B07D4A', marginBottom:8, textTransform:'uppercase' }}>Welcome back</p>
            <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color:'#141210' }}>
              {profile.display_name}
            </h1>
            <p style={{ fontSize:13, color:'#8C867E', marginTop:6 }}>
              Your storefront:{' '}
              <a href={`/${profile.username}`} style={{ color:'#B07D4A', textDecoration:'none' }}>
                curatekin.com/{profile.username}
              </a>
            </p>
          </div>

          {/* Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:48 }}>
            {stats.map((stat) => (
              <div key={stat.label} style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:16, padding:'24px 20px' }}>
                <div style={{ fontSize:11, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:12 }}>{stat.label}</div>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color:'#141210', lineHeight:1 }}>{stat.value}</div>
                <div style={{ fontSize:11, color:'#C4BEB6', marginTop:6 }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>

            {/* Products */}
            <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:16, padding:'28px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
                <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:300, color:'#141210' }}>My Products</h2>
                <a href="/dashboard/products" style={{ fontSize:12, color:'#B07D4A', textDecoration:'none' }}>Add product →</a>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 0', borderTop:'0.5px solid rgba(20,18,16,0.07)' }}>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:48, fontStyle:'italic', color:'rgba(20,18,16,0.08)', marginBottom:16 }}>Pk</div>
                <p style={{ fontSize:13, color:'#C4BEB6', textAlign:'center', maxWidth:200 }}>No products yet. Start adding products you love.</p>
                <a href="/dashboard/products" style={{ marginTop:20, padding:'10px 24px', background:'#141210', color:'#fff', fontSize:12, borderRadius:100, textDecoration:'none', display:'inline-block' }}>
                  Add your first product
                </a>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Storefront link */}
              <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:16, padding:'24px' }}>
                <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300, color:'#141210', marginBottom:8 }}>Your Storefront</h3>
                <p style={{ fontSize:12, color:'#8C867E', marginBottom:16 }}>Share this link with your followers.</p>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#F4F2EE', borderRadius:8 }}>
                  <span style={{ fontSize:12, color:'#8C867E', flex:1 }}>curatekin.com/{profile.username}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(`curatekin.com/${profile.username}`)}
                    style={{ fontSize:11, color:'#B07D4A', background:'none', border:'none', cursor:'pointer', letterSpacing:'0.05em' }}
                  >
                    COPY
                  </button>
                </div>
              </div>

              {/* Earnings */}
              <div style={{ background:'#141210', borderRadius:16, padding:'24px' }}>
                <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300, color:'#fff', marginBottom:8 }}>Earnings</h3>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:20 }}>You earn 80% commission on every sale.</p>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:42, fontWeight:300, color:'#fff' }}>₹0</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4 }}>Total earned</div>
                <a href="/dashboard/earnings" style={{ display:'inline-block', marginTop:20, padding:'10px 20px', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', fontSize:12, borderRadius:100, textDecoration:'none' }}>
                  View earnings →
                </a>
              </div>

              {/* Checklist */}
              <div style={{ background:'rgba(176,125,74,0.06)', border:'0.5px solid rgba(176,125,74,0.2)', borderRadius:16, padding:'24px' }}>
                <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300, color:'#141210', marginBottom:16 }}>Get started</h3>
                {[
                  { label: 'Complete your profile', done: true },
                  { label: 'Add your first product', done: false },
                  { label: 'Share your storefront link', done: false },
                  { label: 'Make your first sale', done: false },
                ].map((item) => (
                  <div key={item.label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background: item.done ? '#B07D4A' : 'transparent', border:`0.5px solid ${item.done ? '#B07D4A' : 'rgba(176,125,74,0.3)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {item.done && <span style={{ fontSize:10, color:'#fff' }}>✓</span>}
                    </div>
                    <span style={{ fontSize:13, color: item.done ? '#8C867E' : '#141210', textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}