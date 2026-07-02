import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: product } = await supabase
    .from('storefront_products')
    .select('product_url')
    .eq('id', productId)
    .single()

  if (!product?.product_url) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Log the click, but never let a logging failure block the redirect —
  // the shopper reaching the product matters more than the click record.
  try {
    await supabase.from('clicks').insert({ product_id: productId })
  } catch {}

  return NextResponse.redirect(product.product_url)
}