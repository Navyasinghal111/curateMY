'use client'

export default function EarningsPage() {
  return (
    <>
      <div style={{ marginBottom:32 }}>
        <p style={{ fontSize:11, letterSpacing:'0.14em', color:'#B07D4A', marginBottom:8, textTransform:'uppercase' }}>Earnings</p>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color:'#141210' }}>Your earnings</h1>
      </div>

      <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'60px 28px', textAlign:'center' }}>
        <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:300, color:'#141210', marginBottom:10 }}>No earnings yet</p>
        <p style={{ fontSize:13, color:'#8C867E', lineHeight:1.6, maxWidth:420, margin:'0 auto' }}>
          Earnings will appear after affiliate tracking and verified conversions are active.
        </p>
      </div>
    </>
  )
}
