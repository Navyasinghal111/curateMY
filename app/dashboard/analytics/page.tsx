'use client'

export default function AnalyticsPage() {
  return (
    <>
      <div style={{ marginBottom:32 }}>
        <p style={{ fontSize:11, letterSpacing:'0.14em', color:'#B07D4A', marginBottom:8, textTransform:'uppercase' }}>Analytics</p>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color:'#141210' }}>Performance</h1>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        {[
          { label:'Storefront Views',  value:'0',  sub:'This month' },
          { label:'Link Clicks',       value:'0',  sub:'This month' },
          { label:'Click-through rate',value:'0%', sub:'Views → clicks' },
          { label:'Conversion rate',   value:'0%', sub:'Clicks → orders' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'22px 18px' }}>
            <p style={{ fontSize:10, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:12 }}>{s.label}</p>
            <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color:'#141210', lineHeight:1 }}>{s.value}</p>
            <p style={{ fontSize:11, color:'#C4BEB6', marginTop:6 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'28px' }}>
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'#141210', marginBottom:20 }}>Top products</h2>
          <div style={{ padding:'40px 0', textAlign:'center', borderTop:'0.5px solid rgba(20,18,16,0.07)' }}>
            <p style={{ fontSize:13, color:'#C4BEB6' }}>No data yet. Add products and share your storefront to see analytics.</p>
          </div>
        </div>
        <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'28px' }}>
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'#141210', marginBottom:20 }}>Traffic sources</h2>
          <div style={{ padding:'40px 0', textAlign:'center', borderTop:'0.5px solid rgba(20,18,16,0.07)' }}>
            <p style={{ fontSize:13, color:'#C4BEB6' }}>No data yet. Analytics will appear once visitors start arriving.</p>
          </div>
        </div>
      </div>
    </>
  )
}