'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { CATEGORY_SUBCATEGORIES, matchesProductCategory, STORE_CATEGORIES } from '@/lib/productCategories'

type Product = { id: string; title: string; brand: string; price: string; image: string; url: string; category: string; description?: string }
type Creator = { id: string; username: string; display_name: string; avatar_url?: string; city?: string; bio?: string; instagram_handle?: string; instagram_verified?: boolean; primary_platform?: string; primary_followers?: number }

function formatFollowers(n?: number) {
  if (!n) return ''
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}K`
  return String(n)
}

export default function StorefrontClient({ creator, initialProducts, isOwner }: { creator: Creator; initialProducts: Product[]; isOwner: boolean }) {
  const [tab, setTab]       = useState('ALL')
  const [subCategory, setSubCategory] = useState('')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [categoryPinned, setCategoryPinned] = useState(false)
  const categoryRailRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const loadSavedProducts = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('saved_products')
        .select('product_id')
        .eq('user_id', user.id)

      if (mounted && data) setSavedIds(new Set(data.map(row => row.product_id)))
    }

    loadSavedProducts()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const syncCategoryRail = () => {
      const rail = categoryRailRef.current
      if (!rail) return
      const navigationHeight = window.innerWidth <= 768 ? 128 : 64
      setCategoryPinned(window.scrollY + navigationHeight >= rail.offsetTop)
    }

    syncCategoryRail()
    window.addEventListener('scroll', syncCategoryRail, { passive:true })
    window.addEventListener('resize', syncCategoryRail)
    return () => {
      window.removeEventListener('scroll', syncCategoryRail)
      window.removeEventListener('resize', syncCategoryRail)
    }
  }, [])

  const toggleSaved = async (event: React.MouseEvent<HTMLButtonElement>, productId: string) => {
    event.preventDefault()
    event.stopPropagation()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.assign('/login')
      return
    }

    const wasSaved = savedIds.has(productId)
    setSavedIds(previous => {
      const next = new Set(previous)
      if (wasSaved) next.delete(productId)
      else next.add(productId)
      return next
    })

    const result = wasSaved
      ? await supabase.from('saved_products').delete().eq('user_id', user.id).eq('product_id', productId)
      : await supabase.from('saved_products').insert({ user_id: user.id, product_id: productId })

    if (result.error) {
      setSavedIds(previous => {
        const next = new Set(previous)
        if (wasSaved) next.add(productId)
        else next.delete(productId)
        return next
      })
    }
  }

  const filtered = initialProducts.filter(p => {
    const activeCategory = subCategory || tab
    const catOk  = activeCategory === 'ALL' || matchesProductCategory(p.category, activeCategory)
    const srchOk = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
    return catOk && srchOk
  })

  const count = (t: string) => t === 'ALL' ? initialProducts.length : initialProducts.filter(p => matchesProductCategory(p.category, t)).length
  const initials = creator.display_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) ?? 'CK'

  return (
    <div style={{ background:'#F0EDE8', minHeight:'100vh', fontFamily:'DM Sans, system-ui, sans-serif', color:'#1a1a1a' }}>
      <link href="https://fonts.googleapis.com/css2?family=Fanwood+Text:ital@0;1&family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .bio-name, .bio-text, .bio-meta a{overflow-wrap:break-word;word-break:break-word}

        /* ── Persistent storefront navigation ── */
        /* clip keeps the storefront from scrolling sideways without turning the page
           into a scroll container, which lets this header stay pinned to the viewport. */
        html:has(.storefront-header),body:has(.storefront-header){overflow-x:clip!important}
        .storefront-header{position:sticky;top:0;z-index:60;background:#F0EDE8}
        .nav-wrap{height:64px;padding:0 48px!important;border-bottom:1px solid rgba(26,26,26,0.1)}
        .category-sticky{position:sticky;top:64px;z-index:50;background:#fff}
        .category-sticky.is-pinned{box-shadow:0 2px 14px rgba(26,26,26,0.08)}

        /* ── Tab bar ── */
        .tab-bar{overflow-x:auto;white-space:nowrap;border-bottom:1px solid rgba(26,26,26,0.1);background:#fff;-webkit-overflow-scrolling:touch}
        .tab-bar::-webkit-scrollbar{display:none}
        .tab{display:inline-flex;align-items:center;gap:5px;padding:14px 18px;background:none;border:none;border-bottom:2px solid transparent;font-size:11px;font-weight:500;letter-spacing:0.09em;color:#7f7972;cursor:pointer;white-space:nowrap;font-family:inherit}
        .tab:hover{color:#1a1a1a}
        .tab.on{color:#1a1a1a;border-bottom-color:#1a1a1a;font-weight:600}
        .tab-n{font-size:10px;font-weight:400;color:#aaa}
        .makeup-subtabs{display:flex;gap:8px;overflow-x:auto;padding:10px 48px;background:#fff;border-bottom:1px solid rgba(26,26,26,0.1);-webkit-overflow-scrolling:touch}
        .makeup-subtabs::-webkit-scrollbar{display:none}
        .makeup-subtab{flex-shrink:0;border:1px solid rgba(26,26,26,0.16);background:#fff;color:#514b45;padding:7px 10px;font-size:10px;letter-spacing:0.04em;cursor:pointer;font-family:inherit}
        .makeup-subtab.on{background:#1a1a1a;border-color:#1a1a1a;color:#fff}

        /* ── Product grid ── */
        .grid-wrap{max-width:1600px;margin:0 auto}
        .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;background:rgba(26,26,26,0.1)}

        /* ── Product card ── */
        .card{position:relative;background:#fff;overflow:hidden;text-decoration:none;color:inherit;display:flex;flex-direction:column;min-width:0}
        .card-detail-link{display:flex;flex:1;flex-direction:column;color:inherit;text-decoration:none}
        .card:hover .ctitle{text-decoration:underline;text-underline-offset:3px}
        .cimg{aspect-ratio:4/5;background:#fff;position:relative;overflow:hidden}
        .cimg-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
        .cimg img{position:relative;z-index:1;width:100%;height:100%;object-fit:contain;object-position:center;padding:12px}
        .save-star{position:absolute;top:12px;right:12px;z-index:4;width:34px;height:34px;border:1px solid rgba(26,26,26,0.14);border-radius:50%;background:rgba(255,255,255,0.94);color:#8c867e;font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:color 0.15s,background 0.15s,transform 0.15s}
        .save-star:hover{background:#fff;color:#8B1A1A;transform:scale(1.04)}
        .save-star.saved{color:#8B1A1A}
        .cph{font-family:'Fanwood Text',serif;font-size:64px;font-style:italic;color:rgba(26,26,26,0.12)}
        .cbody{padding:16px 18px 20px;display:flex;flex-direction:column;height:158px}
        .ccurator{display:flex;align-items:center;gap:7px;min-width:0;margin-bottom:9px;color:#746d65;font-size:10px;line-height:1}
        .ccurator img,.ccurator-initials{width:20px;height:20px;flex:0 0 20px;border-radius:50%;object-fit:cover;background:#c8a47a}
        .ccurator-initials{display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Fanwood Text',serif;font-size:11px;font-style:italic}
        .ccurator span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cbrand{font-size:9px;letter-spacing:0.04em;color:#756e66;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .ctitle{font-size:14px;font-weight:500;color:#1a1a1a;line-height:1.35;margin-bottom:7px;height:2.7em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .cprice{font-family:'Cormorant Garamond',serif;font-size:18px;color:#8a847c;margin-top:auto}

        /* ── Search input ── */
        .search-input{height:40px;padding:0 16px;border:1px solid rgba(26,26,26,0.14);border-radius:999px;background:#fff;font-size:12px;outline:none;color:#1a1a1a;font-family:inherit;letter-spacing:0.01em}
        .search-input::placeholder{color:#8c867e}
        .search-input:focus{background:#fff;box-shadow:0 0 0 2px rgba(201,154,106,0.28)}
        .nav-discover{color:#514b45;font-size:11px;font-weight:500;letter-spacing:0.1em;text-decoration:none;white-space:nowrap}
        .nav-discover:hover{color:#1a1a1a}
        .wishlist-icon-link{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;color:#514b45;font-size:11px;letter-spacing:0.08em;text-decoration:none;white-space:nowrap}
        .wishlist-icon-link:hover{color:#1a1a1a}
        .wishlist-icon{width:16px;height:16px;display:block;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}

        /* ── Mobile search bar (shown below nav on mobile) ── */
        .mobile-search{display:none;padding:12px 20px;background:#F0EDE8;border-bottom:1px solid rgba(26,26,26,0.1)}
        .mobile-search input{width:100%;height:40px;padding:0 14px;border:1px solid rgba(26,26,26,0.14);border-radius:999px;background:#fff;font-size:13px;outline:none;color:#1a1a1a;font-family:inherit}

        /* ── MOBILE BREAKPOINT ── */
        @media (max-width: 768px) {
          .nav-desktop-search { display: none !important }
          .mobile-search { display: block }
          .nav-wrap { height:64px; padding:0 20px!important }
          .category-sticky { top:128px }
          .nav-logo { font-size: 24px !important }
          .nav-discover { font-size:10px;letter-spacing:0.08em }
          .bio-wrap { padding: 24px 20px 20px !important }
          .bio-name { font-size: 22px !important }
          .bio-meta { gap: 10px !important }
          .bio-avatar { width: 52px !important; height: 52px !important }
          .tab-bar-inner { padding: 0 20px !important }
          .tab { padding: 12px 14px !important; font-size: 10px !important }
          .makeup-subtabs { padding: 10px 20px !important }
          .grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0 !important }
          .grid-wrap { padding: 0 0 60px !important }
          .cbody { padding: 12px 12px 14px !important; height: 144px !important }
          .ctitle { font-size: 12px !important }
          .cbrand { font-size: 8px !important }
          .cprice { font-size: 15px !important }
          .ccurator { font-size: 9px !important; margin-bottom: 7px !important }
          .empty-state { padding: 60px 20px !important }
          .footer-wrap { padding: 16px 20px !important; flex-direction: column !important; gap: 10px !important; align-items: flex-start !important }
        }

        @media (min-width: 769px) and (max-width: 1100px) {
          .grid { grid-template-columns: repeat(3, minmax(0, 1fr)) }
        }

        @media (max-width: 480px) {
          .grid { grid-template-columns: repeat(2, 1fr) !important }
          .bio-name { font-size: 20px !important }
        }
      `}</style>

      {/* ── Nav ── */}
      <div className="storefront-header">
      <nav className="nav-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 48px', background:'#F0EDE8' }}>
        <a href="/" className="nav-logo" style={{ display:'inline-flex', alignItems:'baseline', fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:28, fontStyle:'italic', fontWeight:400, lineHeight:1, color:'#1a1a1a', textDecoration:'none', whiteSpace:'nowrap' }}>
          <span style={{ display:'inline-block' }}><span style={{ display:'inline-block', fontSize:'1.18em', lineHeight:.8 }}>C</span>urate</span><span style={{ display:'inline-block', color:'#C99A6A' }}><span style={{ display:'inline-block', fontSize:'1.18em', lineHeight:.8 }}>K</span>in</span>
        </a>
        <a href="/creators" className="nav-discover">CURATORS</a>
        <div className="nav-desktop-search" style={{ display:'flex', alignItems:'center', gap:12 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="search-input"
            style={{ width:300 }}
          />
          <a href="/wishlist" className="wishlist-icon-link" aria-label="Open wishlist">
            <svg className="wishlist-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 5h2l2.2 10.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.5L21.5 8H6" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            WISHLIST
          </a>
          {isOwner && (
            <a href="/dashboard"
              style={{ padding:'9px 18px', background:'#1a1a1a', color:'#fff', fontSize:11, letterSpacing:'0.08em', textDecoration:'none', fontWeight:600, whiteSpace:'nowrap' }}>
              + ADD PIECE
            </a>
          )}
        </div>
        {isOwner && (
          <a href="/dashboard"
            className="mobile-add-btn"
            style={{ display:'none', padding:'8px 14px', background:'#1a1a1a', color:'#fff', fontSize:10, letterSpacing:'0.08em', textDecoration:'none', fontWeight:600 }}>
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

      </div>

      {/* ── Creator bio ── */}
      <div className="bio-wrap" style={{ padding:'32px 48px 24px', borderBottom:'1px solid rgba(26,26,26,0.1)', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
        <div className="bio-avatar" style={{ width:64, height:64, borderRadius:'50%', background:'#D4B896', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', marginBottom:16 }}>
          {creator.avatar_url
            ? <img src={creator.avatar_url} alt={creator.display_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ fontFamily:'Fanwood Text, serif', fontSize:22, fontStyle:'italic', color:'#fff' }}>{initials}</span>
          }
        </div>
        <p style={{ fontSize:13, fontStyle:'italic', fontFamily:'Cormorant Garamond, serif', color:'#888', marginBottom:4 }}>Curated by</p>
        <h1 className="bio-name" style={{ fontFamily:'Fanwood Text, serif', fontSize:28, fontWeight:400, color:'#1a1a1a', marginBottom:10 }}>{creator.display_name}</h1>
        <div className="bio-meta" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, flexWrap:'wrap' }}>
          {creator.instagram_handle && (
            <a href={`https://instagram.com/${creator.instagram_handle}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize:12, color:'#888', textDecoration:'none' }}>@{creator.instagram_handle}</a>
          )}
          {creator.primary_followers && (
            <span style={{ fontSize:12, color:'#888' }}>{formatFollowers(creator.primary_followers)} followers</span>
          )}
        </div>
        {creator.bio && <p className="bio-text" style={{ fontSize:13, color:'#666', marginTop:8, lineHeight:1.6, maxWidth:500 }}>{creator.bio}</p>}
        <div className="bio-right" style={{ marginTop:16 }}>
          <span style={{ display:'block', fontFamily:'Cormorant Garamond, serif', fontSize:32, color:'#1a1a1a', lineHeight:1 }}>{initialProducts.length}</span>
          <span style={{ fontSize:9, letterSpacing:'0.14em', color:'#888', textTransform:'uppercase' }}>Pieces</span>
        </div>
      </div>

      {/* Category rail starts below the curator profile, then sticks beneath navigation. */}
      <div ref={categoryRailRef} className={`category-sticky${categoryPinned ? ' is-pinned' : ''}`}>
        <div className="tab-bar">
          <div className="tab-bar-inner" style={{ display:'inline-flex', padding:'0 48px' }}>
            {STORE_CATEGORIES.filter(c => c !== 'WISHLIST').map(c => (
              <button key={c} className={`tab${tab === c ? ' on' : ''}`} onClick={() => { setTab(c); setSubCategory('') }}>
                {c} <span className="tab-n">{count(c)}</span>
              </button>
            ))}
          </div>
        </div>

        {CATEGORY_SUBCATEGORIES[tab] && (
          <div className="makeup-subtabs" aria-label={`${tab} categories`}>
            <button onClick={() => setSubCategory('')} className={`makeup-subtab${!subCategory ? ' on' : ''}`}>All {tab.toLowerCase()} <span style={{ opacity:0.7 }}>{count(tab)}</span></button>
            {CATEGORY_SUBCATEGORIES[tab].map(category => {
              const value = `${tab} - ${category.toUpperCase()}`
              return <button key={category} onClick={() => setSubCategory(value)} className={`makeup-subtab${subCategory === value ? ' on' : ''}`}>{category} <span style={{ opacity:0.7 }}>{count(value)}</span></button>
            })}
          </div>
        )}
      </div>

      {/* ── Product grid ── */}
      <div className="grid-wrap" style={{ padding:'0 0 80px', background:'#fff' }}>
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
                <a href={`/product/${p.id}`} className="card-detail-link">
                  <div className="cimg">
                    <div className="cimg-fallback"><span className="cph">{p.title[0]}</span></div>
                    {p.image && (
                      <img src={p.image} alt={p.title}
                        onError={e => { e.currentTarget.style.display = 'none' }} />
                    )}
                  </div>
                  <div className="cbody">
                    <div className="ccurator">
                      {creator.avatar_url
                        ? <img src={creator.avatar_url} alt="" />
                        : <span className="ccurator-initials">{initials}</span>
                      }
                      <span>{creator.display_name}</span>
                    </div>
                    <p className="cbrand">{p.brand} <span aria-hidden="true">•</span> {p.category}</p>
                    <p className="ctitle">{p.title}</p>
                    <p className="cprice">{p.price}</p>
                  </div>
                </a>
                <button
                  type="button"
                  className={`save-star${savedIds.has(p.id) ? ' saved' : ''}`}
                  aria-label={savedIds.has(p.id) ? `Remove ${p.title} from wishlist` : `Save ${p.title} to wishlist`}
                  aria-pressed={savedIds.has(p.id)}
                  onClick={event => toggleSaved(event, p.id)}
                >
                  {savedIds.has(p.id) ? '★' : '☆'}
                </button>
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
          <a href="/" style={{ fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:14, fontStyle:'italic', color:'#bbb', textDecoration:'none' }}>Curate<span style={{ color:'#C99A6A' }}>Kin</span></a>
        </div>
      </footer>
    </div>
  )
}
