'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type ClickData = {
  product_id: string
  title: string
  brand: string
  clicks: number
}

export default function AnalyticsPage() {
  const [clicks, setClicks]       = useState<ClickData[]>([])
  const [totalClicks, setTotal]   = useState(0)
  const [todayClicks, setToday]   = useState(0)
  const [weekClicks, setWeek]     = useState(0)
  const [loading, setLoading]     = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // clicks has no creator_id column (only product_id — see the insert
      // in app/r/[productId]/route.ts), so ownership has to be established
      // via this creator's own products, not a direct filter on clicks.
      const { data: products } = await supabase
        .from('storefront_products')
        .select('id, title, brand')
        .eq('creator_id', user.id)

      const productIds = (products ?? []).map(p => p.id)
      if (productIds.length === 0) {
        setClicks([]); setTotal(0); setToday(0); setWeek(0)
        setLoading(false)
        return
      }
      const productInfo = new Map((products ?? []).map(p => [p.id, { title: p.title, brand: p.brand }]))

      // The canonical, actually-populated click log — same table the
      // redirect route writes to. public.clicks columns: id, product_id,
      // clicked_at (no created_at) — clicked_at is set by a table default,
      // not explicitly on insert.
      const { data: clickData } = await supabase
        .from('clicks')
        .select('product_id, clicked_at')
        .in('product_id', productIds)

      if (clickData) {
        // Count clicks per product
        const counts: Record<string, ClickData> = {}
        clickData.forEach(c => {
          if (!counts[c.product_id]) {
            const info = productInfo.get(c.product_id)
            counts[c.product_id] = {
              product_id: c.product_id,
              title: info?.title ?? 'Unknown',
              brand: info?.brand ?? '',
              clicks: 0,
            }
          }
          counts[c.product_id].clicks++
        })
        const sorted = Object.values(counts).sort((a, b) => b.clicks - a.clicks)
        setClicks(sorted)
        setTotal(clickData.length)

        const today = new Date()
        today.setHours(0,0,0,0)
        setToday(clickData.filter(c => c.clicked_at && new Date(c.clicked_at) >= today).length)

        const week = new Date()
        week.setDate(week.getDate() - 7)
        setWeek(clickData.filter(c => c.clicked_at && new Date(c.clicked_at) >= week).length)
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ padding:60, textAlign:'center', fontFamily:'Cormorant Garamond, serif', fontSize:22, color:'#C4BEB6', fontStyle:'italic' }}>
      Loading analytics…
    </div>
  )

  return (
    <>
      <div style={{ marginBottom:32 }}>
        <p style={{ fontSize:11, letterSpacing:'0.14em', color:'#B07D4A', marginBottom:8, textTransform:'uppercase' }}>Analytics</p>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color:'#141210' }}>Performance</h1>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
        {[
          { label:'Total clicks',    value: totalClicks, sub:'All time'    },
          { label:'Clicks this week',value: weekClicks,  sub:'Last 7 days' },
          { label:'Clicks today',    value: todayClicks, sub:'Today'       },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'24px 20px' }}>
            <p style={{ fontSize:10, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:12 }}>{s.label}</p>
            <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:40, fontWeight:300, color:'#141210', lineHeight:1 }}>{s.value}</p>
            <p style={{ fontSize:11, color:'#C4BEB6', marginTop:6 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Top products */}
      <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:14, padding:'28px', marginBottom:20 }}>
        <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'#141210', marginBottom:24 }}>
          Top products by clicks
        </h2>

        {clicks.length === 0 ? (
          <div style={{ padding:'40px 0', textAlign:'center', borderTop:'0.5px solid rgba(20,18,16,0.07)' }}>
            <p style={{ fontSize:13, color:'#C4BEB6', marginBottom:8 }}>No clicks yet.</p>
            <p style={{ fontSize:12, color:'#C4BEB6' }}>Share your storefront link to start getting clicks.</p>
          </div>
        ) : (
          <div style={{ borderTop:'0.5px solid rgba(20,18,16,0.07)' }}>
            {clicks.map((p, i) => (
              <div key={p.product_id} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 0', borderBottom:'0.5px solid rgba(20,18,16,0.05)' }}>
                <span style={{ fontSize:12, color:'#C4BEB6', width:20, flexShrink:0 }}>#{i+1}</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:500, color:'#141210', marginBottom:2 }}>{p.title}</p>
                  <p style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'#C4BEB6' }}>{p.brand}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, color:'#141210' }}>{p.clicks}</span>
                  <span style={{ fontSize:10, color:'#C4BEB6', display:'block', marginTop:2 }}>clicks</span>
                </div>
                {/* Bar */}
                <div style={{ width:100, height:4, background:'#F4F2EE', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'#B07D4A', borderRadius:2, width:`${Math.min(100, (p.clicks / (clicks[0]?.clicks || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share your link */}
      <div style={{ background:'#141210', borderRadius:14, padding:'28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'#fff', marginBottom:6 }}>
            Get more clicks
          </h3>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>
            Share your storefront link on Instagram, WhatsApp, and other platforms.
          </p>
        </div>
        <a href="/dashboard/storefront"
          style={{ padding:'11px 24px', background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:12, textDecoration:'none', borderRadius:100, letterSpacing:'0.06em', whiteSpace:'nowrap', marginLeft:24 }}>
          View storefront →
        </a>
      </div>
    </>
  )
}