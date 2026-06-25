'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function StorefrontPage() {
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  const url = `curatekin.com/${profile?.username ?? '…'}`

  return (
    <>
      <div style={{ marginBottom:32 }}>
        <p style={{ fontSize:11, letterSpacing:'0.14em', color:'#B07D4A', marginBottom:8, textTransform:'uppercase' }}>Storefront</p>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color:'#141210' }}>Your public page</h1>
      </div>

      <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'28px', marginBottom:20 }}>
        <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'#141210', marginBottom:6 }}>Your storefront link</h2>
        <p style={{ fontSize:13, color:'#8C867E', marginBottom:16 }}>Share this with your followers. Anyone can browse and buy your curated products.</p>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1, padding:'12px 16px', background:'#F4F2EE', borderRadius:8, fontSize:14, color:'#141210', fontWeight:500 }}>{url}</div>
          <button onClick={() => navigator.clipboard.writeText(url)}
            style={{ padding:'12px 20px', background:'#141210', color:'#fff', border:'none', fontSize:12, borderRadius:8, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.06em' }}>
            COPY
          </button>
          <a href={`/${profile?.username}`} target="_blank" rel="noopener noreferrer"
            style={{ padding:'12px 20px', background:'none', border:'0.5px solid rgba(20,18,16,0.2)', color:'#141210', fontSize:12, borderRadius:8, textDecoration:'none', letterSpacing:'0.06em' }}>
            PREVIEW ↗
          </a>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'24px' }}>
          <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300, color:'#141210', marginBottom:12 }}>Status</h3>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', background:'rgba(176,125,74,0.08)', border:'0.5px solid rgba(176,125,74,0.25)', borderRadius:100 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#B07D4A' }} />
            <span style={{ fontSize:12, color:'#B07D4A', fontWeight:500 }}>Live</span>
          </div>
          <p style={{ fontSize:13, color:'#8C867E', marginTop:12 }}>Your storefront is public and visible to anyone with the link.</p>
        </div>
        <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'24px' }}>
          <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300, color:'#141210', marginBottom:12 }}>Customise</h3>
          <p style={{ fontSize:13, color:'#8C867E', marginBottom:16 }}>Update your bio, profile photo, and social links.</p>
          <a href="/dashboard/settings" style={{ fontSize:12, color:'#B07D4A', textDecoration:'none' }}>Go to settings →</a>
        </div>
      </div>
    </>
  )
}