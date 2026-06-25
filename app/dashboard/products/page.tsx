'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  'ALL', 'APPAREL', 'COATS & OUTERWEAR', 'FOOTWEAR',
  'BAGS & PURSES', 'JEWELRY & WATCHES', 'MAKEUP', 'SKINCARE', 'HAIRCARE', 'WISHLIST'
]

type Product = {
  id: string
  title: string
  brand: string
  price: string
  image_url: string
  product_url: string
  category: string
  description?: string
  wishlisted?: boolean
}

// ── Add Piece Modal ───────────────────────────────────────────────
function AddPieceModal({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (p: Product) => void
}) {
  const [url, setUrl]         = useState('')
  const [preview, setPreview] = useState<any>(null)
  const [category, setCategory] = useState('SKINCARE')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const fetchPreview = async () => {
    if (!url.trim()) return
    setLoading(true); setError(''); setPreview(null)
    try {
      const res = await fetch('/api/product/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not fetch product')
      setPreview(data)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    if (!preview) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setSaving(false); return }

    const { data, error: dbErr } = await supabase
      .from('storefront_products')
      .insert({
        creator_id:  user.id,
        title:       preview.title,
        brand:       preview.brand || '',
        price:       preview.price || '',
        image_url:   preview.image || '',
        product_url: preview.url || url,
        category,
        description: preview.description || '',
        active:      true,
      })
      .select()
      .single()

    if (dbErr) { setError(dbErr.message); setSaving(false); return }
    onAdd(data)
    onClose()
  }

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:'#fff', width:'100%', maxWidth:520, display:'flex', flexDirection:'column', maxHeight:'90vh', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'24px 28px 0' }}>
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, fontWeight:400, color:'#141210' }}>Add a piece</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:26, color:'#aaa', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding:'16px 28px 0', overflowY:'auto', flex:1 }}>
          <p style={{ fontSize:12, color:'#8C867E', marginBottom:14, lineHeight:1.6 }}>
            Paste any product link — Nykaa, Amazon, Myntra, and more. We'll pull the details automatically.
          </p>
          <div style={{ display:'flex', marginBottom:12 }}>
            <input
              ref={inputRef}
              value={url}
              onChange={e => { setUrl(e.target.value); setPreview(null); setError('') }}
              onKeyDown={e => e.key === 'Enter' && fetchPreview()}
              placeholder="https://www.nykaa.com/product/..."
              style={{ flex:1, padding:'11px 14px', border:'1px solid #ddd', borderRight:'none', fontSize:13, outline:'none', fontFamily:'DM Sans, sans-serif', color:'#141210' }}
            />
            <button
              onClick={fetchPreview}
              disabled={loading || !url.trim()}
              style={{ padding:'11px 20px', background:'#141210', color:'#fff', border:'none', fontSize:12, cursor:'pointer', letterSpacing:'0.06em', opacity: loading || !url.trim() ? 0.5 : 1, fontFamily:'DM Sans, sans-serif' }}
            >
              {loading ? '...' : 'Preview'}
            </button>
          </div>

          {error && <p style={{ fontSize:12, color:'#c0392b', marginBottom:12 }}>{error}</p>}

          {preview && (
            <div style={{ border:'1px solid #eee', display:'flex', gap:14, padding:14, background:'#FAFAF8' }}>
              <div style={{ width:88, height:108, background:'#F4F2EE', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                {preview.image
                  ? <img src={preview.image} alt={preview.title} style={{ width:'100%', height:'100%', objectFit:'contain', padding:6 }} />
                  : <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:28, fontStyle:'italic', color:'#C4BEB6' }}>{preview.brand?.[0] ?? '?'}</span>
                }
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'#C4BEB6', marginBottom:3 }}>{preview.brand}</p>
                <p style={{ fontSize:13, fontWeight:500, color:'#141210', marginBottom:5, lineHeight:1.3 }}>{preview.title}</p>
                {preview.price && <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:16, color:'#141210', marginBottom:10 }}>{preview.price}</p>}
                <label style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#8C867E', display:'block', marginBottom:4 }}>Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width:'100%', padding:'7px 10px', border:'1px solid #ddd', fontSize:12, fontFamily:'DM Sans, sans-serif', background:'#fff', color:'#141210', outline:'none' }}
                >
                  {CATEGORIES.filter(c => c !== 'ALL' && c !== 'WISHLIST').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', padding:'14px 28px 22px', borderTop:'1px solid #eee', marginTop:14 }}>
          <button onClick={onClose} style={{ padding:'10px 20px', background:'none', border:'1px solid #ddd', fontSize:12, cursor:'pointer', color:'#8C867E', fontFamily:'DM Sans, sans-serif' }}>
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!preview || saving}
            style={{ padding:'10px 24px', background:'#B07D4A', color:'#fff', border:'none', fontSize:12, cursor:'pointer', letterSpacing:'0.06em', fontFamily:'DM Sans, sans-serif', opacity: !preview || saving ? 0.4 : 1 }}
          >
            {saving ? 'Adding...' : 'Add to collection'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState('ALL')
  const [search, setSearch]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading]   = useState(true)
  const supabase = createClient()
  const router   = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('storefront_products')
        .select('*')
        .eq('creator_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
      setProducts(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const tabCount = (tab: string) => {
    if (tab === 'ALL')      return products.length
    if (tab === 'WISHLIST') return products.filter(p => p.wishlisted).length
    return products.filter(p => p.category === tab).length
  }

  const filtered = products.filter(p => {
    const catOk  = activeTab === 'ALL' || (activeTab === 'WISHLIST' ? p.wishlisted : p.category === activeTab)
    const srchOk = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
    return catOk && srchOk
  })

  const totalValue = products.reduce((sum, p) => {
    const n = parseFloat(p.price.replace(/[^0-9.]/g, ''))
    return sum + (isNaN(n) ? 0 : n)
  }, 0)

  const toggleWishlist = async (id: string) => {
    const p = products.find(x => x.id === id)
    if (!p) return
    const next = !p.wishlisted
    setProducts(prev => prev.map(x => x.id === id ? { ...x, wishlisted: next } : x))
    await supabase.from('storefront_products').update({ wishlisted: next }).eq('id', id)
  }

  const removeProduct = async (id: string) => {
    if (!confirm('Remove this product from your collection?')) return
    await supabase.from('storefront_products').update({ active: false }).eq('id', id)
    setProducts(prev => prev.filter(x => x.id !== id))
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', fontFamily:'Cormorant Garamond, serif', fontSize:22, color:'#C4BEB6', fontStyle:'italic' }}>
      Loading your collection…
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .tab-bar { overflow-x: auto; white-space: nowrap; border-top: 0.5px solid rgba(20,18,16,0.1); border-bottom: 0.5px solid rgba(20,18,16,0.1); background: #FAFAF8; }
        .tab-bar::-webkit-scrollbar { display: none; }
        .tab-btn { display: inline-flex; align-items: center; gap: 5px; padding: 13px 18px; background: none; border: none; border-bottom: 2px solid transparent; font-size: 11px; font-weight: 500; letter-spacing: 0.09em; color: #3a3530; cursor: pointer; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
        .tab-btn:hover { color: #141210; }
        .tab-btn.active { color: #141210; border-bottom-color: #B07D4A; font-weight: 600; }
        .tab-btn.wl { color: #B07D4A; }
        .tab-count { font-size: 10px; font-weight: 400; color: #C4BEB6; }
        .tab-btn.wl .tab-count { color: #B07D4A; opacity: 0.65; }
        .product-card { background: #fff; border: 0.5px solid rgba(20,18,16,0.07); overflow: hidden; transition: box-shadow 0.2s; }
        .product-card:hover { box-shadow: 0 8px 32px rgba(20,18,16,0.1); }
        .card-img { aspect-ratio: 3/4; background: #F4F2EE; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .card-img img { width: 100%; height: 100%; object-fit: contain; padding: 12px; }
        .card-ph { font-family: 'Cormorant Garamond', serif; font-size: 64px; font-style: italic; color: rgba(20,18,16,0.1); }
        .card-heart { position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.95); border: 0.5px solid rgba(20,18,16,0.12); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px; color: #C4BEB6; z-index: 2; transition: all 0.15s; }
        .card-heart:hover { color: #B07D4A; }
        .card-heart.on { background: #B07D4A; border-color: #B07D4A; color: #fff; }
        .card-remove { position: absolute; top: 10px; left: 10px; width: 26px; height: 26px; border-radius: 50%; background: rgba(255,255,255,0.9); border: 0.5px solid rgba(20,18,16,0.12); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #C4BEB6; z-index: 2; opacity: 0; transition: opacity 0.15s; }
        .product-card:hover .card-remove { opacity: 1; }
        .card-remove:hover { color: #c0392b; border-color: #c0392b; }
        .card-body { padding: 12px 14px 16px; }
        .card-brand { font-size: 9px; letter-spacing: 0.13em; text-transform: uppercase; color: #C4BEB6; margin-bottom: 4px; }
        .card-title { font-size: 13px; font-weight: 500; color: #141210; line-height: 1.4; margin-bottom: 6px; }
        .card-price { font-family: 'Cormorant Garamond', serif; font-size: 17px; color: #141210; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
        <div>
          <p style={{ fontSize:11, letterSpacing:'0.14em', color:'#B07D4A', marginBottom:4, textTransform:'uppercase' }}>My Collection</p>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:28, fontWeight:300, color:'#141210' }}>Products</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ padding:'11px 24px', background:'#141210', color:'#fff', border:'none', fontSize:12, letterSpacing:'0.1em', cursor:'pointer', fontWeight:500, fontFamily:'DM Sans, sans-serif' }}
        >
          + ADD PIECE
        </button>
      </div>

      {/* ── Atelier card ── */}
      <div style={{ background:'#FAFAF8', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:16, overflow:'hidden', marginBottom:0 }}>

        {/* Nav inside card */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 32px', borderBottom:'0.5px solid rgba(20,18,16,0.07)' }}>
          <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:26, fontWeight:400, color:'#141210' }}>Atelier</span>
          <div style={{ display:'flex', alignItems:'stretch', gap:0 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your closet"
              style={{ padding:'9px 16px', border:'0.5px solid rgba(20,18,16,0.15)', borderRight:'none', background:'#fff', fontSize:12, outline:'none', color:'#141210', width:220, fontFamily:'DM Sans, sans-serif' }}
            />
            <button
              onClick={() => setShowModal(true)}
              style={{ padding:'9px 20px', background:'#8B1A1A', color:'#fff', border:'none', fontSize:11, letterSpacing:'0.1em', cursor:'pointer', fontWeight:600, fontFamily:'DM Sans, sans-serif', whiteSpace:'nowrap' }}
            >
              + ADD PIECE
            </button>
          </div>
        </div>

        {/* Category tabs — single scrollable row */}
        <div className="tab-bar">
          <div style={{ display:'inline-flex', padding:'0 32px' }}>
            {CATEGORIES.map(cat => {
              const isWl     = cat === 'WISHLIST'
              const isActive = activeTab === cat
              return (
                <button
                  key={cat}
                  className={`tab-btn${isActive ? ' active' : ''}${isWl ? ' wl' : ''}`}
                  onClick={() => setActiveTab(cat)}
                >
                  {isWl ? '♥ WISHLIST' : cat}
                  <span className="tab-count">{tabCount(cat)}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Hero */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'40px 32px 24px', borderBottom:'0.5px solid rgba(20,18,16,0.07)' }}>
          <div>
            <p style={{ fontSize:10, letterSpacing:'0.18em', color:'#8B1A1A', marginBottom:12, fontWeight:600, textTransform:'uppercase' }}>
              Your wardrobe, curated
            </p>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'clamp(56px, 7vw, 88px)', fontWeight:400, lineHeight:0.9, color:'#141210', letterSpacing:'-0.03em' }}>
              The Collection
            </h2>
          </div>
          <div style={{ display:'flex', gap:48, alignItems:'flex-end', paddingBottom:6 }}>
            {[
              { n: products.length,                                                       l: 'PIECES'       },
              { n: `₹${Math.round(totalValue).toLocaleString('en-IN')}`,                 l: 'CLOSET VALUE' },
              { n: products.filter(p => p.wishlisted).length,                            l: 'WISHLISTED'   },
            ].map(s => (
              <div key={s.l} style={{ textAlign:'right' }}>
                <span style={{ display:'block', fontFamily:'Cormorant Garamond, serif', fontSize:34, fontWeight:400, color:'#141210', lineHeight:1 }}>{s.n}</span>
                <span style={{ display:'block', fontSize:9, letterSpacing:'0.15em', color:'#8C867E', marginTop:5, textTransform:'uppercase' }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ padding:'28px 32px 40px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'64px 20px' }}>
              <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:56, fontStyle:'italic', color:'rgba(20,18,16,0.07)', marginBottom:16 }}>Pk</div>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:300, color:'#141210', marginBottom:8 }}>
                {products.length === 0 ? 'Your collection is empty.' : 'Nothing here yet.'}
              </p>
              <p style={{ fontSize:13, color:'#C4BEB6', marginBottom:24 }}>
                {products.length === 0 ? 'Add your first piece to get started.' : 'Try a different category or search.'}
              </p>
              {products.length === 0 && (
                <button
                  onClick={() => setShowModal(true)}
                  style={{ padding:'11px 28px', background:'#141210', color:'#fff', border:'none', fontSize:12, cursor:'pointer', letterSpacing:'0.08em', fontFamily:'DM Sans, sans-serif' }}
                >
                  + Add your first piece
                </button>
              )}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:14 }}>
              {filtered.map(p => (
                <div key={p.id} className="product-card">
                  <div className="card-img">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.title} />
                      : <div className="card-ph">{p.title[0]}</div>
                    }
                    <button className={`card-heart${p.wishlisted ? ' on' : ''}`} onClick={() => toggleWishlist(p.id)}>
                      {p.wishlisted ? '♥' : '♡'}
                    </button>
                    <button className="card-remove" onClick={() => removeProduct(p.id)} title="Remove">×</button>
                  </div>
                  <div className="card-body">
                    <p className="card-brand">{p.brand}</p>
                    <p className="card-title">{p.title}</p>
                    <p className="card-price">{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {showModal && (
        <AddPieceModal
          onClose={() => setShowModal(false)}
          onAdd={p => setProducts(prev => [p, ...prev])}
        />
      )}
    </>
  )
}