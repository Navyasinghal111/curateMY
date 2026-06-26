'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

const CATS = ['ALL','APPAREL','COATS & OUTERWEAR','FOOTWEAR','BAGS & PURSES','JEWELRY & WATCHES','MAKEUP','SKINCARE','HAIRCARE','WISHLIST']
const PRODUCT_CATS = ['Apparel','Coats & Outerwear','Footwear','Bags & Purses','Jewelry & Watches','Makeup','Skincare','Haircare']

type Product = {
  id: string
  title: string
  brand: string
  price: string
  image_url: string
  product_url: string
  category: string
  notes?: string
  wishlisted?: boolean
}

// ── Add to Closet Modal ───────────────────────────────────────────
function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Product) => void }) {
  const [productUrl, setProductUrl] = useState('')
  const [scraping,   setScraping]   = useState(false)
  const [scraped,    setScraped]    = useState(false)
  const [scrapeErr,  setScrapeErr]  = useState('')

  const scrapeUrl = async () => {
    if (!productUrl.trim()) return
    setScraping(true); setScrapeErr(''); setScraped(false)
    setName(''); setBrand(''); setPrice(''); setImageUrl(''); setImagePreview(''); setShopLink('')
    try {
      const res = await fetch('/api/product/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl.trim() }),
      })
      const d = await res.json()
      if (!res.ok) { setScrapeErr(d.error ?? 'Could not fetch product'); setScraping(false); return }
      if (d.title)  setName(d.title)
      if (d.brand)  setBrand(d.brand)
      if (d.price)  setPrice(d.price.replace(/[₹$£€]/g, ''))
      if (d.image)  { setImageUrl(d.image); setImagePreview(d.image) }
      if (d.url)    setShopLink(d.url)
      setScraped(true)
    } catch { setScrapeErr('Something went wrong. Fill in the details manually.') }
    setScraping(false)
  }
  const [imageUrl,  setImageUrl]  = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [name,     setName]     = useState('')
  const [brand,    setBrand]    = useState('')
  const [price,    setPrice]    = useState('')
  const [category, setCategory] = useState('Apparel')
  const [shopLink, setShopLink] = useState('')
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // When image URL is pasted, preview it
  useEffect(() => {
    if (imageUrl.trim()) setImagePreview(imageUrl.trim())
  }, [imageUrl])

  // When file is selected, preview it
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const save = async () => {
    if (!name.trim()) { setError('Please enter a product name'); return }
    setSaving(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()

    let finalImageUrl = imageUrl.trim()

    // If file uploaded, upload to Supabase Storage
    if (imageFile && user) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, imageFile, { upsert: true })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
        finalImageUrl = urlData.publicUrl
      }
    }

    // Format price with ₹
    const formattedPrice = price ? (price.startsWith('₹') ? price : `₹${price}`) : ''

    // Map category to match our DB format
    const dbCategory = category.toUpperCase().replace(/ & /g, ' & ')

    if (user) {
      const { data, error: dbErr } = await supabase
        .from('storefront_products')
        .insert({
          creator_id:  user.id,
          title:       name.trim(),
          brand:       brand.trim(),
          price:       formattedPrice,
          image_url:   finalImageUrl,
          product_url: shopLink.trim(),
          category:    dbCategory,
          description: notes.trim(),
          active:      true,
        })
        .select()
        .single()

      if (dbErr) { setError(dbErr.message); setSaving(false); return }
      onAdd(data)
    } else {
      // Preview mode — create fake product
      onAdd({
        id:          String(Date.now()),
        title:       name.trim(),
        brand:       brand.trim(),
        price:       formattedPrice,
        image_url:   finalImageUrl,
        product_url: shopLink.trim(),
        category:    dbCategory,
        notes:       notes.trim(),
      })
    }
    onClose()
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>

      <div style={{ background:'#FAFAF8', width:'100%', maxWidth:680, maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'28px 32px 20px', borderBottom:'1px solid #E8E4DE' }}>
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:28, fontWeight:400, color:'#1a1a1a' }}>Add to closet</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'#aaa', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {/* URL paste bar */}
        <div style={{ padding:'16px 32px', borderBottom:'1px solid #E8E4DE', background:'#FAFAF8', display:'flex', gap:0 }}>
          <input
            value={productUrl}
            onChange={e => { setProductUrl(e.target.value); setScraped(false); setScrapeErr('') }}
            onKeyDown={e => e.key === 'Enter' && scrapeUrl()}
            placeholder="Paste product URL — Nykaa, Amazon, Myntra, Ajio…"
            style={{ flex:1, padding:'10px 14px', border:'1px solid #E0DCD6', borderRight:'none', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff' }}
          />
          <button onClick={scrapeUrl} disabled={scraping || !productUrl.trim()}
            style={{ padding:'10px 20px', background:'#1a1a1a', color:'#fff', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit', opacity: scraping || !productUrl.trim() ? 0.5 : 1, whiteSpace:'nowrap' }}>
            {scraping ? 'Fetching…' : 'Auto-fill ↓'}
          </button>
        </div>
        {scrapeErr && <p style={{ padding:'8px 32px 0', fontSize:11, color:'#c0392b' }}>{scrapeErr}</p>}
        {scraped && <p style={{ padding:'8px 32px 0', fontSize:11, color:'#2ecc71' }}>✓ Product details filled in — review and confirm below</p>}

        {/* Body */}
        <div style={{ display:'flex', gap:28, padding:'24px 32px', overflowY:'auto', flex:1 }}>

          {/* Left — image upload */}
          <div style={{ width:220, flexShrink:0 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ width:'100%', aspectRatio:'3/4', border:'1px dashed #C8C4BC', background:'#F0EDE8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative' }}>
              {imagePreview
                ? <img src={imagePreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                : <>
                    <span style={{ fontSize:24, color:'#C8C4BC', marginBottom:8 }}>+</span>
                    <span style={{ fontSize:11, color:'#C8C4BC', letterSpacing:'0.06em' }}>Add a photo</span>
                  </>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
          </div>

          {/* Right — fields */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16 }}>

            {/* Image URL */}
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Or paste an image link</label>
              <input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://.../photo.jpg"
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff' }}
              />
              <p style={{ fontSize:10, color:'#B0A898', marginTop:4, lineHeight:1.5 }}>
                Right-click any photo online → "Copy image address", then paste here (Ctrl/Cmd+V).
              </p>
            </div>

            {/* Name */}
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Silk Slip Dress"
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff' }}
              />
            </div>

            {/* Brand */}
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Brand / Maison</label>
              <input
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="Atelier Noir"
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff' }}
              />
            </div>

            {/* Price + Category */}
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1 }}>
                <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Price (₹)</label>
                <input
                  value={price}
                  onChange={e => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="2499"
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff' }}
                />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff', appearance:'auto' }}>
                  {PRODUCT_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Shop link */}
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Shop link (optional)</label>
              <input
                value={shopLink}
                onChange={e => setShopLink(e.target.value)}
                placeholder="https://... where to buy"
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff' }}
              />
            </div>

            {/* Notes */}
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Pairs with the slip dress — size up..."
                rows={3}
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff', resize:'vertical' }}
              />
            </div>

            {error && <p style={{ fontSize:12, color:'#c0392b' }}>{error}</p>}

            {/* Submit */}
            <button onClick={save} disabled={saving}
              style={{ width:'100%', padding:'14px', background:'#8B1A1A', color:'#fff', border:'none', fontSize:12, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'inherit', opacity: saving ? 0.6 : 1, marginTop:4 }}>
              {saving ? 'ADDING...' : 'ADD PIECE'}
            </button>
          </div>
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
      if (!user) { setLoading(false); return }
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

  const totalVal = products.reduce((s, p) => s + parseFloat(p.price?.replace(/[^0-9.]/g, '') || '0'), 0)

  const toggleWish = async (id: string) => {
    const p = products.find(x => x.id === id)
    if (!p) return
    const next = !p.wishlisted
    setProducts(prev => prev.map(x => x.id === id ? { ...x, wishlisted: next } : x))
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('storefront_products').update({ wishlisted: next }).eq('id', id)
  }

  const remove = async (id: string) => {
    if (!confirm('Remove this product?')) return
    setProducts(prev => prev.filter(x => x.id !== id))
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('storefront_products').update({ active: false }).eq('id', id)
  }

  if (loading) return (
    <div style={{ padding:60, textAlign:'center', fontFamily:'Cormorant Garamond, serif', fontSize:22, color:'#C4BEB6', fontStyle:'italic' }}>
      Loading your collection…
    </div>
  )

  return (
    <>
      <style>{`
        .tab-row{overflow-x:auto;white-space:nowrap;border-top:0.5px solid rgba(20,18,16,0.1);border-bottom:0.5px solid rgba(20,18,16,0.1);background:#fff}
        .tab-row::-webkit-scrollbar{display:none}
        .tab{display:inline-flex;align-items:center;gap:5px;padding:13px 18px;background:none;border:none;border-bottom:2px solid transparent;font-size:11px;font-weight:500;letter-spacing:0.09em;color:#5a5550;cursor:pointer;white-space:nowrap;font-family:inherit}
        .tab:hover{color:#141210}
        .tab.on{color:#141210;border-bottom-color:#B07D4A;font-weight:600}
        .tab.wl{color:#B07D4A}
        .tab-n{font-size:10px;font-weight:400;color:#C4BEB6}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
        .card{background:#fff;border:0.5px solid rgba(20,18,16,0.07);overflow:hidden;transition:box-shadow 0.2s}
        .card:hover{box-shadow:0 8px 28px rgba(20,18,16,0.1)}
        .cimg{aspect-ratio:3/4;background:#F4F2EE;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .cimg img{width:100%;height:100%;object-fit:contain;padding:12px}
        .cph{font-family:'Cormorant Garamond',serif;font-size:60px;font-style:italic;color:rgba(20,18,16,0.1)}
        .cheart{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.95);border:0.5px solid rgba(20,18,16,0.12);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;color:#C4BEB6;z-index:2;transition:all 0.15s}
        .cheart:hover,.cheart.on{color:#B07D4A}
        .crem{position:absolute;top:10px;left:10px;width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,0.9);border:0.5px solid rgba(20,18,16,0.12);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;color:#C4BEB6;z-index:2;opacity:0;transition:opacity 0.15s}
        .card:hover .crem{opacity:1}
        .crem:hover{color:#c0392b}
        .cbody{padding:12px 14px 16px}
        .cbrand{font-size:9px;letter-spacing:0.13em;text-transform:uppercase;color:#C4BEB6;margin-bottom:4px}
        .ctitle{font-size:13px;font-weight:500;color:#141210;line-height:1.4;margin-bottom:6px}
        .cprice{font-family:'Cormorant Garamond',serif;font-size:17px;color:#141210}
      `}</style>

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
                    {p.image_url 
                      ? <img src={p.image_url} alt={p.title} 
                          onError={e => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style') }} 
                        /> 
                      : null}
                    <div className="cph" style={{ display: p.image_url ? 'none' : 'flex' }}>{p.title[0]}</div>
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