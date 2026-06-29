'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const CATS = ['ALL','APPAREL','COATS & OUTERWEAR','FOOTWEAR','BAGS & PURSES','JEWELRY & WATCHES','MAKEUP','SKINCARE','HAIRCARE','WISHLIST']

type Product = {
  id: string; title: string; brand: string; price: string;
  image_url: string; product_url: string; category: string
}

export default function DashboardHome() {
  const [profile,  setProfile]  = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [tab,      setTab]      = useState('ALL')
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProfile({ display_name:'Navya Singhal', username:'navya' })
        setLoading(false); return
      }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const { data: prods } = await supabase
        .from('storefront_products')
        .select('id,title,brand,price,image_url,product_url,category')
        .eq('creator_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
      setProducts(prods ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = products.filter(p => {
    const catOk  = tab === 'ALL' || p.category === tab
    const srchOk = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
    return catOk && srchOk
  })

  const count = (t: string) => t === 'ALL' ? products.length : products.filter(p => p.category === t).length

  const totalValue = products.reduce((sum, p) => {
    const num = parseFloat(p.price?.replace(/[^0-9.]/g,'') ?? '0')
    return sum + (isNaN(num) ? 0 : num)
  }, 0)

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .cat-tab { background:none; border:none; border-bottom:2px solid transparent; padding:14px 16px; font-size:11px; font-weight:500; letter-spacing:0.08em; color:#9B9B9B; cursor:pointer; white-space:nowrap; font-family:inherit; transition:all 0.15s; }
        .cat-tab:hover { color:#0A0A0A; }
        .cat-tab.on { color:#0A0A0A; border-bottom-color:#0A0A0A; }
        .cat-tab.wishlist { color:#C53030; }
        .cat-tab.wishlist.on { border-bottom-color:#C53030; }
        .prod-card { background:#fff; border:0.5px solid #EBEBEB; overflow:hidden; cursor:pointer; transition:box-shadow 0.2s; position:relative; }
        .prod-card:hover { box-shadow:0 8px 32px rgba(0,0,0,0.08); }
        .prod-card:hover .heart-btn { opacity:1; }
        .heart-btn { position:absolute; top:10px; right:10px; width:28px; height:28px; border-radius:50%; background:#fff; border:0.5px solid #EBEBEB; display:flex; align-items:center; justify-content:center; font-size:12px; cursor:pointer; opacity:0; transition:opacity 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
        .search-input { background:#1A1A1A; border:0.5px solid rgba(255,255,255,0.15); color:#fff; padding:10px 16px; font-size:13px; outline:none; font-family:inherit; width:280px; }
        .search-input::placeholder { color:rgba(255,255,255,0.35); }
        .add-btn { background:#fff; color:#0A0A0A; border:none; padding:10px 24px; font-size:13px; font-weight:500; cursor:pointer; font-family:inherit; letter-spacing:0.04em; white-space:nowrap; }
        .add-btn:hover { background:#F0F0F0; }
      `}</style>

      {/* Sub-header — dark, "Atelier" style */}
      <div style={{ background:'#0A0A0A', padding:'20px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color:'#fff', fontStyle:'italic', letterSpacing:'-0.01em' }}>
          Atelier
        </h1>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <input
            className="search-input"
            placeholder="Search your closet"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <a href="/dashboard/products" className="add-btn">+ ADD PIECE</a>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ borderBottom:'0.5px solid #EBEBEB', background:'#fff', overflowX:'auto', display:'flex', padding:'0 40px' }}>
        {CATS.map(c => (
          <button
            key={c}
            onClick={() => setTab(c)}
            className={`cat-tab${tab === c ? ' on' : ''}${c === 'WISHLIST' ? ' wishlist' : ''}`}>
            {c === 'WISHLIST' && <span style={{ marginRight:4 }}>♥</span>}
            {c} <span style={{ fontSize:10, opacity:0.6, marginLeft:4 }}>{count(c)}</span>
          </button>
        ))}
      </div>

      {/* Content area */}
      <div style={{ background:'#F8F6F2', minHeight:'calc(100vh - 180px)', padding:'40px' }}>

        {/* Collection header */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:40 }}>
          <div>
            <p style={{ fontSize:10, letterSpacing:'0.16em', color:'#B07D4A', textTransform:'uppercase', marginBottom:8 }}>
              YOUR WARDROBE, CURATED
            </p>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:clamp(48), fontWeight:300, color:'#0A0A0A', lineHeight:1 }}>
              The Collection
            </h2>
          </div>
          <div style={{ display:'flex', gap:48, textAlign:'right' }}>
            <div>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:300, color:'#0A0A0A', lineHeight:1 }}>{products.length}</p>
              <p style={{ fontSize:10, letterSpacing:'0.1em', color:'#9B9B9B', marginTop:4, textTransform:'uppercase' }}>Pieces</p>
            </div>
            <div>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:300, color:'#0A0A0A', lineHeight:1 }}>
                ₹{totalValue.toLocaleString('en-IN')}
              </p>
              <p style={{ fontSize:10, letterSpacing:'0.1em', color:'#9B9B9B', marginTop:4, textTransform:'uppercase' }}>Closet Value</p>
            </div>
            <div>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:300, color:'#0A0A0A', lineHeight:1 }}>0</p>
              <p style={{ fontSize:10, letterSpacing:'0.1em', color:'#9B9B9B', marginTop:4, textTransform:'uppercase' }}>Wishlisted</p>
            </div>
          </div>
        </div>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontStyle:'italic', color:'rgba(0,0,0,0.12)', marginBottom:16 }}>
              {products.length === 0 ? 'Your closet is empty.' : 'Nothing in this category.'}
            </p>
            <p style={{ fontSize:13, color:'#9B9B9B', marginBottom:24 }}>
              {products.length === 0 ? 'Start curating products you love.' : 'Try a different category.'}
            </p>
            {products.length === 0 && (
              <a href="/dashboard/products" style={{ display:'inline-block', padding:'12px 28px', background:'#0A0A0A', color:'#fff', fontSize:12, letterSpacing:'0.08em', textDecoration:'none' }}>
                + ADD YOUR FIRST PIECE
              </a>
            )}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {filtered.map(p => (
              <div key={p.id} className="prod-card">
                <button className="heart-btn">♡</button>
                <div style={{ aspectRatio:'1/1', background:'#F0EDE8', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:40, fontStyle:'italic', color:'rgba(0,0,0,0.1)' }}>{p.title?.[0]}</span>
                  }
                </div>
                <div style={{ padding:'12px 14px 14px' }}>
                  <p style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'#9B9B9B', marginBottom:4 }}>{p.brand}</p>
                  <p style={{ fontSize:13, fontWeight:500, color:'#0A0A0A', lineHeight:1.4, marginBottom:6 }}>{p.title}</p>
                  <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16, color:'#0A0A0A' }}>{p.price}</p>
                </div>
                <a href={`/r/${p.id}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', margin:'0 14px 14px', padding:'8px', background:'#0A0A0A', color:'#fff', fontSize:10, letterSpacing:'0.1em', textAlign:'center', textDecoration:'none' }}>
                  SHOP NOW
                </a>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  )
}

function clamp(max: number): number { return max }