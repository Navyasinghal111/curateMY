'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { logEvent } from '@/lib/logEvent'
import { CATEGORY_SUBCATEGORIES, matchesProductCategory, normalizeProductCategory, PRODUCT_CATEGORIES, STORE_CATEGORIES } from '@/lib/productCategories'

const SERIF = 'Cormorant Garamond, serif'

type Product = { id:string; title:string; brand:string; price:string; image_url:string; product_url:string; category:string; wishlisted?:boolean; description?:string }
type Profile  = { name:string; username:string; avatar_url:string; followers:number }

const db  = () => createClient()
const INP: React.CSSProperties = { width:'100%', padding:'10px 12px', border:'1px solid #E0DCD6', fontSize:13, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#fff' }
const LBL: React.CSSProperties = { display:'block', fontSize:10, letterSpacing:'0.1em', color:'#8C867E', textTransform:'uppercase', marginBottom:5 }

// ── shared image upload helper ────────────────────────────────────
async function uploadImage(supabase: ReturnType<typeof db>, userId: string, file: File, bucket: string) {
  const path = `${userId}/${Date.now()}.${file.name.split('.').pop()}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

async function uploadFramedImage(supabase: ReturnType<typeof db>, userId: string, image: File, bucket: string) {
  const path = `${userId}/${Date.now()}-framed.jpg`
  const { error } = await supabase.storage.from(bucket).upload(path, image, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

async function createClientFramedImage(imageUrl: string, framing: Framing) {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('image_load_timeout')), 15000)
    image.onload = () => { window.clearTimeout(timeout); resolve() }
    image.onerror = () => { window.clearTimeout(timeout); reject(new Error('image_load_failed')) }
    image.src = imageUrl.replace(/^http:/i, 'https:')
  })

  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight
  const frameRatio = 4 / 5
  const baseWidth = Math.min(sourceWidth, Math.round(sourceHeight * frameRatio))
  const baseHeight = Math.round(baseWidth / frameRatio)
  const cropWidth = Math.max(1, Math.round(baseWidth / framing.zoom))
  const cropHeight = Math.max(1, Math.round(baseHeight / framing.zoom))
  const left = Math.round(((sourceWidth - cropWidth) / 2) + ((framing.x / 100) * (sourceWidth - cropWidth) / 2))
  const top = Math.round(((sourceHeight - cropHeight) / 2) + ((framing.y / 100) * (sourceHeight - cropHeight) / 2))
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 1500
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas_unavailable')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, Math.max(0, Math.min(left, sourceWidth - cropWidth)), Math.max(0, Math.min(top, sourceHeight - cropHeight)), cropWidth, cropHeight, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('image_export_failed')), 'image/jpeg', 0.9))
  return new File([blob], 'framed.jpg', { type:'image/jpeg' })
}

// ── shared product form ───────────────────────────────────────────
type FormState = { img:string; name:string; brand:string; price:string; cat:string; shopLink:string; notes:string; preview:string; error:string; loading:boolean }
type FormSet   = { img:(v:string)=>void; name:(v:string)=>void; brand:(v:string)=>void; price:(v:string)=>void; cat:(v:string)=>void; shopLink:(v:string)=>void; notes:(v:string)=>void; preview:(v:string)=>void; file:(f:File)=>void }
type Framing = { zoom:number; x:number; y:number }

const DEFAULT_FRAMING: Framing = { zoom: 1, x: 0, y: 0 }

function ImageFraming({ framing, onChange }: { framing:Framing; onChange:(next:Framing)=>void }) {
  const update = (key:keyof Framing, value:number) => onChange({ ...framing, [key]: value })

  return (
    <div style={{ marginTop:12, borderTop:'1px solid #E8E4DE', paddingTop:12 }}>
      <p style={{ ...LBL, marginBottom:8 }}>Image framing</p>
      <p style={{ fontSize:11, color:'#8C867E', lineHeight:1.45, marginBottom:10 }}>Zoom or reposition the product before you save it.</p>
      <label style={{ ...LBL, display:'flex', justifyContent:'space-between', marginBottom:4 }}><span>Zoom</span><span>{framing.zoom.toFixed(1)}x</span></label>
      <input aria-label="Zoom image" type="range" min="1" max="2.5" step="0.1" value={framing.zoom} onChange={e => update('zoom', Number(e.target.value))} style={{ width:'100%', accentColor:'#1a1a1a' }} />
      <label style={{ ...LBL, marginTop:8, marginBottom:4 }}>Move left or right</label>
      <input aria-label="Move image left or right" type="range" min="-100" max="100" value={framing.x} onChange={e => update('x', Number(e.target.value))} style={{ width:'100%', accentColor:'#1a1a1a' }} />
      <label style={{ ...LBL, marginTop:8, marginBottom:4 }}>Move up or down</label>
      <input aria-label="Move image up or down" type="range" min="-100" max="100" value={framing.y} onChange={e => update('y', Number(e.target.value))} style={{ width:'100%', accentColor:'#1a1a1a' }} />
      <button type="button" onClick={() => onChange(DEFAULT_FRAMING)} style={{ marginTop:8, background:'none', border:'none', padding:0, color:'#6C6255', fontSize:11, textDecoration:'underline', cursor:'pointer', fontFamily:'inherit' }}>Reset framing</button>
    </div>
  )
}

function ProductForm({ state, set, fileRef, framing, onFramingChange }: { state:FormState; set:FormSet; fileRef:{ current:HTMLInputElement|null }; framing:Framing; onFramingChange:(next:Framing)=>void }) {
  const { img, name, brand, price, cat, shopLink, notes, preview, error } = state
  return (
    <div className="product-form" style={{ display:'flex', gap:28, padding:'24px 28px', overflowY:'auto', flex:1 }}>
      <div className="product-form-media" style={{ width:224, flexShrink:0 }}>
        <div onClick={() => fileRef.current?.click()} style={{ width:'100%', aspectRatio:'4/5', border:'1px dashed #C8C4BC', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative' }}>
          {preview
            ? <img src={preview} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'center', padding:12, transform:`translate(${framing.x}%, ${framing.y}%) scale(${framing.zoom})` }} />
            : <><span style={{ fontSize:22, color:'#C8C4BC' }}>+</span><span style={{ fontSize:11, color:'#C8C4BC', marginTop:4 }}>Add photo</span></>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) { set.file(f); set.preview(URL.createObjectURL(f)) } }} />
        {preview && <ImageFraming framing={framing} onChange={onFramingChange} />}
      </div>
      <div className="product-form-fields" style={{ flex:1, display:'flex', flexDirection:'column', gap:12, minWidth:0 }}>
        <div><label style={LBL}>Or paste image URL</label><input value={img} onChange={e => set.img(e.target.value)} placeholder="https://…/photo.jpg" style={INP} /></div>
        <div><label style={LBL}>Name *</label><input value={name} onChange={e => set.name(e.target.value)} placeholder="Product name" style={INP} /></div>
        <div><label style={LBL}>Brand</label><input value={brand} onChange={e => set.brand(e.target.value)} placeholder="Nykaa, Zara…" style={INP} /></div>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1 }}><label style={LBL}>Price (₹)</label><input value={price} onChange={e => set.price(e.target.value.replace(/[^0-9.]/g,''))} placeholder="2499" style={INP} /></div>
          <div style={{ flex:1 }}>
            <label style={LBL}>Category</label>
            <select value={cat} onChange={e => set.cat(e.target.value)} style={{ ...INP, appearance:'auto' }}>
              {PRODUCT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div><label style={LBL}>Shop link</label><input value={shopLink} onChange={e => set.shopLink(e.target.value)} placeholder="https://…" style={INP} /></div>
        <div><label style={LBL}>Why I picked this</label><textarea value={notes} onChange={e => set.notes(e.target.value)} placeholder="Tell shoppers why this is worth considering — how you use it, why you trust it, what makes it worth their money." rows={2} style={{ ...INP, resize:'vertical' }} /></div>
        {error && <p style={{ fontSize:12, color:'#c0392b' }}>{error}</p>}
      </div>
    </div>
  )
}

// ── modal shell ───────────────────────────────────────────────────
function ModalShell({ title, onClose, onSubmit, submitLabel, disabled, children }: { title:string; onClose:()=>void; onSubmit:()=>void; submitLabel:string; disabled?:boolean; children:React.ReactNode }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:16 }}>
      <div style={{ background:'#FAFAF8', width:'100%', maxWidth:840, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', borderRadius:4 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 28px 16px', borderBottom:'1px solid #E8E4DE' }}>
          <h2 style={{ fontFamily:SERIF, fontSize:24, fontWeight:400, color:'#1a1a1a' }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:'#aaa', cursor:'pointer' }}>×</button>
        </div>
        {children}
        <div style={{ padding:'0 28px 20px' }}>
          <button onClick={onSubmit} disabled={disabled} style={{ width:'100%', padding:'13px', background:'#0A0A0A', color:'#fff', border:'none', fontSize:12, letterSpacing:'0.1em', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: disabled ? 0.6 : 1 }}>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Modal ─────────────────────────────────────────────────────
function AddModal({ onClose, onAdd }: { onClose:()=>void; onAdd:(p:Product)=>void }) {
  const [url,      setUrl]      = useState('')
  const [img,      setImg]      = useState('')
  const [name,     setName]     = useState('')
  const [brand,    setBrand]    = useState('')
  const [price,    setPrice]    = useState('')
  const [cat,      setCat]      = useState(normalizeProductCategory('SKINCARE'))
  const [shopLink, setShopLink] = useState('')
  const [notes,    setNotes]    = useState('')
  const [preview,  setPreview]  = useState('')
  const [imgFile,  setImgFile]  = useState<File|null>(null)
  const [framing,  setFraming]  = useState<Framing>(DEFAULT_FRAMING)
  const [loading,  setLoading]  = useState(false)
  const [scraping, setScraping] = useState(false)
  const [msg,      setMsg]      = useState<{text:string;type:'ok'|'err'|'warn'|'info'}>()
  const [error,    setError]    = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = db()

  useEffect(() => { if (img && !imgFile) setPreview(img) }, [img])

  const scrape = async () => {
    if (!url.trim()) return
    setScraping(true); setShopLink(url.trim())
    // Clear every previous preview field (and any leftover warning/error
    // message) immediately, before the new fetch even starts — a failed or
    // partial fetch for a newly-pasted URL must never leave stale,
    // mismatched details from a different product on screen looking like a
    // successful fill. The pasted URL itself (the `url` field) is
    // deliberately left untouched. Re-run on every failure path below too,
    // so a partial response can never leave old price/category behind.
    const clearFields = () => { setName(''); setBrand(''); setPrice(''); setImg(''); setPreview(''); setImgFile(null); setFraming(DEFAULT_FRAMING); setCat(normalizeProductCategory('SKINCARE')) }
    clearFields()
    setMsg({ text:'Fetching product…', type:'info' })
    try {
      const r = await fetch('/api/product/preview', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url: url.trim() }) })
      const d = await r.json()
      if (!r.ok) { clearFields(); setMsg({ text: d.error ?? 'Could not fetch', type:'err' }); setScraping(false); return }
      if (d.title)    setName(d.title)
      if (d.brand)    setBrand(d.brand)
      if (d.price)    setPrice(d.price.replace(/[₹$£€]/g,''))
      if (d.image)    { setImg(d.image); setPreview(d.image) }
      if (d.url)      setShopLink(d.url)
      if (d.category) setCat(normalizeProductCategory(d.category))
      // A successful fetch can still be missing a field (e.g. an
      // out-of-stock listing with no current price) — that's a warning
      // to review, not a failure, and the fields it did find stay filled.
      if (d.warnings?.length) setMsg({ text: d.warnings.join(' '), type:'warn' })
      else setMsg({ text:'Details filled — review below', type:'ok' })
    } catch { clearFields(); setMsg({ text:'Could not fetch. Fill manually.', type:'err' }) }
    setScraping(false)
  }

  const save = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { setError('Please log in.'); return }
    if (!name.trim()) { setError('Please enter a product name'); return }
    if (!price.trim()) { setError('Please enter a price'); return }
    setLoading(true); setError('')
    let finalImg = img.trim()
    try {
      if (imgFile) finalImg = await uploadImage(supabase, user.id, imgFile, 'product-images')
    }
    catch { setError('Image upload failed'); setLoading(false); return }
    if (finalImg) {
      try {
        const crop = await fetch('/api/product/crop', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ imageUrl:finalImg, ...framing }) })
        if (!crop.ok) throw new Error('image_preparation_failed')
        const framedFile = new File([await crop.blob()], 'framed.jpg', { type:'image/jpeg' })
        finalImg = await uploadFramedImage(supabase, user.id, framedFile, 'product-images')
      } catch {
        // Framing improves presentation but must never prevent a valid product from being saved.
        // Keep the already-uploaded or retailer-provided image URL as the fallback.
      }
    }
    const { data, error: dbErr } = await supabase.from('storefront_products').insert({
      creator_id: user.id, title: name.trim(), brand: brand.trim(),
      price: price ? `₹${price}` : '', image_url: finalImg,
      product_url: shopLink.trim(), category: cat.toUpperCase().replace(/ & /g,' & '),
      description: notes.trim(), active: true,
    }).select().single()
    if (dbErr) { setError(dbErr.message); setLoading(false); return }
    logEvent(supabase, 'dashboard_product_add', { creatorId: user.id, productId: data.id })
    onAdd(data); onClose()
  }

  const formState: FormState = { img, name, brand, price, cat, shopLink, notes, preview, error, loading }
  const formSet:   FormSet   = { img:setImg, name:setName, brand:setBrand, price:setPrice, cat:setCat, shopLink:setShopLink, notes:setNotes, preview:setPreview, file:setImgFile }

  return (
    <ModalShell title="Add to closet" onClose={onClose} onSubmit={save} submitLabel={loading ? 'ADDING…' : 'ADD PIECE'} disabled={loading || !name.trim() || !price.trim()}>
      <div style={{ padding:'14px 28px', borderBottom:'1px solid #E8E4DE', display:'flex', gap:0 }}>
        <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key==='Enter' && scrape()} placeholder="Paste URL — Nykaa, Amazon, Myntra…" style={{ ...INP, borderRight:'none', flex:1 }} />
        <button onClick={scrape} disabled={scraping||!url.trim()} style={{ padding:'10px 18px', background:'#1a1a1a', color:'#fff', border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit', opacity: scraping||!url.trim() ? 0.5 : 1 }}>
          {scraping ? 'Fetching…' : 'Auto-fill ↓'}
        </button>
      </div>
      {msg && <p style={{ padding:'6px 28px 0', fontSize:11, color: msg.type==='ok' ? '#27ae60' : msg.type==='warn' ? '#b7791f' : msg.type==='info' ? '#888' : '#c0392b' }}>{msg.text}</p>}
      <ProductForm state={formState} set={formSet} fileRef={fileRef} framing={framing} onFramingChange={setFraming} />
    </ModalShell>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────
function EditModal({ product, onClose, onSave }: { product:Product; onClose:()=>void; onSave:(p:Product)=>void }) {
  const [img,      setImg]      = useState(product.image_url || '')
  const [name,     setName]     = useState(product.title)
  const [brand,    setBrand]    = useState(product.brand)
  const [price,    setPrice]    = useState(product.price?.replace(/[^0-9.]/g,'') || '')
  const [cat,      setCat]      = useState(normalizeProductCategory(product.category))
  const [shopLink, setShopLink] = useState(product.product_url || '')
  const [notes,    setNotes]    = useState(product.description || '')
  const [preview,  setPreview]  = useState(product.image_url || '')
  const [imgFile,  setImgFile]  = useState<File|null>(null)
  const [framing,  setFraming]  = useState<Framing>(DEFAULT_FRAMING)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = db()

  useEffect(() => { if (img && !imgFile) setPreview(img) }, [img])

  const save = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { setError('Please log in.'); return }
    if (!name.trim()) { setError('Please enter a product name'); return }
    setLoading(true); setError('')
    let finalImg = img.trim()
    try {
      if (imgFile) finalImg = await uploadImage(supabase, user.id, imgFile, 'product-images')
    }
    catch { setError('Image upload failed'); setLoading(false); return }
    const imageChanged = finalImg !== (product.image_url || '')
    const framingChanged = framing.zoom !== DEFAULT_FRAMING.zoom || framing.x !== DEFAULT_FRAMING.x || framing.y !== DEFAULT_FRAMING.y
    if (finalImg && (imgFile || imageChanged || framingChanged)) {
      try {
        const crop = await fetch('/api/product/crop', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ imageUrl:finalImg, ...framing }) })
        if (!crop.ok) throw new Error('image_preparation_failed')
        const framedFile = new File([await crop.blob()], 'framed.jpg', { type:'image/jpeg' })
        finalImg = await uploadFramedImage(supabase, user.id, framedFile, 'product-images')
      } catch {
        // Use the browser as a fallback for CDN images that reject server fetching.
        try {
          const framedFile = await createClientFramedImage(finalImg, framing)
          finalImg = await uploadFramedImage(supabase, user.id, framedFile, 'product-images')
        } catch {
          // Keep the original image and continue saving the product fields. A framing
          // failure must not make an otherwise valid edit appear unsaved.
        }
      }
    }
    const updates = {
      title: name.trim(), brand: brand.trim(),
      price: price ? `₹${price}` : '', image_url: finalImg,
      product_url: shopLink.trim(), category: cat.toUpperCase().replace(/ & /g,' & '),
      description: notes.trim(),
    }
    const { data: savedProduct, error: dbErr } = await supabase
      .from('storefront_products')
      .update(updates)
      .eq('id', product.id)
      .eq('creator_id', user.id)
      .select()
      .single()
    if (dbErr) { setError(dbErr.message); setLoading(false); return }
    if (!savedProduct) { setError('We could not save this product. Please try again.'); setLoading(false); return }
    onSave(savedProduct); onClose()
  }

  const formState: FormState = { img, name, brand, price, cat, shopLink, notes, preview, error, loading }
  const formSet:   FormSet   = { img:setImg, name:setName, brand:setBrand, price:setPrice, cat:setCat, shopLink:setShopLink, notes:setNotes, preview:setPreview, file:setImgFile }

  return (
    <ModalShell title="Edit product" onClose={onClose} onSubmit={save} submitLabel={loading ? 'SAVING…' : 'SAVE CHANGES'} disabled={loading}>
      <ProductForm state={formState} set={formSet} fileRef={fileRef} framing={framing} onFramingChange={setFraming} />
    </ModalShell>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────
export default function DashboardHome() {
  const [products,        setProducts]        = useState<Product[]>([])
  const [tab,             setTab]             = useState('ALL')
  const [subCategory,     setSubCategory]     = useState('')
  const [search,          setSearch]          = useState('')
  const [modal,           setModal]           = useState(false)
  const [editProduct,     setEditProduct]     = useState<Product|null>(null)
  const [openMenu,        setOpenMenu]        = useState<string|null>(null)
  const [profile,         setProfile]         = useState<Profile>({ name:'', username:'', avatar_url:'', followers:0 })
  const [categoryPinned,  setCategoryPinned]  = useState(false)
  const categoryRailRef = useRef<HTMLDivElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const supabase = db()

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.tdot, .dmenu')) setOpenMenu(null)
    }
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

  useEffect(() => {
    const load = async () => {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) return
      const fallback = {
        name:     (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Creator',
        username: (user.user_metadata?.username  as string) || user.email?.split('@')[0] || '',
        avatar:   (user.user_metadata?.avatar_url as string) || '',
      }
      const { data } = await supabase.from('profiles').select('display_name, username, avatar_url').eq('id', user.id).maybeSingle()
      setProfile({
        name:       data?.display_name || fallback.name,
        username:   data?.username     || fallback.username,
        avatar_url: data?.avatar_url   || fallback.avatar,
        followers:  0,
      })
    }
    load()
  }, [])

  const uploadAvatar = async (file: File) => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    setUploadingAvatar(true)
    try {
      const publicUrl = await uploadImage(supabase, user.id, file, 'avatars')
      const { data: existing } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
      if (existing) {
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      } else {
        const u = user.email?.split('@')[0] || `user${user.id.slice(0,8)}`
        await supabase.from('profiles').insert({ id: user.id, avatar_url: publicUrl, username: u, display_name: u })
      }
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
    } catch { alert('Could not upload photo.') }
    setUploadingAvatar(false)
  }

  const count = (t:string) => t==='ALL' ? products.length : t==='WISHLIST' ? products.filter(p=>p.wishlisted).length : products.filter(p=>matchesProductCategory(p.category, t)).length

  const activeCategory = subCategory || tab
  const filtered = products.filter(p => {
    const catOk  = activeCategory==='ALL' || (activeCategory==='WISHLIST' ? p.wishlisted : matchesProductCategory(p.category, activeCategory))
    const srchOk = !search || [p.title,p.brand].some(s=>s?.toLowerCase().includes(search.toLowerCase()))
    return catOk && srchOk
  })

  useEffect(() => {
    const syncCategoryRail = () => {
      const rail = categoryRailRef.current
      if (!rail) return

      const navigationHeight = 52
      setCategoryPinned(window.scrollY + navigationHeight >= rail.offsetTop)
    }

    syncCategoryRail()
    window.addEventListener('scroll', syncCategoryRail, { passive:true })
    window.addEventListener('resize', syncCategoryRail)
    return () => {
      window.removeEventListener('scroll', syncCategoryRail)
      window.removeEventListener('resize', syncCategoryRail)
    }
  }, [tab])

  const totalValue = products.reduce((s,p) => s + (parseFloat(p.price?.replace(/[^0-9.]/g,'')||'0')||0), 0)

  const toggleWish = async (id:string) => {
    const p = products.find(x => x.id===id); if (!p) return
    setProducts(prev => prev.map(x => x.id===id ? {...x, wishlisted:!p.wishlisted} : x))
    const { data:{ user } } = await supabase.auth.getUser()
    if (user) await supabase.from('storefront_products').update({ wishlisted:!p.wishlisted }).eq('id', id)
  }

  const remove = async (id:string) => {
    setProducts(prev => prev.filter(x => x.id!==id))
    const { data:{ user } } = await supabase.auth.getUser()
    if (user) await supabase.from('storefront_products').update({ active:false }).eq('id', id)
  }

  const S: React.CSSProperties = { fontFamily:SERIF, fontWeight:300, color:'#0A0A0A' }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" rel="stylesheet" />
      <style>{`
        .cat-tab{background:none;border:none;border-bottom:2px solid transparent;padding:12px 14px;font-size:11px;font-weight:500;letter-spacing:0.08em;color:#9B9B9B;cursor:pointer;white-space:nowrap;font-family:inherit;transition:all 0.15s;flex-shrink:0}
        .cat-tab:hover{color:#0A0A0A}
        .cat-tab.on{color:#0A0A0A;border-bottom-color:#0A0A0A}
        .cat-tab.wl{color:#C53030}
        .cat-tab.wl.on{border-bottom-color:#C53030}
        .makeup-subtabs{display:flex;gap:8px;overflow-x:auto;padding:10px 32px;background:#F8F6F2;border-bottom:0.5px solid #EBEBEB;-webkit-overflow-scrolling:touch}
        .makeup-subtabs::-webkit-scrollbar{display:none}
        .makeup-subtab{flex-shrink:0;border:1px solid #DDD8D0;background:#fff;color:#6C6255;padding:7px 10px;font-size:10px;letter-spacing:0.04em;cursor:pointer;font-family:inherit}
        .makeup-subtab.on{background:#0A0A0A;border-color:#0A0A0A;color:#fff}
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
        .av-wrap:hover .av-overlay{opacity:1}
        .dash-category-rail{position:sticky;top:52px;z-index:40;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.04)}
        .dash-category-rail.is-pinned{box-shadow:0 4px 12px rgba(0,0,0,0.08)}
        .dash-tabs-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
        .dash-tabs-wrap::-webkit-scrollbar{display:none}
        .dash-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .dash-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
        .dash-actions{display:flex;align-items:center;gap:24px}
        .product-form{min-height:0}

        @media (max-width: 900px) {
          .dash-grid{grid-template-columns:repeat(3,1fr) !important}
        }
        @media (max-width: 768px) {
          .dash-header{padding:28px 20px 20px !important}
          .dash-tabs-wrap{padding:0 20px !important}
          .cat-tab{padding:10px 10px !important;font-size:10px !important}
          .dash-content{padding:20px 16px !important}
          .dash-title{font-size:34px !important}
          .dash-grid{grid-template-columns:repeat(2,1fr) !important;gap:10px !important}
          .dash-topbar{flex-direction:column !important;align-items:flex-start !important;gap:16px !important}
          .dash-actions{width:100% !important;justify-content:space-between !important;flex-wrap:wrap !important;gap:12px !important}
          .dash-stat-n{font-size:20px !important}
          .product-form{padding:20px !important;gap:20px !important}
          .product-form-media{width:184px !important}
        }
        @media (max-width: 420px) {
          .dash-actions .addbtn{order:-1;width:100%;justify-content:center}
          .product-form{flex-direction:column !important}
          .product-form-media{width:100% !important;max-width:240px !important;margin:0 auto}
        }
      `}</style>

      {/* Profile header */}
      <div className="dash-header" style={{ background:'#F0EDE8', borderBottom:'0.5px solid #DED9D1', padding:'40px 32px 24px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
        <div className="av-wrap" onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
          style={{ position:'relative', width:96, height:96, borderRadius:'50%', overflow:'hidden', background:'#fff', border:'1.5px solid #C8C4BC', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, cursor:'pointer' }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ ...S, fontSize:40, fontWeight:400, color:'#B07D4A' }}>{profile.name?.[0]?.toUpperCase() || '?'}</span>}
          <div className="av-overlay" style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', opacity: uploadingAvatar ? 1 : 0, transition:'opacity 0.15s' }}>
            <span style={{ fontSize:10, color:'#fff', letterSpacing:'0.05em', textTransform:'uppercase' }}>{uploadingAvatar ? 'Uploading…' : 'Change photo'}</span>
          </div>
        </div>
        <input ref={avatarInputRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = '' }} />
        <p style={{ fontSize:14, fontStyle:'italic', fontFamily:SERIF, color:'#5C5C5C', marginBottom:4 }}>Curated by</p>
        <h1 style={{ ...S, fontSize:36, lineHeight:1.1, marginBottom:10 }}>{profile.name || 'Creator'}</h1>
        <p style={{ fontSize:12, color:'#9B9B9B', letterSpacing:'0.04em' }}>@{profile.username} · {profile.followers.toLocaleString('en-IN')} followers</p>
      </div>

      {/* Category controls stay together beneath the dashboard navigation while browsing. */}
      <div ref={categoryRailRef} className={`dash-category-rail${categoryPinned ? ' is-pinned' : ''}`}>
        <div className="dash-tabs-wrap" style={{ background:'#fff', borderBottom:'0.5px solid #EBEBEB', display:'flex', padding:'0 32px' }}>
          {STORE_CATEGORIES.map(c => (
            <button key={c} onClick={() => { setTab(c); setSubCategory('') }} className={`cat-tab${tab===c?' on':''}${c==='WISHLIST'?' wl':''}`}>
              {c==='WISHLIST' && '♥ '}{c} <span style={{ fontSize:10, opacity:0.5, marginLeft:2 }}>{count(c)}</span>
            </button>
          ))}
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

      {/* Content */}
      <div className="dash-content" style={{ background:'#fff', minHeight:'calc(100vh - 100px)', padding:'32px' }}>
        <div className="dash-topbar">
          <div>
            <p style={{ fontSize:10, letterSpacing:'0.16em', color:'#B07D4A', textTransform:'uppercase', marginBottom:6 }}>YOUR WARDROBE, CURATED</p>
            <h2 className="dash-title" style={{ ...S, fontSize:48, lineHeight:1 }}>The Collection</h2>
          </div>
          <div className="dash-actions">
            <button onClick={() => setModal(true)} className="addbtn">+ ADD PIECE</button>
            {[{ n:products.length, l:'Pieces' },{ n:`₹${Math.round(totalValue).toLocaleString('en-IN')}`, l:'Closet value' },{ n:products.filter(p=>p.wishlisted).length, l:'Wishlisted' }].map(s => (
              <div key={s.l} style={{ textAlign:'right' }}>
                <p className="dash-stat-n" style={{ ...S, fontSize:28, lineHeight:1 }}>{s.n}</p>
                <p style={{ fontSize:10, color:'#9B9B9B', marginTop:3, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your closet…"
          style={{ width:'100%', maxWidth:360, padding:'9px 14px', border:'0.5px solid #DDDBD6', background:'#fff', fontSize:13, outline:'none', fontFamily:'inherit', color:'#0A0A0A', borderRadius:4, marginBottom:20 }} />

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <p style={{ ...S, fontSize:36, fontStyle:'italic', color:'rgba(0,0,0,0.08)', marginBottom:14 }}>{products.length===0 ? 'Your closet is empty.' : 'Nothing here.'}</p>
            <p style={{ fontSize:13, color:'#9B9B9B', marginBottom:24 }}>{products.length===0 ? 'Start curating products you love.' : 'Try a different category.'}</p>
            {products.length===0 && <button onClick={() => setModal(true)} className="addbtn">+ ADD YOUR FIRST PIECE</button>}
          </div>
        ) : (
          <div className="dash-grid" style={{ gap:0, background:'#fff' }}>
            {filtered.map(p => (
              <div key={p.id} className="pcard">
                <button className="tdot" onClick={e => { e.stopPropagation(); setOpenMenu(openMenu===p.id ? null : p.id) }}>···</button>
                {openMenu===p.id && (
                  <div className="dmenu" onClick={e => e.stopPropagation()}>
                    <button className="ditem" onClick={() => { setEditProduct(p); setOpenMenu(null) }}><i className="ti ti-edit" aria-hidden="true"></i>Edit product</button>
                    <button className="ditem" onClick={() => { navigator.clipboard.writeText(`curatekin.com/r/${p.id}`); setOpenMenu(null) }}><i className="ti ti-link" aria-hidden="true"></i>Copy shop link</button>
                    <button className="ditem" onClick={() => { toggleWish(p.id); setOpenMenu(null) }}><i className="ti ti-heart" aria-hidden="true"></i>{p.wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}</button>
                    <button className="ditem red" onClick={() => { remove(p.id); setOpenMenu(null) }}><i className="ti ti-trash" aria-hidden="true"></i>Remove from shop</button>
                  </div>
                )}
                <Link href={`/product/${p.id}`} style={{ display:'block', color:'inherit', textDecoration:'none' }}>
                  <div style={{ aspectRatio:'4/5', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', padding:12 }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.title} style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'center' }} />
                      : <span style={{ ...S, fontSize:36, fontStyle:'italic', color:'rgba(0,0,0,0.1)' }}>{p.title?.[0]}</span>}
                  </div>
                  <div style={{ padding:'16px 18px 20px', display:'flex', flexDirection:'column', height:132, overflow:'hidden' }}>
                    <p style={{ fontSize:9, letterSpacing:'0.04em', textTransform:'uppercase', color:'#756E66', marginBottom:5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.brand} <span aria-hidden="true">•</span> {p.category}</p>
                    <p style={{ fontSize:14, fontWeight:500, color:'#0A0A0A', lineHeight:1.35, marginBottom:7, height:'2.7em', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.title}</p>
                    <p style={{ ...S, fontSize:18, marginTop:'auto' }}>{p.price}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal       && <AddModal  onClose={() => setModal(false)}      onAdd={p => setProducts(prev => [p, ...prev])} />}
      {editProduct && <EditModal onClose={() => setEditProduct(null)} product={editProduct} onSave={u => setProducts(prev => prev.map(p => p.id===u.id ? u : p))} />}
    </>
  )
}
