'use client'

export default function EarningsPage() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const current = new Date().getMonth()

  return (
    <>
      <div style={{ marginBottom:32 }}>
        <p style={{ fontSize:11, letterSpacing:'0.14em', color:'#B07D4A', marginBottom:8, textTransform:'uppercase' }}>Earnings</p>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color:'#141210' }}>Your earnings</h1>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
        {[
          { label:'Total earned',   value:'₹0', sub:'All time' },
          { label:'This month',     value:'₹0', sub:'June 2026' },
          { label:'Pending payout', value:'₹0', sub:'Releases 1st of next month' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'24px 20px' }}>
            <p style={{ fontSize:10, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:12 }}>{s.label}</p>
            <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:40, fontWeight:300, color:'#141210', lineHeight:1 }}>{s.value}</p>
            <p style={{ fontSize:11, color:'#C4BEB6', marginTop:6 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'28px', marginBottom:20 }}>
        <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'#141210', marginBottom:24 }}>Monthly breakdown</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
          {months.map((m,i) => (
            <div key={m} style={{ textAlign:'center', padding:'16px 8px', background: i===current ? 'rgba(176,125,74,0.06)' : '#FAFAF8', border:`0.5px solid ${i===current ? 'rgba(176,125,74,0.2)' : 'rgba(20,18,16,0.07)'}`, borderRadius:8 }}>
              <p style={{ fontSize:10, color: i===current ? '#B07D4A' : '#8C867E', marginBottom:8, letterSpacing:'0.06em' }}>{m}</p>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300, color:'#141210' }}>₹0</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:'#141210', borderRadius:14, padding:'28px' }}>
        <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'#fff', marginBottom:8 }}>How you earn</h3>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7, maxWidth:500 }}>
          You earn <strong style={{ color:'#C99A6A' }}>80% commission</strong> on every sale made through your storefront. Earnings are calculated after returns close and paid to your UPI ID monthly, once your balance crosses ₹100.
        </p>
      </div>
    </>
  )
}