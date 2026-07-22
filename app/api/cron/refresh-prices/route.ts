import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300

type Product = { id: string; product_url: string | null; price: string | null }

function originFor(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '')
  if (configured) return configured

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!host) return null
  const protocol = request.headers.get('x-forwarded-proto') ?? 'https'
  return `${protocol}://${host}`
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

async function refreshProduct(
  product: Product,
  previewUrl: string,
  supabase: SupabaseClient
) {
  const checkedAt = new Date().toISOString()

  try {
    const response = await fetch(previewUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: product.product_url }),
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    })
    const payload = await response.json().catch(() => null) as { price?: unknown; originalPrice?: unknown } | null
    const currentPrice = typeof payload?.price === 'string' ? payload.price.trim() : ''
    const originalPrice = typeof payload?.originalPrice === 'string' ? payload.originalPrice.trim() : ''

    if (!response.ok || !currentPrice) {
      const { error } = await supabase
        .from('storefront_products')
        .update({ price_status: 'failed', price_checked_at: checkedAt })
        .eq('id', product.id)
      return !error && { updated: false, failed: true }
    }

    const { error } = await supabase
      .from('storefront_products')
      .update({
        price: currentPrice,
        price_current: currentPrice,
        price_original: originalPrice || null,
        price_status: 'fresh',
        price_checked_at: checkedAt,
      })
      .eq('id', product.id)

    return !error && { updated: true, failed: false }
  } catch {
    const { error } = await supabase
      .from('storefront_products')
      .update({ price_status: 'failed', price_checked_at: checkedAt })
      .eq('id', product.id)
    return !error && { updated: false, failed: true }
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const origin = originFor(request)

  if (!supabaseUrl || !serviceRoleKey || !origin) {
    return NextResponse.json({ error: 'Price refresh is not configured' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const limitValue = Number.parseInt(request.nextUrl.searchParams.get('limit') ?? '25', 10)
  const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 50) : 25

  const { data: products, error } = await supabase
    .from('storefront_products')
    .select('id, product_url, price')
    .eq('active', true)
    .not('product_url', 'is', null)
    .order('price_checked_at', { ascending: true, nullsFirst: true })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: 'Could not load products for refresh' }, { status: 500 })
  }

  const previewUrl = new URL('/api/product/preview', origin).toString()
  let updated = 0
  let failed = 0
  let cursor = 0
  const typedProducts = (products ?? []) as Product[]

  const worker = async () => {
    while (cursor < typedProducts.length) {
      const product = typedProducts[cursor]
      cursor += 1
      if (!product.product_url) continue
      const result = await refreshProduct(product, previewUrl, supabase)
      if (!result) continue
      if (result.updated) updated += 1
      if (result.failed) failed += 1
    }
  }

  await Promise.all(Array.from({ length: Math.min(4, typedProducts.length) }, worker))

  return NextResponse.json({ processed: typedProducts.length, updated, failed })
}
