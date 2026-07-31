'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Product = {
  id: string
  title: string
  brand: string
  image_url: string
  category: string
}

type Edit = {
  id: string
  title: string
  cover_image_url: string | null
  status: 'draft' | 'published'
  created_at: string
  published_at: string | null
  productIds: string[]
}

const serif = 'Cormorant Garamond, Georgia, serif'

function editProducts(edit: Edit, products: Product[]) {
  return edit.productIds
    .map(id => products.find(product => product.id === id))
    .filter((product): product is Product => Boolean(product))
}

export default function EditsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [edits, setEdits] = useState<Edit[]>([])
  const [selectedEditId, setSelectedEditId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [setupNeeded, setSetupNeeded] = useState(false)

  const selectedEdit = edits.find(edit => edit.id === selectedEditId) ?? null
  const selectedProducts = useMemo(
    () => selectedProductIds
      .map(id => products.find(product => product.id === id))
      .filter((product): product is Product => Boolean(product)),
    [products, selectedProductIds]
  )

  useEffect(() => {
    let active = true

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (active) setLoading(false)
        return
      }

      const { data: ownProducts } = await supabase
        .from('storefront_products')
        .select('id, title, brand, image_url, category')
        .eq('creator_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false })

      const { data: editRows, error: editsError } = await supabase
        .from('creator_edits')
        .select('id, title, cover_image_url, status, created_at, published_at')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      if (!active) return
      setProducts(ownProducts ?? [])

      if (editsError) {
        setSetupNeeded(true)
        setLoading(false)
        return
      }

      const ids = (editRows ?? []).map(edit => edit.id)
      const { data: joins } = ids.length
        ? await supabase
            .from('creator_edit_products')
            .select('edit_id, product_id, position')
            .in('edit_id', ids)
            .order('position', { ascending: true })
        : { data: [] as { edit_id: string; product_id: string; position: number }[] }

      const productIdsByEdit = new Map<string, string[]>()
      ;(joins ?? []).forEach(join => {
        productIdsByEdit.set(join.edit_id, [...(productIdsByEdit.get(join.edit_id) ?? []), join.product_id])
      })

      setEdits((editRows ?? []).map(edit => ({
        ...edit,
        status: edit.status as Edit['status'],
        productIds: productIdsByEdit.get(edit.id) ?? [],
      })))
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [])

  const startNew = () => {
    setSelectedEditId(null)
    setTitle('')
    setSelectedProductIds([])
    setNotice('')
  }

  const openEdit = (edit: Edit) => {
    setSelectedEditId(edit.id)
    setTitle(edit.title)
    setSelectedProductIds(edit.productIds)
    setNotice('')
  }

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(previous => previous.includes(productId)
      ? previous.filter(id => id !== productId)
      : [...previous, productId]
    )
  }

  const save = async (nextStatus: Edit['status']) => {
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setNotice('Give this Edit a title first.')
      return
    }
    if (!selectedProductIds.length) {
      setNotice('Choose at least one piece for this Edit.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)
    setNotice('')
    const now = new Date().toISOString()
    const values = {
      title: cleanTitle,
      cover_image_url: selectedProducts[0]?.image_url ?? null,
      status: nextStatus,
      updated_at: now,
      published_at: nextStatus === 'published' ? now : null,
    }

    let editId = selectedEditId
    if (editId) {
      const { error } = await supabase
        .from('creator_edits')
        .update(values)
        .eq('id', editId)
        .eq('creator_id', user.id)
      if (error) {
        setNotice('Could not save this Edit. Please try again.')
        setSaving(false)
        return
      }
      const { error: deleteError } = await supabase
        .from('creator_edit_products')
        .delete()
        .eq('edit_id', editId)
      if (deleteError) {
        setNotice('The Edit title saved, but its pieces could not be updated.')
        setSaving(false)
        return
      }
    } else {
      const { data, error } = await supabase
        .from('creator_edits')
        .insert({ ...values, creator_id: user.id })
        .select('id')
        .single()
      if (error || !data) {
        setSetupNeeded(true)
        setNotice('Edits need one small database setup before they can be saved.')
        setSaving(false)
        return
      }
      editId = data.id
    }

    if (!editId) {
      setNotice('Could not save this Edit. Please try again.')
      setSaving(false)
      return
    }

    const { error: productError } = await supabase
      .from('creator_edit_products')
      .insert(selectedProductIds.map((productId, position) => ({ edit_id: editId, product_id: productId, position })))

    if (productError) {
      setNotice('The Edit was saved, but its pieces could not be added. Please try again.')
      setSaving(false)
      return
    }

    const savedEdit: Edit = {
      id: editId,
      title: cleanTitle,
      cover_image_url: selectedProducts[0]?.image_url ?? null,
      status: nextStatus,
      created_at: selectedEdit?.created_at ?? now,
      published_at: nextStatus === 'published' ? now : null,
      productIds: selectedProductIds,
    }
    setEdits(previous => [savedEdit, ...previous.filter(edit => edit.id !== editId)])
    setSelectedEditId(editId)
    setNotice(nextStatus === 'published' ? 'Published to your public storefront.' : 'Draft saved.')
    setSaving(false)
  }

  if (loading) {
    return <div style={{ padding: 48, fontFamily: serif, fontSize: 28, color: '#8C867E' }}>Loading Edits...</div>
  }

  const editing = selectedEdit || title || selectedProductIds.length

  return (
    <div style={{ background: '#F8F6F2', minHeight: 'calc(100vh - 52px)', padding: '38px clamp(20px, 4vw, 64px) 72px', color: '#181615' }}>
      <style>{`
        .edit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        .edit-card{border:1px solid #E5E0D9;background:#fff;text-align:left;padding:0;overflow:hidden;cursor:pointer;color:inherit;font-family:inherit}
        .edit-card:hover{border-color:#B07D4A}
        .edit-cover{aspect-ratio:16/10;background:#F0EDE8;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .edit-cover img{width:100%;height:100%;object-fit:contain;padding:22px}
        .edit-product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
        .edit-product{border:1px solid #E5E0D9;background:#fff;padding:0;text-align:left;cursor:pointer;color:inherit;font-family:inherit;overflow:hidden}
        .edit-product.on{border:2px solid #0A0A0A}
        .edit-product img{width:100%;aspect-ratio:1/1;object-fit:contain;padding:12px;background:#fff;display:block}
        @media(max-width:900px){.edit-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.edit-product-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:560px){.edit-grid{grid-template-columns:1fr}.edit-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 30 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.16em', color: '#B07D4A', marginBottom: 7 }}>CURATORIAL EDITS</p>
          <h1 style={{ fontFamily: serif, fontWeight: 300, fontSize: 'clamp(38px, 5vw, 58px)', lineHeight: 0.95 }}>Tell a fuller story.</h1>
          <p style={{ marginTop: 12, fontSize: 13, color: '#756E66', maxWidth: 520, lineHeight: 1.55 }}>Group your pieces into a point of view that shoppers can browse on your storefront.</p>
        </div>
        <button type="button" onClick={startNew} style={{ border: 0, background: '#0A0A0A', color: '#fff', padding: '12px 20px', fontSize: 11, letterSpacing: '0.1em', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>+ NEW EDIT</button>
      </div>

      {setupNeeded && (
        <div style={{ background: '#FFF8E8', border: '1px solid #E5D0A6', padding: '16px 18px', marginBottom: 26, fontSize: 13, color: '#5D4A2B', lineHeight: 1.5 }}>
          <strong style={{ display: 'block', marginBottom: 4 }}>One-time Edits setup needed.</strong>
          Run <code>EDITS_MIGRATION.sql</code> in the Supabase SQL Editor. The page is ready; this creates the secure storage for drafts and published Edits.
        </div>
      )}

      {!editing ? (
        edits.length ? (
          <div className="edit-grid">
            {edits.map(edit => {
              const pieces = editProducts(edit, products)
              return <button type="button" className="edit-card" key={edit.id} onClick={() => openEdit(edit)}>
                <div className="edit-cover">
                  {edit.cover_image_url ? <img src={edit.cover_image_url} alt="" /> : <span style={{ fontFamily: serif, fontSize: 42, color: '#C5BDB3' }}>{edit.title[0]}</span>}
                </div>
                <div style={{ padding: '16px 18px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 10, letterSpacing: '0.12em', color: edit.status === 'published' ? '#527A5B' : '#9A7B4D' }}>{edit.status.toUpperCase()}</span>
                    <span style={{ fontSize: 11, color: '#8C867E' }}>{pieces.length} piece{pieces.length === 1 ? '' : 's'}</span>
                  </div>
                  <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 28, lineHeight: 1.05 }}>{edit.title}</h2>
                </div>
              </button>
            })}
          </div>
        ) : (
          <div style={{ border: '1px solid #E5E0D9', background: '#fff', padding: '64px 24px', textAlign: 'center' }}>
            <p style={{ fontFamily: serif, fontSize: 34, marginBottom: 10 }}>Your first Edit starts with a feeling.</p>
            <p style={{ color: '#8C867E', fontSize: 13, marginBottom: 22 }}>Choose a few pieces you would recommend together.</p>
            <button type="button" onClick={startNew} style={{ border: 0, background: '#0A0A0A', color: '#fff', padding: '12px 20px', fontSize: 11, letterSpacing: '0.1em', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>CREATE AN EDIT</button>
          </div>
        )
      ) : (
        <section style={{ border: '1px solid #E5E0D9', background: '#fff', padding: 'clamp(20px, 3vw, 34px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
            <button type="button" onClick={() => { setSelectedEditId(null); setTitle(''); setSelectedProductIds([]); setNotice('') }} style={{ border: 0, background: 'transparent', padding: 0, color: '#756E66', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer' }}>← ALL EDITS</button>
            {selectedEdit?.status === 'published' && <span style={{ fontSize: 10, letterSpacing: '0.12em', color: '#527A5B' }}>LIVE ON YOUR STOREFRONT</span>}
          </div>
          <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', color: '#8C867E', marginBottom: 8 }}>EDIT TITLE</label>
          <input value={title} onChange={event => setTitle(event.target.value)} maxLength={120} placeholder="My everyday uniform" style={{ width: '100%', border: 'none', borderBottom: '1px solid #CFC8BE', padding: '8px 0 12px', fontFamily: serif, fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 400, outline: 'none', color: '#181615', background: 'transparent', marginBottom: 30 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, marginBottom: 13, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontFamily: serif, fontSize: 26, marginBottom: 3 }}>Choose the pieces</p>
              <p style={{ fontSize: 12, color: '#8C867E' }}>The first selected item becomes the Edit cover. Select in the order you want them shown.</p>
            </div>
            <span style={{ fontSize: 12, color: '#756E66' }}>{selectedProductIds.length} selected</span>
          </div>
          {products.length ? (
            <div className="edit-product-grid">
              {products.map(product => {
                const selectedIndex = selectedProductIds.indexOf(product.id)
                return <button type="button" key={product.id} onClick={() => toggleProduct(product.id)} className={`edit-product${selectedIndex >= 0 ? ' on' : ''}`}>
                  <div style={{ position: 'relative' }}>
                    {product.image_url ? <img src={product.image_url} alt="" /> : <div style={{ aspectRatio: '1/1', background: '#F0EDE8' }} />}
                    {selectedIndex >= 0 && <span style={{ position: 'absolute', top: 9, right: 9, width: 24, height: 24, borderRadius: '50%', background: '#0A0A0A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{selectedIndex + 1}</span>}
                  </div>
                  <div style={{ padding: '10px 11px 12px' }}>
                    <p style={{ fontSize: 9, letterSpacing: '0.06em', color: '#8C867E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>{product.brand}</p>
                    <p style={{ fontSize: 12, lineHeight: 1.35, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.title}</p>
                  </div>
                </button>
              })}
            </div>
          ) : (
            <p style={{ padding: '38px 0', textAlign: 'center', color: '#8C867E', fontSize: 13 }}>Add pieces to your storefront first, then return here to make an Edit.</p>
          )}
          {notice && <p style={{ marginTop: 18, fontSize: 13, color: notice.startsWith('Could') || notice.startsWith('The Edit') || notice.startsWith('Edits need') || notice.startsWith('Give') || notice.startsWith('Choose') ? '#B24032' : '#527A5B' }}>{notice}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
            <button type="button" disabled={saving} onClick={() => save('draft')} style={{ border: '1px solid #181615', background: '#fff', color: '#181615', padding: '12px 18px', fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.09em', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}>SAVE DRAFT</button>
            <button type="button" disabled={saving} onClick={() => save('published')} style={{ border: 0, background: '#0A0A0A', color: '#fff', padding: '12px 18px', fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.09em', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'SAVING...' : 'PUBLISH EDIT'}</button>
          </div>
        </section>
      )}
    </div>
  )
}
