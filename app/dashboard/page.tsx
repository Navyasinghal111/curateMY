'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setProfile({ display_name:'Navya Singhal', username:'navya' }); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  const stats = [
    { label:'TOTAL EARNINGS', value:'₹0',  sub:'All time' },
    { label:'LINK CLICKS',    value:'0',   sub:'This month' },
    { label:'PRODUCTS ADDED', value:'0',   sub:'In your storefront' },
    { label:'ORDERS',         value:'0',   sub:'This month' },
  ]

  const checklist = [
    { label:'Complete your profile',     done: true },
    { label:'Add your first product',    done: false },
    { label:'Share your storefront',     done: false },
    { label:'Make your first sale',      done: false },
  ]

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        .stat-card { background:#fff; border:0.5px solid #EBEBEB; border-radius:12px; padding:24px; transition:box-shadow 0.2s; }
        .stat-card:hover { box-shadow:0 4px 20px rgba(0,0,0,0.06); }
      `}</style>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom:40 }}>
          <p style={{ fontSize:11, letterSpacing:'0.14em', color:'#B07D4A', marginBottom:8, textTransform:'uppercase' }}>Welcome back</p>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:40, fontWeight:300, color:'#0A0A0A', marginBottom:6 }}>
            {profile?.display_name ?? '…'}
          </h1>
          <p style={{ fontSize:13, color:'#9B9B9B' }}>
            Your storefront:{' '}
            <a href={`/${profile?.username}`} style={{ color:'#B07D4A', textDecoration:'none' }}>
              curatekin.com/{profile?.username ?? '…'}
            </a>
          </p>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:40 }}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <p style={{ fontSize:10, letterSpacing:'0.12em', color:'#9B9B9B', textTransform:'uppercase', marginBottom:12 }}>{s.label}</p>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:40, fontWeight:300, color:'#0A0A0A', lineHeight:1 }}>{s.value}</p>
              <p style={{ fontSize:11, color:'#C4C4C4', marginTop:6 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Two column */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>

          {/* Products */}
          <div style={{ background:'#fff', border:'0.5px solid #EBEBEB', borderRadius:12, padding:'28px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:300, color:'#0A0A0A' }}>My Products</h2>
              <a href="/dashboard/products" style={{ fontSize:12, color:'#B07D4A', textDecoration:'none' }}>Add product →</a>
            </div>
            <div style={{ borderTop:'0.5px solid #F0F0F0', paddingTop:32, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 0' }}>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:52, fontStyle:'italic', color:'rgba(0,0,0,0.06)', marginBottom:14 }}>Pk</p>
              <p style={{ fontSize:13, color:'#C4C4C4', textAlign:'center', maxWidth:200, lineHeight:1.6 }}>No products yet. Start adding products you love.</p>
              <a href="/dashboard/products" style={{ marginTop:20, padding:'10px 24px', background:'#0A0A0A', color:'#fff', fontSize:12, borderRadius:4, textDecoration:'none', display:'inline-block', letterSpacing:'0.06em' }}>
                Add your first product
              </a>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Storefront link */}
            <div style={{ background:'#fff', border:'0.5px solid #EBEBEB', borderRadius:12, padding:'24px' }}>
              <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300, color:'#0A0A0A', marginBottom:6 }}>Your Storefront</h3>
              <p style={{ fontSize:12, color:'#9B9B9B', marginBottom:16 }}>Share this link with your followers.</p>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#F8F8F8', borderRadius:6, border:'0.5px solid #EBEBEB' }}>
                <span style={{ fontSize:12, color:'#9B9B9B', flex:1 }}>curatekin.com/{profile?.username}</span>
                <button onClick={() => navigator.clipboard.writeText(`curatekin.com/${profile?.username}`)}
                  style={{ fontSize:11, color:'#B07D4A', background:'none', border:'none', cursor:'pointer', letterSpacing:'0.06em', fontWeight:500 }}>
                  COPY
                </button>
              </div>
            </div>

            {/* Earnings */}
            <div style={{ background:'#0A0A0A', borderRadius:12, padding:'24px' }}>
              <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300, color:'#fff', marginBottom:6 }}>Earnings</h3>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:20 }}>You earn 80% commission on every sale.</p>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:44, fontWeight:300, color:'#fff' }}>₹0</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:4 }}>Total earned</p>
              <a href="/dashboard/earnings" style={{ display:'inline-block', marginTop:20, padding:'9px 20px', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', fontSize:12, borderRadius:4, textDecoration:'none', letterSpacing:'0.04em' }}>
                View earnings →
              </a>
            </div>

            {/* Checklist */}
            <div style={{ background:'#FAFAF8', border:'0.5px solid #EBEBEB', borderRadius:12, padding:'24px' }}>
              <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300, color:'#0A0A0A', marginBottom:16 }}>Get started</h3>
              {checklist.map(item => (
                <div key={item.label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background: item.done ? '#B07D4A' : 'transparent', border:`1.5px solid ${item.done ? '#B07D4A' : '#D4D4D4'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {item.done && <span style={{ fontSize:9, color:'#fff', fontWeight:700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:13, color: item.done ? '#C4C4C4' : '#0A0A0A', textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </>
  )
}