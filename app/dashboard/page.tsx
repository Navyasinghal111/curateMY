'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

const CATS = ['ALL','APPAREL','COATS & OUTERWEAR','FOOTWEAR','BAGS & PURSES','JEWELRY & WATCHES','MAKEUP','SKINCARE','HAIRCARE','WISHLIST']
const PRODUCT_CATS = ['Apparel','Coats & Outerwear','Footwear','Bags & Purses','Jewelry & Watches','Makeup','Skincare','Haircare']

type Product = { id:string; title:string; brand:string; price:string; image_url:string; product_url:string; category:string; wishlisted?:boolean }
type Profile = { name:string; username:string; avatar_url:string; followers:number }

const db = () => createClient()
const INP: React.CSSProperties = { width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff' }

// ── Add Modal ─────────────────────────────────────────────────────
function AddModal({ onClose, onAdd }: { onClose:()=>void; onAdd:(p:Product)=>void }) {
  const [url, setUrl]     = useState('')
  const [name, setName]   = useState('')
  const [brand, setBrand] = useState('')
  const [price, setPrice] = useState('')
  const [cat, setCat]     = useState('Skincare')
  const [img, setImg]     = useState('')
  const [imgFile, setImgFile] = useState<File|null>(null)
  const [preview, setPreview] = useState('')
  const [shopLink, setShopLink] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [msg, setMsg] = useState<{text:string;type:'ok'|'err'}>()
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = db()

  useEffect(() => { if (img) setPreview(img) }, [img])

  const scrape = async () => {
    if (!url.trim()) return
    setScraping(true); setMsg(undefined)
    setShopLink(url.trim())
    try {
      const r = await fetch('/api/product/preview', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url: url.trim() }) })
      const d = await r.json()
      if (!r.ok) { setMsg({ text: d.error ?? 'Could not fetch', type:'err' }); setScraping(false); return }
      if (d.title) setName(d.title)
      if (d.brand) setBrand(d.brand)
      if (d.price) setPrice(d.price.replace(/[₹$£€]/g,''))
      if (d.image) { setImg(d.image); setPreview(d.image) }
      if (d.url)   setShopLink(d.url)
      setMsg({ text:'Details filled — review below', type:'ok' })
    } catch { setMsg({ text:'Could not fetch. Fill manually.', type:'err' }) }
    setScraping(false)
  }

  const save = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { setError('Please log in to add products.'); return }
    if (!name.trim()) { setError('Please enter a product name'); return }
    setLoading(true); setError('')
    let finalImg = img.trim()
    if (imgFile) {
      const path = `${user.id}/${Date.now()}.${imgFile.name.split('.').pop()}`
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, imgFile, { upsert:true })
      if (!upErr) finalImg = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
    }
    const { data, error: dbErr } = await supabase.from('storefront_products').insert({
      creator_id: user.id, title: name.trim(), brand: brand.trim(),
      price: price ? `₹${price}` : '', image_url: finalImg,
      product_url: shopLink.trim(), category: cat.toUpperCase().replace(/ & /g,' & '),
      description: notes.trim(), active: true,
    }).select().single()
    if (dbErr) { setError(dbErr.message); setLoading(false); return }
    onAdd(data); onClose()
  }

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:16 }}>
      <div style={{ background:'#FAFAF8', width:'100%', maxWidth:640, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', borderRadius:4 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 28px 16px', borderBottom:'1px solid #E8E4DE' }}>
          <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, fontWeight:400, color:'#1a1a1a' }}>Add to closet</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'#aaa', cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:'14px 28px', borderBottom:'1px solid #E8E4DE', display:'flex', gap:0 }}>
          <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key==='Enter' && scrape()} placeholder="Paste URL — Nykaa, Amazon, Myntra…" style={{ ...INP, borderRight:'none', flex:1 }} />
          <button onClick={scrape} disabled={scraping||!url.trim()} style={{ padding:'10px 18px', background:'#1a1a1a', color:'#fff', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit', opacity: scraping||!url.trim() ? 0.5 : 1 }}>
            {scraping ? 'Fetching…' : 'Auto-fill ↓'}
          </button>
        </div>
        {msg && <p style={{ padding:'6px 28px 0', fontSize:11, color: msg.type==='ok' ? '#27ae60' : '#c0392b' }}>{msg.text}</p>}
        <div style={{ display:'flex', gap:24, padding:'20px 28px', overflowY:'auto', flex:1 }}>
          <div style={{ width:180, flexShrink:0 }}>
            <div onClick={() => fileRef.current?.click()} style={{ width:'100%', aspectRatio:'3/4', border:'1px dashed #C8C4BC', background:'#F0EDE8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden' }}>
              {preview ? <img src={preview} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                : <><span style={{ fontSize:22, color:'#C8C4BC' }}>+</span><span style={{ fontSize:11, color:'#C8C4BC', marginTop:4 }}>Add photo</span></>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f=e.target.files?.[0]; if(f){setImgFile(f);setPreview(URL.createObjectURL(f))} }} style={{ display:'none' }} />
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:5 }}>Or paste image URL</label>
              <input value={img} onChange={e => setImg(e.target.value)} placeholder="https://…/photo.jpg" style={INP} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:5 }}>Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Product name" style={INP} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:5 }}>Brand</label>
              <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Nykaa, Zara…" style={INP} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <div style={{ flex:1 }}>
                <label style={{ display:'block', fontSize:10, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:5 }}>Price (₹)</label>
                <input value={price} onChange={e => setPrice(e.target.value.replace(/[^0-9.]/g,''))} placeholder="2499" style={INP} />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ display:'block', fontSize:10, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:5 }}>Category</label>
                <select value={cat} onChange={e => setCat(e.target.value)} style={{ ...INP, appearance:'auto' }}>
                  {PRODUCT_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:5 }}>Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Why you love it…" rows={2} style={{ ...INP, resize:'vertical' }} />
            </div>
            {error && <p style={{ fontSize:12, color:'#c0392b' }}>{error}</p>}
            <button onClick={save} disabled={loading} style={{ padding:'13px', background:'#0A0A0A', color:'#fff', border:'none', fontSize:12, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'inherit', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'ADDING…' : 'ADD PIECE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────
export default function DashboardHome() {
  const [products, setProducts] = useState<Product[]>([])
  const [tab,      setTab]      = useState('ALL')
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState(false)
  const [openMenu, setOpenMenu] = useState<string|null>(null)
  const [profile,  setProfile]  = useState<Profile>({ name:'', username:'', avatar_url:'', followers:0 })
  const supabase = db()

  useEffect(() => {
    const close = () => setOpenMenu(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('storefront_products').select('*').eq('creator_id', user.id).eq('active', true).order('created_at', { ascending:false })
      setProducts(data ?? [])
    }
    load()
  }, [])

  // Profile header data — tries the `profiles` table first, falls back to
  // auth user metadata, then to a generic placeholder. Safe even if the
  // `profiles` table or its columns don't exist yet.
  useEffect(() => {
    const loadProfile = async () => {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) return

      const fallbackName = (user.user_metadata?.full_name as string) || (user.email ? user.email.split('@')[0] : 'Creator')
      const fallbackUsername = (user.user_metadata?.username as string) || fallbackName.toLowerCase().replace(/\s+/g,'')
      const fallbackAvatar = (user.user_metadata?.avatar_url as string) || ''

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url, followers, follower_count')
          .eq('id', user.id)
          .maybeSingle()

        if (error || !data) {
          setProfile({ name: fallbackName, username: fallbackUsername, avatar_url: fallbackAvatar, followers: 0 })
          return
        }

        setProfile({
          name: data.full_name || fallbackName,
          username: data.username || fallbackUsername,
          avatar_url: data.avatar_url || fallbackAvatar,
          followers: data.followers ?? data.follower_count ?? 0,
        })
      } catch {
        setProfile({ name: fallbackName, username: fallbackUsername, avatar_url: fallbackAvatar, followers: 0 })
      }
    }
    loadProfile()
  }, [])

  const count = (t:string) => t==='ALL' ? products.length : t==='WISHLIST' ? products.filter(p=>p.wishlisted).length : products.filter(p=>p.category?.toUpperCase()===t).length

  const filtered = products.filter(p => {
    const catOk  = tab==='ALL' || (tab==='WISHLIST' ? p.wishlisted : p.category?.toUpperCase()===tab)
    const srchOk = !search || [p.title,p.brand].some(s=>s?.toLowerCase().includes(search.toLowerCase()))
    return catOk && srchOk
  })

  const totalValue = products.reduce((s,p) => s + (parseFloat(p.price?.replace(/[^0-9.]/g,'')||'0')||0), 0)

  const toggleWish = async (id:string) => {
    const p = products.find(x=>x.id===id); if (!p) return
    setProducts(prev => prev.map(x => x.id===id ? {...x,wishlisted:!p.wishlisted} : x))
    const { data:{ user } } = await supabase.auth.getUser()
    if (user) await supabase.from('storefront_products').update({ wishlisted:!p.wishlisted }).eq('id',id)
  }

  const remove = async (id:string) => {
    setProducts(prev => prev.filter(x=>x.id!==id))
    const { data:{ user } } = await supabase.auth.getUser()
    if (user) await supabase.from('storefront_products').update({ active:false }).eq('id',id)
  }

  const S: React.CSSProperties = { fontFamily:'Cormorant Garamond, serif', fontWeight:300, color:'#0A0A0A' }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" rel="stylesheet" />
      <style>{`
        .cat-tab{background:none;border:none;border-bottom:2px solid transparent;padding:12px 14px;font-size:11px;font-weight:500;letter-spacing:0.08em;color:#9B9B9B;cursor:pointer;white-space:nowrap;font-family:inherit;transition:all 0.15s}
        .cat-tab:hover{color:#0A0A0A}
        .cat-tab.on{color:#0A0A0A;border-bottom-color:#0A0A0A}
        .cat-tab.wl{color:#C53030}
        .cat-tab.wl.on{border-bottom-color:#C53030}
        .pcard{background:#fff;border:0.5px solid #E8E4DC;overflow:visible;transition:box-shadow 0.2s;position:relative}
        .pcard:hover{box-shadow:0 8px 28px rgba(0,0,0,0.09)}
        .tdot{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:#fff;border:0.5px solid #E5E5E5;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transition:opacity 0.15s;box-shadow:0 2px 6px rgba(0,0,0,0.08);z-index:10;font-size:14px;color:#666;letter-spacing:1px}
        .pcard:hover .tdot{opacity:1}
        .tdot:hover{background:#F5F5F5}
        .dmenu{position:absolute;top:40px;right:8px;background:#fff;border:0.5px solid #E5E5E5;border-radius:8px;padding:4px 0;min-width:170px;box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:200}
        .ditem{display:flex;align-items:center;gap:8px;padding:9px 14px;font-size:13px;color:#0A0A0A;cursor:pointer;background:none;border:none;width:100%;text-align:left;font-family:inherit}
        .ditem:hover{background:#F5F5F5}
        .ditem.red{color:#E53E3E}
        .ditem i{font-size:15px;color:#9B9B9B}
        .ditem.red i{color:#E53E3E}
        .addbtn{display:inline-flex;align-items:center;gap:6px;padding:10px 22px;background:#0A0A0A;color:#fff;border:none;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;letter-spacing:0.05em;box-shadow:0 2px 10px rgba(0,0,0,0.18)}
        .addbtn:hover{background:#333}
      `}</style>

      {/* Profile header */}
      <div style={{ background:'#fff', borderBottom:'0.5px solid #EBEBEB', padding:'40px 32px 24px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
        <div style={{ width:96, height:96, borderRadius:'50%', overflow:'hidden', background:'#F3E9DD', border:'1px solid #E8D8C3', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, flexShrink:0 }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ ...S, fontSize:40, fontWeight:400, color:'#B07D4A' }}>{profile.name?.[0]?.toUpperCase() || '?'}</span>}
        </div>
        <p style={{ fontSize:14, fontStyle:'italic', fontFamily:'Cormorant Garamond, serif', color:'#9B9B9B', marginBottom:4 }}>Curated by</p>
        <h1 style={{ ...S, fontSize:36, lineHeight:1.1, marginBottom:10 }}>{profile.name || 'Creator'}</h1>
        <p style={{ fontSize:12, color:'#9B9B9B', letterSpacing:'0.04em' }}>
          @{profile.username} · {profile.followers.toLocaleString('en-IN')} followers
        </p>
      </div>

      {/* Category tabs */}
      <div style={{ background:'#fff', borderBottom:'0.5px solid #EBEBEB', overflowX:'auto', display:'flex', padding:'0 32px', position:'sticky', top:52, zIndex:40 }}>
        {CATS.map(c => (
          <button key={c} onClick={()=>setTab(c)} className={`cat-tab${tab===c?' on':''}${c==='WISHLIST'?' wl':''}`}>
            {c==='WISHLIST' && '♥ '}{c} <span style={{ fontSize:10, opacity:0.5, marginLeft:2 }}>{count(c)}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background:'#F8F6F2', minHeight:'calc(100vh - 100px)', padding:'32px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div>
            <p style={{ fontSize:10, letterSpacing:'0.16em', color:'#B07D4A', textTransform:'uppercase', marginBottom:6 }}>YOUR WARDROBE, CURATED</p>
            <h2 style={{ ...S, fontSize:48, lineHeight:1 }}>The Collection</h2>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:24 }}>
            <button onClick={()=>setModal(true)} className="addbtn">+ ADD PIECE</button>
            {[{ n:products.length, l:'Pieces' }, { n:`₹${Math.round(totalValue).toLocaleString('en-IN')}`, l:'Closet value' }, { n:products.filter(p=>p.wishlisted).length, l:'Wishlisted' }].map(s => (
              <div key={s.l} style={{ textAlign:'right' }}>
                <p style={{ ...S, fontSize:28, lineHeight:1 }}>{s.n}</p>
                <p style={{ fontSize:10, color:'#9B9B9B', marginTop:3, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search your closet…"
          style={{ width:'100%', maxWidth:360, padding:'9px 14px', border:'0.5px solid #DDDBD6', background:'#fff', fontSize:13, outline:'none', fontFamily:'inherit', color:'#0A0A0A', borderRadius:4, marginBottom:20 }} />

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <p style={{ ...S, fontSize:36, fontStyle:'italic', color:'rgba(0,0,0,0.08)', marginBottom:14 }}>{products.length===0 ? 'Your closet is empty.' : 'Nothing here.'}</p>
            <p style={{ fontSize:13, color:'#9B9B9B', marginBottom:24 }}>{products.length===0 ? 'Start curating products you love.' : 'Try a different category.'}</p>
            {products.length===0 && <button onClick={()=>setModal(true)} className="addbtn">+ ADD YOUR FIRST PIECE</button>}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {filtered.map(p => (
              <div key={p.id} className="pcard">
                <button className="tdot" onClick={e=>{e.stopPropagation();setOpenMenu(openMenu===p.id?null:p.id)}}>···</button>
                {openMenu===p.id && (
                  <div className="dmenu" onClick={e=>e.stopPropagation()}>
                    <button className="ditem" onClick={()=>setOpenMenu(null)}><i className="ti ti-edit" aria-hidden="true"></i>Edit product</button>
                    <button className="ditem" onClick={()=>{navigator.clipboard.writeText(`curatekin.com/r/${p.id}`);setOpenMenu(null)}}><i className="ti ti-link" aria-hidden="true"></i>Copy shop link</button>
                    <button className="ditem" onClick={()=>{toggleWish(p.id);setOpenMenu(null)}}><i className="ti ti-heart" aria-hidden="true"></i>{p.wishlisted?'Remove from wishlist':'Add to wishlist'}</button>
                    <button className="ditem red" onClick={()=>{remove(p.id);setOpenMenu(null)}}><i className="ti ti-trash" aria-hidden="true"></i>Remove from shop</button>
                  </div>
                )}
                <div style={{ aspectRatio:'1/1', background:'#F0EDE8', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                  {p.image_url ? <img src={p.image_url} alt={p.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span style={{ ...S, fontSize:36, fontStyle:'italic', color:'rgba(0,0,0,0.1)' }}>{p.title?.[0]}</span>}
                </div>
                <div style={{ padding:'10px 12px 8px', display:'flex', flexDirection:'column', minHeight:96 }}>
                  <p style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'#9B9B9B', marginBottom:3 }}>{p.brand}</p>
                  <p style={{ fontSize:13, fontWeight:500, color:'#0A0A0A', lineHeight:1.4, marginBottom:5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.title}</p>
                  <p style={{ ...S, fontSize:15, marginTop:'auto' }}>{p.price}</p>
                </div>
                <a href={`/r/${p.id}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', margin:'0 12px 12px', padding:'7px', background:'#0A0A0A', color:'#fff', fontSize:10, letterSpacing:'0.1em', textAlign:'center', textDecoration:'none' }}>
                  SHOP NOW
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && <AddModal onClose={()=>setModal(false)} onAdd={p=>setProducts(prev=>[p,...prev])} />}
    </>
  )
}