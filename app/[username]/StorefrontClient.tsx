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
  const [menuOpen, setMenuOpen] = useState(false)

  const filtered = initialProducts.filter(p => {
    const catOk  = tab === 'ALL' || p.category === tab
    const srchOk = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
    return catOk && srchOk
  })

  const count = (t: string) => t === 'ALL' ? initialProducts.length : initialProducts.filter(p => p.category === t).length
  const initials = creator.display_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) ?? 'CK'

  return (
    <div style={{ background:'#F0EDE8', minHeight:'100vh', fontFamily:'DM Sans, system-ui, sans-serif', color:'#1a1a1a' }}>
      <link href="https://fonts.googleapis.com/css2?family=Fanwood+Text:ital@0;1&family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}

        /* ── Tab bar ── */
        .tab-bar{overflow-x:auto;white-space:nowrap;border-top:1px solid rgba(26,26,26,0.1);border-bottom:1px solid rgba(26,26,26,0.1);background:#F0EDE8;-webkit-overflow-scrolling:touch}
        .tab-bar::-webkit-scrollbar{display:none}
        .tab{display:inline-flex;align-items:center;gap:5px;padding:13px 18px;background:none;border:none;border-bottom:2px solid transparent;font-size:11px;font-weight:500;letter-spacing:0.09em;color:#3a3530;cursor:pointer;white-space:nowrap;font-family:inherit}
        .tab:hover{color:#1a1a1a}
        .tab.on{color:#1a1a1a;border-bottom-color:#8B1A1A;font-weight:600}
        .tab-n{font-size:10px;font-weight:400;color:#aaa}

        /* ── Product grid ── */
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}

        /* ── Product card ── */
        .card{background:#fff;overflow:hidden;transition:box-shadow 0.2s;text-decoration:none;color:inherit;display:block}
        .card:hover{box-shadow:0 8px 32px rgba(26,26,26,0.12)}
        .cimg{aspect-ratio:3/4;background:#E8E4DE;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .cimg img{width:100%;height:100%;object-fit:contain;padding:12px}
        .cph{font-family:'Fanwood Text',serif;font-size:64px;font-style:italic;color:rgba(26,26,26,0.12)}
        .cbody{padding:12px 14px 16px}
        .cbrand{font-size:9px;letter-spacing:0.13em;text-transform:uppercase;color:#aaa;margin-bottom:4px}
        .ctitle{font-size:13px;font-weight:500;color:#1a1a1a;line-height:1.4;margin-bottom:6px}
        .cprice{font-family:'Cormorant Garamond',serif;font-size:17px;color:#1a1a1a}
        .cbuy{display:block;margin:10px 14px 14px;padding:9px;background:#1a1a1a;color:#fff;font-size:11px;letter-spacing:0.08em;text-align:center;text-decoration:none;border:none;cursor:pointer;font-family:inherit;transition:background 0.15s}
        .cbuy:hover{background:#333}

        /* ── Search input ── */
        .search-input{padding:9px 16px;border:1px solid rgba(26,26,26,0.15);background:#fff;font-size:12px;outline:none;color:#1a1a1a;font-family:inherit}

        /* ── Mobile search bar (shown below nav on mobile) ── */
        .mobile-search{display:none;padding:12px 20px;background:#F0EDE8;border-bottom:1px solid rgba(26,26,26,0.1)}
        .mobile-search input{width:100%;padding:10px 14px;border:1px solid rgba(26,26,26,0.15);background:#fff;font-size:13px;outline:none;color:#1a1a1a;font-family:inherit}

        /* ── MOBILE BREAKPOINT ── */
        @media (max-width: 768px) {
          /* Nav */
          .nav-desktop-search { display: none !important }
          .mobile-search { display: block }
          .nav-wrap { padding: 16px 20px !important }
          .nav-logo { font-size: 22px !important }

          /* Bio section */
          .bio-wrap { padding: 20px 20px 16px !important; flex-direction: column !important; align-items: flex-start !important; gap: 12px !important }
          .bio-right { align-self: flex-start !important; text-align: left !important }
          .bio-name { font-size: 22px !important }
          .bio-meta { gap: 10px !important }
          .bio-avatar { width: 52px !important; height: 52px !important }

          /* Tabs */
          .tab-bar-inner { padding: 0 20px !important }
          .tab { padding: 12px 14px !important; font-size: 10px !important }

          /* Grid — 2 columns on mobile */
          .grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important }

          /* Grid padding */
          .grid-wrap { padding: 20px 16px 60px !important }

          /* Card tweaks for small screen */
          .cbody { padding: 8px 10px 10px !important }
          .ctitle { font-size: 12px !important }
          .cbrand { font-size: 8px !important }
          .cprice { font-size: 15px !important }
          .cbuy { margin: 6px 10px 10px !important; padding: 8px !important; font-size: 10px !important }

          /* Empty state */
          .empty-state { padding: 60px 20px !important }

          /* Footer */
          .footer-wrap { padding: 16px 20px !important; flex-direction: column !important; gap: 10px !important; align-items: flex-start !important }
        }

        @media (max-width: 480px) {
          /* Single column on very small phones */
          .grid { grid-template-columns: repeat(2, 1fr) !important }
          .bio-name { font-size: 20px !important }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav className="nav-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 48px', background:'#F0EDE8' }}>
        <a href="/" className="nav-logo" style={{ fontFamily:'Fanwood Text, serif', fontSize:26, fontWeight:400, color:'#1a1a1a', textDecoration:'none' }}>
          Curate<em style={{ fontStyle:'italic', color:'#8B1A1A' }}>Kin</em>
        </a>
        <div className="nav-desktop-search" style={{ display:'flex', alignItems:'center', gap:12 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="search-input"
            style={{ width:200 }}
          />
          {isOwner && (
            <a href="/dashboard/products"
              style={{ padding:'9px 18px', background:'#8B1A1A', color:'#fff', fontSize:11, letterSpacing:'0.08em', textDecoration:'none', fontWeight:600, whiteSpace:'nowrap' }}>
              + ADD PIECE
            </a>
          )}
        </div>
        {/* Mobile: show ADD PIECE if owner */}
        {isOwner && (
          <a href="/dashboard/products"
            className="mobile-add-btn"
            style={{ display:'none', padding:'8px 14px', background:'#8B1A1A', color:'#fff', fontSize:10, letterSpacing:'0.08em', textDecoration:'none', fontWeight:600 }}>
            + ADD
          </a>
        )}
      </nav>

      {/* ── Mobile search bar ── */}
      <div className="mobile-search">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products…"
        />
      </div>

      {/* ── Creator bio ── */}
      <div className="bio-wrap" style={{ padding:'32px 48px 24px', borderBottom:'1px solid rgba(26,26,26,0.1)', display:'flex', alignItems:'center', gap:20 }}>
        <div className="bio-avatar" style={{ width:64, height:64, borderRadius:'50%', background:'#D4B896', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
          {creator.avatar_url
            ? <img src={creator.avatar_url} alt={creator.display_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ fontFamily:'Fanwood Text, serif', fontSize:22, fontStyle:'italic', color:'#fff' }}>{initials}</span>
          }
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <h1 className="bio-name" style={{ fontFamily:'Fanwood Text, serif', fontSize:28, fontWeight:400, color:'#1a1a1a', marginBottom:4 }}>{creator.display_name}</h1>
          <div className="bio-meta" style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
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
        <div className="bio-right" style={{ textAlign:'right', flexShrink:0 }}>
          <span style={{ display:'block', fontFamily:'Cormorant Garamond, serif', fontSize:32, color:'#1a1a1a', lineHeight:1 }}>{initialProducts.length}</span>
          <span style={{ fontSize:9, letterSpacing:'0.14em', color:'#888', textTransform:'uppercase' }}>Pieces</span>
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="tab-bar">
        <div className="tab-bar-inner" style={{ display:'inline-flex', padding:'0 48px' }}>
          {CATS.filter(c => c !== 'WISHLIST').map(c => (
            <button key={c} className={`tab${tab === c ? ' on' : ''}`} onClick={() => setTab(c)}>
              {c} <span className="tab-n">{count(c)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Product grid ── */}
      <div className="grid-wrap" style={{ padding:'32px 48px 80px' }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ textAlign:'center', padding:'80px 20px' }}>
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

      {/* ── Footer ── */}
      <footer className="footer-wrap" style={{ borderTop:'1px solid rgba(26,26,26,0.1)', padding:'20px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#F0EDE8' }}>
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