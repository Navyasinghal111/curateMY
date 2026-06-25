'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

const CATS = ['ALL','APPAREL','COATS & OUTERWEAR','FOOTWEAR','BAGS & PURSES','JEWELRY & WATCHES','MAKEUP','SKINCARE','HAIRCARE','WISHLIST']

type Product = {
  id: string
  title: string
  brand: string
  price: string
  image_url: string
  product_url: string
  category: string
  wishlisted?: boolean
}

// ── Add Piece Modal ───────────────────────────────────────────────
function AddModal({ onClose, onAdd }: { onClose: ()=>void; onAdd: (p:Product)=>void }) {
  const [url, setUrl]      = useState('')
  const [preview, setPrev] = useState<any>(null)
  const [cat, setCat]      = useState('SKINCARE')
  const [loading, setLoad] = useState(false)
  const [saving, setSave]  = useState(false)
  const [error, setError]  = useState('')
  const supabase = createClient()
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  const fetchPreview = async () => {
    if (!url.trim()) return
    setLoad(true); setError(''); setPrev(null)
    try {
      const res = await fetch('/api/product/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Could not fetch product')
      setPrev(d)
    } catch (e: any) { setError(e.message) }
    setLoad(false)
  }

  const save = async () => {
    if (!preview) return
    setSave(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in — log in to save products'); setSave(false); return }
    const { data, error: err } = await supabase.from('storefront_products').insert({
      creator_id: user.id, title: preview.title, brand: preview.brand || '',
      price: preview.price || '', image_url: preview.image || '',
      product_url: preview.url || url, category: cat, active: true,
    }).select().single()
    if (err) { setError(err.message); setSave(false); return }
    onAdd(data); onClose()
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div style={{ background:'#fff', width:'100%', maxWidth:520, maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'22px 26px 0' }}>
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, fontWeight:400, color:'#141210' }}>Add a piece</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:26, color:'#aaa', cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:'14px 26px 0', overflowY:'auto', flex:1 }}>
          <p style={{ fontSize:12, color:'#8C867E', marginBottom:14, lineHeight:1.6 }}>
            Paste any product link — Nykaa, Amazon, Myntra, and more.
          </p>
          <div style={{ display:'flex', marginBottom:12 }}>
            <input ref={ref} value={url}
              onChange={e => { setUrl(e.target.value); setPrev(null); setError('') }}
              onKeyDown={e => e.key === 'Enter' && fetchPreview()}
              placeholder="https://www.nykaa.com/product/..."
              style={{ flex:1, padding:'11px 14px', border:'1px solid #ddd', borderRight:'none', fontSize:13, outline:'none', fontFamily:'inherit', color:'#141210' }} />
            <button onClick={fetchPreview} disabled={loading || !url.trim()}
              style={{ padding:'11px 20px', background:'#141210', color:'#fff', border:'none', fontSize:12, cursor:'pointer', opacity: loading || !url.trim() ? 0.5 : 1, fontFamily:'inherit' }}>
              {loading ? '...' : 'Preview'}
            </button>
          </div>
          {error && <p style={{ fontSize:12, color:'#c0392b', marginBottom:10 }}>{error}</p>}
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
                <select value={cat} onChange={e => setCat(e.target.value)}
                  style={{ width:'100%', padding:'7px 10px', border:'1px solid #ddd', fontSize:12, fontFamily:'inherit', background:'#fff', color:'#141210' }}>
                  {CATS.filter(c => c !== 'ALL' && c !== 'WISHLIST').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', padding:'14px 26px 22px', borderTop:'1px solid #eee', marginTop:14 }}>
          <button onClick={onClose} style={{ padding:'10px 20px', background:'none', border:'1px solid #ddd', fontSize:12, cursor:'pointer', color:'#8C867E', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={save} disabled={!preview || saving}
            style={{ padding:'10px 24px', background:'#B07D4A', color:'#fff', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit', opacity: !preview || saving ? 0.4 : 1 }}>
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
  const [tab, setTab]           = useState('ALL')
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [loading, setLoading]   = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // PREVIEW MODE — not logged in, show empty collection
        setLoading(false)
        return
      }
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

  const count = (t: string) =>
    t === 'ALL' ? products.length :
    t === 'WISHLIST' ? products.filter(p => p.wishlisted).length :
    products.filter(p => p.category === t).length

  const filtered = products.filter(p => {
    const cok = tab === 'ALL' || (tab === 'WISHLIST' ? p.wishlisted : p.category === tab)
    const sok = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
    return cok && sok
  })

  const totalVal = products.reduce((s, p) => s + parseFloat(p.price.replace(/[^0-9.]/g, '') || '0'), 0)

  const toggleWish = async (id: string) => {
    const p = products.find(x => x.id === id)
    if (!p) return
    const next = !p.wishlisted
    setProducts(prev => prev.map(x => x.id === id ? { ...x, wishlisted: next } : x))
    await supabase.from('storefront_products').update({ wishlisted: next }).eq('id', id)
  }

  const remove = async (id: string) => {
    if (!confirm('Remove this product?')) return
    await supabase.from('storefront_products').update({ active: false }).eq('id', id)
    setProducts(prev => prev.filter(x => x.id !== id))
  }

  if (loading) return (
    <div style={{ padding:60, textAlign:'center', fontFamily:'Cormorant Garamond, serif', fontSize:22, color:'#C4BEB6', fontStyle:'italic' }}>
      Loading your collection…
    </div>
  )

  return (
    <>
      <style>{`
        .tab-row { overflow-x:auto; white-space:nowrap; border-top:0.5px solid rgba(20,18,16,0.1); border-bottom:0.5px solid rgba(20,18,16,0.1); background:#fff; }
        .tab-row::-webkit-scrollbar { display:none; }
        .tab { display:inline-flex; align-items:center; gap:5px; padding:13px 18px; background:none; border:none; border-bottom:2px solid transparent; font-size:11px; font-weight:500; letter-spacing:0.09em; color:#5a5550; cursor:pointer; white-space:nowrap; font-family:inherit; }
        .tab:hover { color:#141210; }
        .tab.on { color:#141210; border-bottom-color:#B07D4A; font-weight:600; }
        .tab.wl { color:#B07D4A; }
        .tab-n { font-size:10px; font-weight:400; color:#C4BEB6; }
        .tab.wl .tab-n { color:#B07D4A; opacity:0.6; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:14px; }
        .card { background:#fff; border:0.5px solid rgba(20,18,16,0.07); overflow:hidden; transition:box-shadow 0.2s; }
        .card:hover { box-shadow:0 8px 28px rgba(20,18,16,0.1); }
        .cimg { aspect-ratio:3/4; background:#F4F2EE; position:relative; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .cimg img { width:100%; height:100%; object-fit:contain; padding:12px; }
        .cph { font-family:'Cormorant Garamond',serif; font-size:60px; font-style:italic; color:rgba(20,18,16,0.1); }
        .cheart { position:absolute; top:10px; right:10px; width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.95); border:0.5px solid rgba(20,18,16,0.12); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:15px; color:#C4BEB6; z-index:2; transition:all 0.15s; }
        .cheart:hover,.cheart.on { color:#B07D4A; }
        .crem { position:absolute; top:10px; left:10px; width:26px; height:26px; border-radius:50%; background:rgba(255,255,255,0.9); border:0.5px solid rgba(20,18,16,0.12); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:13px; color:#C4BEB6; z-index:2; opacity:0; transition:opacity 0.15s; }
        .card:hover .crem { opacity:1; }
        .crem:hover { color:#c0392b; }
        .cbody { padding:12px 14px 16px; }
        .cbrand { font-size:9px; letter-spacing:0.13em; text-transform:uppercase; color:#C4BEB6; margin-bottom:4px; }
        .ctitle { font-size:13px; font-weight:500; color:#141210; line-height:1.4; margin-bottom:6px; }
        .cprice { font-family:'Cormorant Garamond',serif; font-size:17px; color:#141210; }
      `}</style>

      {/* Atelier card */}
      <div style={{ background:'#fff', border:'0.5px solid rgba(20,18,16,0.07)', borderRadius:16, overflow:'hidden' }}>

        {/* Inner nav */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 32px', borderBottom:'0.5px solid rgba(20,18,16,0.07)' }}>
          <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:26, fontWeight:400, color:'#141210' }}>Atelier</span>
          <div style={{ display:'flex', alignItems:'stretch', gap:0 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your closet"
              style={{ padding:'9px 16px', border:'0.5px solid rgba(20,18,16,0.15)', borderRight:'none', background:'#FAFAF8', fontSize:12, outline:'none', color:'#141210', width:220, fontFamily:'inherit' }} />
            <button onClick={() => setModal(true)}
              style={{ padding:'9px 20px', background:'#8B1A1A', color:'#fff', border:'none', fontSize:11, letterSpacing:'0.1em', cursor:'pointer', fontWeight:600, fontFamily:'inherit', whiteSpace:'nowrap' }}>
              + ADD PIECE
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="tab-row">
          <div style={{ display:'inline-flex', padding:'0 32px' }}>
            {CATS.map(c => {
              const isWl = c === 'WISHLIST'
              return (
                <button key={c} className={`tab${tab === c ? ' on' : ''}${isWl ? ' wl' : ''}`} onClick={() => setTab(c)}>
                  {isWl ? '♥ WISHLIST' : c} <span className="tab-n">{count(c)}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Hero */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'40px 32px 24px', borderBottom:'0.5px solid rgba(20,18,16,0.07)' }}>
          <div>
            <p style={{ fontSize:10, letterSpacing:'0.18em', color:'#8B1A1A', marginBottom:12, fontWeight:600 }}>YOUR WARDROBE, CURATED</p>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'clamp(56px,7vw,88px)', fontWeight:400, lineHeight:0.9, color:'#141210', letterSpacing:'-0.03em' }}>
              The Collection
            </h2>
          </div>
          <div style={{ display:'flex', gap:48, alignItems:'flex-end', paddingBottom:6 }}>
            {[
              { n: products.length, l: 'PIECES' },
              { n: `₹${Math.round(totalVal).toLocaleString('en-IN')}`, l: 'CLOSET VALUE' },
              { n: products.filter(p => p.wishlisted).length, l: 'WISHLISTED' },
            ].map(s => (
              <div key={s.l} style={{ textAlign:'right' }}>
                <span style={{ display:'block', fontFamily:'Cormorant Garamond, serif', fontSize:34, fontWeight:400, color:'#141210', lineHeight:1 }}>{s.n}</span>
                <span style={{ display:'block', fontSize:9, letterSpacing:'0.15em', color:'#8C867E', marginTop:5 }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ padding:'28px 32px 40px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px' }}>
              <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:56, fontStyle:'italic', color:'rgba(20,18,16,0.07)', marginBottom:14 }}>Pk</div>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:300, color:'#141210', marginBottom:8 }}>
                {products.length === 0 ? 'Your collection is empty.' : 'Nothing here.'}
              </p>
              <p style={{ fontSize:13, color:'#C4BEB6', marginBottom:24 }}>
                {products.length === 0 ? 'Add your first piece to get started.' : 'Try a different category or search.'}
              </p>
              {products.length === 0 && (
                <button onClick={() => setModal(true)}
                  style={{ padding:'11px 28px', background:'#141210', color:'#fff', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  + Add your first piece
                </button>
              )}
            </div>
          ) : (
            <div className="grid">
              {filtered.map(p => (
                <div key={p.id} className="card">
                  <div className="cimg">
                    {p.image_url ? <img src={p.image_url} alt={p.title} /> : <div className="cph">{p.title[0]}</div>}
                    <button className={`cheart${p.wishlisted ? ' on' : ''}`} onClick={() => toggleWish(p.id)}>{p.wishlisted ? '♥' : '♡'}</button>
                    <button className="crem" onClick={() => remove(p.id)} title="Remove">×</button>
                  </div>
                  <div className="cbody">
                    <p className="cbrand">{p.brand}</p>
                    <p className="ctitle">{p.title}</p>
                    <p className="cprice">{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal && <AddModal onClose={() => setModal(false)} onAdd={p => setProducts(prev => [p, ...prev])} />}
    </>
  )
}