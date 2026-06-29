'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

const CATS = ['ALL','APPAREL','COATS & OUTERWEAR','FOOTWEAR','BAGS & PURSES','JEWELRY & WATCHES','MAKEUP','SKINCARE','HAIRCARE','WISHLIST']
const PRODUCT_CATS = ['Apparel','Coats & Outerwear','Footwear','Bags & Purses','Jewelry & Watches','Makeup','Skincare','Haircare']

type Product = {
  id: string; title: string; brand: string; price: string;
  image_url: string; product_url: string; category: string;
  notes?: string; wishlisted?: boolean
}

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Product) => void }) {
  const [productUrl, setProductUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scraped, setScraped] = useState(false)
  const [scrapeErr, setScrapeErr] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Apparel')
  const [shopLink, setShopLink] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const scrapeUrl = async () => {
    if (!productUrl.trim()) return
    setScraping(true); setScrapeErr(''); setScraped(false)
    setName(''); setBrand(''); setPrice(''); setImageUrl(''); setImagePreview('')
    setShopLink(productUrl.trim())
    try {
      const res = await fetch('/api/product/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl.trim() }),
      })
      const d = await res.json()
      if (!res.ok) { setScrapeErr(d.error ?? 'Could not fetch product'); setScraping(false); return }
      if (d.title) setName(d.title)
      if (d.brand) setBrand(d.brand)
      if (d.price) setPrice(d.price.replace(/[₹$£€]/g, ''))
      if (d.image) { setImageUrl(d.image); setImagePreview(d.image) }
      if (d.url) setShopLink(d.url)
      setScraped(true)
    } catch {
      setScrapeErr('Something went wrong. Fill in the details manually.')
    }
    setScraping(false)
  }

  useEffect(() => {
    if (imageUrl.trim()) setImagePreview(imageUrl.trim())
  }, [imageUrl])

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

    if (imageFile && user) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, imageFile, { upsert: true })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
        finalImageUrl = urlData.publicUrl
      }
    }

    const formattedPrice = price ? (price.startsWith('₹') ? price : `₹${price}`) : ''
    const dbCategory = category.toUpperCase().replace(/ & /g, ' & ')

    if (user) {
      const { data, error: dbErr } = await supabase
        .from('storefront_products')
        .insert({
          creator_id: user.id,
          title: name.trim(),
          brand: brand.trim(),
          price: formattedPrice,
          image_url: finalImageUrl,
          product_url: shopLink.trim(),
          category: dbCategory,
          description: notes.trim(),
          active: true,
        })
        .select()
        .single()

      if (dbErr) { setError(dbErr.message); setSaving(false); return }
      onAdd(data)
    } else {
      onAdd({
        id: String(Date.now()),
        title: name.trim(),
        brand: brand.trim(),
        price: formattedPrice,
        image_url: finalImageUrl,
        product_url: shopLink.trim(),
        category: dbCategory,
        notes: notes.trim(),
      })
    }
    onClose()
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div style={{ background:'#FAFAF8', width:'100%', maxWidth:680, maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'28px 32px 20px', borderBottom:'1px solid #E8E4DE' }}>
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:28, fontWeight:400, color:'#1a1a1a' }}>Add to closet</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'#aaa', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
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
        <div style={{ display:'flex', gap:28, padding:'24px 32px', overflowY:'auto', flex:1 }}>
          <div style={{ width:220, flexShrink:0 }}>
            <div onClick={() => fileRef.current?.click()}
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
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Or paste an image link</label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://.../photo.jpg"
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff' }} />
              <p style={{ fontSize:10, color:'#B0A898', marginTop:4, lineHeight:1.5 }}>Right-click any photo online → "Copy image address", then paste here (Ctrl/Cmd+V).</p>
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Silk Slip Dress"
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Brand / Maison</label>
              <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Atelier Noir"
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff' }} />
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1 }}>
                <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Price (₹)</label>
                <input value={price} onChange={e => setPrice(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="2499"
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff' }} />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff', appearance:'auto' }}>
                  {PRODUCT_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {shopLink && <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Shop link</label>
              <div style={{ padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:12, color:'#8C867E', background:'#FAFAF8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{shopLink}</div>
            </div>}
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', color:'#8C867E', textTransform:'uppercase', marginBottom:6 }}>Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Pairs with the slip dress — size up..." rows={3}
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff', resize:'vertical' }} />
            </div>
            {error && <p style={{ fontSize:12, color:'#c0392b' }}>{error}</p>}
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

export default function DashboardHome() {
  const [profile,  setProfile]  = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [tab,      setTab]      = useState('ALL')
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProfile({ display_name:'Navya Singhal', username:'navya' })
        return
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
        .cat-tab { background:none; border:none; border-bottom:2px solid transparent; padding:14px 16px; font-size:11px; font-weight:500; letter-spacing:0.08em; color:#9B9B9B; cursor:pointer; white-space:nowrap; font-family:inherit; transition:all 0.15s; }
        .cat-tab:hover { color:#0A0A0A; }
        .cat-tab.on { color:#0A0A0A; border-bottom-color:#0A0A0A; }
        .cat-tab.wishlist { color:#C53030; }
        .cat-tab.wishlist.on { border-bottom-color:#C53030; }
        .prod-card { background:#fff; border:0.5px solid #E8E4DC; overflow:hidden; cursor:pointer; transition:box-shadow 0.2s; position:relative; }
        .prod-card:hover { box-shadow:0 8px 32px rgba(0,0,0,0.08); }
        .prod-card:hover .heart-btn { opacity:1; }
        .heart-btn { position:absolute; top:10px; right:10px; width:28px; height:28px; border-radius:50%; background:#fff; border:0.5px solid #E5E5E5; display:flex; align-items:center; justify-content:center; font-size:12px; cursor:pointer; opacity:0; transition:opacity 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
        .search-input { background:#0A0A0A; border:0.5px solid rgba(255,255,255,0.15); color:#fff; padding:10px 16px; font-size:13px; outline:none; font-family:inherit; width:280px; }
        .search-input::placeholder { color:rgba(255,255,255,0.35); }
      `}</style>

      {/* Category tabs — white bar */}
      <div style={{ background:'#fff', borderBottom:'0.5px solid #EBEBEB', overflowX:'auto', display:'flex', padding:'0 40px' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setTab(c)}
            className={`cat-tab${tab === c ? ' on' : ''}${c === 'WISHLIST' ? ' wishlist' : ''}`}>
            {c === 'WISHLIST' && <span style={{ marginRight:4 }}>♥</span>}
            {c} <span style={{ fontSize:10, opacity:0.55, marginLeft:3 }}>{count(c)}</span>
          </button>
        ))}
      </div>

      {/* Content — cream */}
      <div style={{ background:'#F8F6F2', minHeight:'calc(100vh - 160px)', padding:'36px 40px' }}>

        {/* Collection header */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:36 }}>
          <div>
            <p style={{ fontSize:10, letterSpacing:'0.16em', color:'#B07D4A', textTransform:'uppercase', marginBottom:8 }}>YOUR WARDROBE, CURATED</p>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:52, fontWeight:300, color:'#0A0A0A', lineHeight:1 }}>The Collection</h2>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setModal(true)} style={{ background:'#fff', color:'#0A0A0A', border:'none', padding:'10px 22px', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>
              + ADD PIECE
            </button>
            <div style={{ display:'flex', gap:48, textAlign:'right' }}>
            <div>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:300, color:'#0A0A0A', lineHeight:1 }}>{products.length}</p>
              <p style={{ fontSize:10, letterSpacing:'0.1em', color:'#9B9B9B', marginTop:4, textTransform:'uppercase' }}>Pieces</p>
            </div>
            <div>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:300, color:'#0A0A0A', lineHeight:1 }}>
                ₹{totalValue > 0 ? totalValue.toLocaleString('en-IN') : '0'}
              </p>
              <p style={{ fontSize:10, letterSpacing:'0.1em', color:'#9B9B9B', marginTop:4, textTransform:'uppercase' }}>Closet Value</p>
            </div>
            <div>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:300, color:'#0A0A0A', lineHeight:1 }}>0</p>
              <p style={{ fontSize:10, letterSpacing:'0.1em', color:'#9B9B9B', marginTop:4, textTransform:'uppercase' }}>Wishlisted</p>
            </div>
            </div>
          </div>
        </div>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontStyle:'italic', color:'rgba(0,0,0,0.1)', marginBottom:14 }}>
              {products.length === 0 ? 'Your closet is empty.' : 'Nothing in this category.'}
            </p>
            <p style={{ fontSize:13, color:'#9B9B9B', marginBottom:24 }}>
              {products.length === 0 ? 'Start curating products you love.' : 'Try a different category.'}
            </p>
            {products.length === 0 && (
              <button onClick={() => setModal(true)} style={{ display:'inline-block', padding:'12px 32px', background:'#0A0A0A', color:'#fff', fontSize:12, letterSpacing:'0.1em', textDecoration:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                + ADD YOUR FIRST PIECE
              </button>
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

      {modal && <AddModal onClose={() => setModal(false)} onAdd={p => setProducts(prev => [p, ...prev])} />}
    </>
  )
}