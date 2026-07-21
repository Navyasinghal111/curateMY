'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function SaveProductButton({ productId, productTitle }: { productId: string; productTitle: string }) {
  const [saved, setSaved] = useState(false)
  const [ready, setReady] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let active = true

    const loadSavedState = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (active) setReady(true)
        return
      }

      const { data } = await supabase
        .from('saved_products')
        .select('product_id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle()

      if (active) {
        setSaved(Boolean(data))
        setReady(true)
      }
    }

    loadSavedState()
    return () => { active = false }
  }, [productId, supabase])

  const toggleSaved = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.assign('/login')
      return
    }

    const wasSaved = saved
    setSaved(!wasSaved)

    const result = wasSaved
      ? await supabase.from('saved_products').delete().eq('user_id', user.id).eq('product_id', productId)
      : await supabase.from('saved_products').insert({ user_id: user.id, product_id: productId })

    if (result.error) setSaved(wasSaved)
  }

  return (
    <button
      type="button"
      className={`product-save${saved ? ' saved' : ''}`}
      aria-label={saved ? `Remove ${productTitle} from wishlist` : `Save ${productTitle} to wishlist`}
      aria-pressed={saved}
      disabled={!ready}
      onClick={toggleSaved}
    >
      <span aria-hidden="true">{saved ? '★' : '☆'}</span>
      {saved ? 'Saved to wishlist' : 'Save to wishlist'}
    </button>
  )
}
