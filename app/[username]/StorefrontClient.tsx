'use client'

import { useState } from 'react'

const CATS = ['ALL','APPAREL','COATS & OUTERWEAR','FOOTWEAR','BAGS & PURSES','JEWELRY & WATCHES','MAKEUP','SKINCARE','HAIRCARE','WISHLIST']

type Product = { id: string; title: string; brand: string; price: string; image: string; url: string; category: string }
type Creator = { id: string; username: string; display_name: string; avatar_url?: string; city?: string; bio?: string; instagram_handle?: string; instagram_verified?: boolean; primary_platform?: string; primary_followers?: number }

function formatFollowers(n?: number) {
  if (!n) return ''
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}K`
  return String(n)
}

export default function StorefrontClient({ creator, initialProducts, isOwner }: { creator: Creator; initialProducts: Product[]; isOwner: boolean }) {
  const [tab, setTab]       = useState('ALL')
  const [search, setSearch] = useState('')

  const filtered = initialProducts.filter(p => {
    const catOk  = tab === 'ALL' || p.category === tab
    const srchOk = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
    return catOk && srchOk
  })

  const count = (t: string) => t === 'ALL' ? initialProducts.length : initialProducts.filter(p => p.category === t).length
  const initials = creator.display_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) ?? 'CK'

  return (
    <div style={{ background:'#F0EDE8', minHeight:'100vh', fontFamily:'DM Sans, system-ui, sans-serif', color:'#1a1a1a' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .tab-bar{overflow-x:auto;white-space:nowrap;border-top:1px solid rgba(26,26,26,0.1);border-bottom:1px solid rgba(26,26,26,0.1);background:#F0EDE8}
        .tab-bar::-webkit-scrollbar{display:none}
        .tab{display:inline-flex;align-items:center;gap:5px;padding:13px 18px;background:none;border:none;border-bottom:2px solid transparent;font-size:11px;font-weight:500;letter-spacing:0.09em;color:#3a3530;cursor:pointer;white-space:nowrap;font-family:inherit}
        .tab:hover{color:#1a1a1a}
        .tab.on{color:#1a1a1a;border-bottom-color:#8B1A1A;font-weight:600}
        .tab-n{font-size:10px;font-weight:400;color:#aaa}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
        .card{background:#fff;overflow:hidden;transition:box-shadow 0.2s;text-decoration:none;color:inherit;display:block}
        .card:hover{box-shadow:0 8px 32px rgba(26,26,26,0.12)}
        .cimg{aspect-ratio:3/4;background:#E8E4DE;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .cimg img{width:100%;height:100%;object-fit:contain;padding:12px}
        .cph{font-family:'Cormorant Garamond',serif;font-size:64px;font-style:italic;color:rgba(26,26,26,0.12)}
        .cbody{padding:12px 14px 16px}
        .cbrand{font-size:9px;letter-spacing:0.13em;text-transform:uppercase;color:#aaa;margin-bottom:4px}
        .ctitle{font-size:13px;font-weight:500;color:#1a1a1a;line-height:1.4;margin-bottom:6px}
        .cprice{font-family:'Cormorant Garamond',serif;font-size:17px;color:#1a1a1a}
        .cbuy{display:block;margin:10px 14px 14px;padding:9px;background:#1a1a1a;color:#fff;font-size:11px;letter-spacing:0.08em;text-align:center;text-decoration:none;border:none;cursor:pointer;font-family:inherit;transition:background 0.15s}
        .cbuy:hover{background:#333}
      `}</style>

      {/* Nav */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 48px', background:'#F0EDE8' }}>
        <a href="/" style={{ fontFamily:'Cormorant Garamond, serif', fontSize:26, fontWeight:400, color:'#1a1a1a', textDecoration:'none' }}>
          Curate<em style={{ fontStyle:'italic', color:'#8B1A1A' }}>Kin</em>
        </a>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            style={{ padding:'9px 16px', border:'1px solid rgba(26,26,26,0.15)', background:'#fff', fontSize:12, outline:'none', color:'#1a1a1a', width:200, fontFamily:'inherit' }} />
          {isOwner && (
            <a href="/dashboard/products"
              style={{ padding:'9px 18px', background:'#8B1A1A', color:'#fff', fontSize:11, letterSpacing:'0.08em', textDecoration:'none', fontWeight:600 }}>
              + ADD PIECE
            </a>
          )}
        </div>
      </nav>

      {/* Creator bio */}
      <div style={{ padding:'32px 48px 24px', borderBottom:'1px solid rgba(26,26,26,0.1)', display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#D4B896', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
          {creator.avatar_url
            ? <img src={creator.avatar_url} alt={creator.display_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontStyle:'italic', color:'#fff' }}>{initials}</span>
          }
        </div>
        <div style={{ flex:1 }}>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:28, fontWeight:400, color:'#1a1a1a', marginBottom:4 }}>{creator.display_name}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            {creator.city && <span style={{ fontSize:12, color:'#888' }}>{creator.city}</span>}
            {creator.instagram_handle && (
              <a href={`https://instagram.com/${creator.instagram_handle}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:12, color:'#888', textDecoration:'none' }}>@{creator.instagram_handle}</a>
            )}
            {creator.primary_followers && (
              <span style={{ fontSize:12, color:'#888' }}>{formatFollowers(creator.primary_followers)} followers</span>
            )}
          </div>
          {creator.bio && <p style={{ fontSize:13, color:'#666', marginTop:8, lineHeight:1.6, maxWidth:500 }}>{creator.bio}</p>}
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <span style={{ display:'block', fontFamily:'Cormorant Garamond, serif', fontSize:32, color:'#1a1a1a', lineHeight:1 }}>{initialProducts.length}</span>
          <span style={{ fontSize:9, letterSpacing:'0.14em', color:'#888', textTransform:'uppercase' }}>Pieces</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="tab-bar">
        <div style={{ display:'inline-flex', padding:'0 48px' }}>
          {CATS.filter(c => c !== 'WISHLIST').map(c => (
            <button key={c} className={`tab${tab === c ? ' on' : ''}`} onClick={() => setTab(c)}>
              {c} <span className="tab-n">{count(c)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding:'32px 48px 80px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:28, fontWeight:400, color:'#1a1a1a', marginBottom:8 }}>
              {initialProducts.length === 0 ? 'Collection coming soon.' : 'Nothing here yet.'}
            </p>
            <p style={{ fontSize:13, color:'#aaa' }}>
              {initialProducts.length === 0 ? `${creator.display_name} is still curating.` : 'Try a different category.'}
            </p>
          </div>
        ) : (
          <div className="grid">
            {filtered.map(p => (
              <div key={p.id} className="card">
                <div className="cimg">
                  {p.image ? <img src={p.image} alt={p.title} /> : <div className="cph">{p.title[0]}</div>}
                </div>
                <div className="cbody">
                  <p className="cbrand">{p.brand}</p>
                  <p className="ctitle">{p.title}</p>
                  <p className="cprice">{p.price}</p>
                </div>
                <a href={`/r/${p.id}`} target="_blank" rel="noopener noreferrer" className="cbuy">
                  SHOP NOW
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(26,26,26,0.1)', padding:'20px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#F0EDE8' }}>
        <p style={{ fontSize:11, color:'#bbb' }}>
          {creator.display_name} earns commission on purchases.{' '}
          <a href="/affiliate-policy" style={{ color:'#bbb', textDecoration:'underline' }}>Learn more</a>
        </p>
        <div style={{ display:'flex', gap:20 }}>
          <a href="/terms" style={{ fontSize:11, color:'#bbb', textDecoration:'none' }}>Terms</a>
          <a href="/privacy" style={{ fontSize:11, color:'#bbb', textDecoration:'none' }}>Privacy</a>
          <a href="/" style={{ fontSize:11, color:'#bbb', textDecoration:'none' }}>CurateKin</a>
        </div>
      </footer>
    </div>
  )
}